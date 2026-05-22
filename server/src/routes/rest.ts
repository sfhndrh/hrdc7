import fs from "node:fs";
import path from "node:path";
import { Router } from "express";
import bcrypt from "bcrypt";
import multer, { MulterError } from "multer";
import { z } from "zod";

import {
  attachUser,
  clearAuthCookie,
  requireAuth,
  requireRoles,
  setAuthCookie,
  signAuthToken,
} from "../auth.js";
import { getApiBaseUrl } from "../config/env.js";
import { respondIfClientSuspended } from "../lib/client-suspension.js";
import { respondIfTrainerSuspended } from "../lib/trainer-suspension.js";
import {
  isClientProfileComplete,
  mapClientRegistration,
  parseProfileDataJson,
  patchClientSchema,
  profileTypeLabel,
  registerClientSchema,
} from "../lib/client-profile.js";
import {
  COMPANY_PROFILE_PHOTO_DIR,
  deleteUploadByPublicUrl,
  ensureUploadDirs,
  HRDC_CERT_UPLOAD_DIR,
  resolveHrdcCertPath,
  PAYMENT_PROOF_DIR,
  PAYMENT_QR_DIR,
  TRAINER_PROFILE_PHOTO_DIR,
} from "../lib/uploads.js";
import {
  DEMO_SUBSCRIPTION_DETAILS,
  demoSubscriptionRequestedMs,
} from "../lib/admin-demo-subscriptions.js";
import { formatAdminTableDate } from "../lib/format-datetime.js";
import { asStringArray } from "../lib/jsonArrays.js";
import { DELIVERY_MODE_OPTIONS } from "../lib/trainer-delivery-modes.js";
import { asCount, execute, queryAll, queryOne, withTransaction } from "../db/query.js";
import { newId } from "../db/ids.js";
import type { SubStatus } from "../db/types.js";

export const restRouter = Router();

ensureUploadDirs();

function makeProfilePhotoUpload(targetDir: string) {
  return multer({
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => {
        cb(null, targetDir);
      },
      filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${newId()}${ext}`);
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const okExt = [".png", ".jpg", ".jpeg", ".webp"].includes(ext);
      const okMime =
        file.mimetype === "image/png" ||
        file.mimetype === "image/jpeg" ||
        file.mimetype === "image/webp";
      if (okExt && okMime) {
        cb(null, true);
        return;
      }
      cb(new Error("Use PNG, JPEG, or WebP, max 5MB."));
    },
  });
}

const clientProfilePhotoUpload = makeProfilePhotoUpload(COMPANY_PROFILE_PHOTO_DIR);
const trainerProfilePhotoUpload = makeProfilePhotoUpload(TRAINER_PROFILE_PHOTO_DIR);
const paymentQrUpload = makeProfilePhotoUpload(PAYMENT_QR_DIR);

const paymentProofUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, PAYMENT_PROOF_DIR);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${newId()}${ext}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const okExt = [".pdf", ".png", ".jpg", ".jpeg", ".webp"].includes(ext);
    const okMime =
      file.mimetype === "application/pdf" ||
      file.mimetype === "image/png" ||
      file.mimetype === "image/jpeg" ||
      file.mimetype === "image/webp";
    if (okExt && okMime) {
      cb(null, true);
      return;
    }
    cb(new Error("Use a PDF or image file (PNG, JPEG, WebP), max 10MB."));
  },
});

const hrdcCertUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, HRDC_CERT_UPLOAD_DIR);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${newId()}${ext}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const okExt = [".pdf", ".png", ".jpg", ".jpeg"].includes(ext);
    const okMime =
      file.mimetype === "application/pdf" ||
      file.mimetype === "image/png" ||
      file.mimetype === "image/jpeg";
    if (okExt && okMime) {
      cb(null, true);
      return;
    }
    cb(new Error("Use a PDF or image file (PNG, JPEG), max 10MB."));
  },
});

const isoNow = () => new Date().toISOString();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

restRouter.post("/auth/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload" });
    return;
  }
  const email = parsed.data.email.toLowerCase().trim();
  const user = await queryOne<{
    id: string;
    email: string;
    passwordHash: string;
    role: string;
  }>(`SELECT "id","email","passwordHash","role" FROM "User" WHERE "email" = ?`, [email]);
  if (!user) {
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }
  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!ok) {
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }
  if (user.role === "CLIENT") {
    if (await respondIfClientSuspended(user.id, res)) return;
  }
  if (user.role === "TRAINER") {
    if (await respondIfTrainerSuspended(user.id, res)) return;
  }
  if (user.role === "TRAINING_PROVIDER") {
    const tp = await queryOne<{ accountStatus: string | null; suspensionReason: string | null }>(
      `SELECT "accountStatus", "suspensionReason" FROM "TpOrganization" WHERE "userId" = ?`,
      [user.id],
    );
    if (tp?.accountStatus === "SUSPENDED") {
      res.status(403).json({
        code: "ACCOUNT_SUSPENDED",
        error: "Your training provider account has been suspended by an administrator.",
        suspensionReason: tp.suspensionReason?.trim() ?? "",
      });
      return;
    }
  }
  const token = signAuthToken({
    sub: user.id,
    email: user.email,
    role: user.role as "ADMIN" | "TRAINER" | "CLIENT" | "TRAINING_PROVIDER",
  });
  setAuthCookie(res, token);
  res.json({
    ok: true,
    user: { id: user.id, email: user.email, role: user.role },
  });
});

restRouter.post("/auth/logout", (_req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

restRouter.get("/auth/session", (req, res) => {
  const u = attachUser(req);
  if (!u) {
    res.json({ user: null });
    return;
  }
  res.json({
    user: { id: u.sub, email: u.email, role: u.role },
  });
});

restRouter.post("/register/client", async (req, res) => {
  const parsed = registerClientSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid payload",
      details: parsed.error.flatten(),
    });
    return;
  }
  const data = parsed.data;
  const email = data.email.toLowerCase().trim();
  const existing = await queryOne<{ id: string }>(
    `SELECT "id" FROM "User" WHERE "email" = ?`,
    [email],
  );
  if (existing) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }
  const passwordHash = await bcrypt.hash(data.password, 12);
  const mapped = mapClientRegistration({
    email,
    fullName: data.fullName,
    phone: data.phone,
    profileType: data.profileType,
    profileData: data.profileData as Record<string, unknown>,
    contactEmail: data.contactEmail,
  });
  const profileComplete = isClientProfileComplete(data.profileType, mapped);
  const uid = newId();
  const cid = newId();
  const t = isoNow();
  await withTransaction(async (client) => {
    await execute(
      `INSERT INTO "User" ("id","email","passwordHash","role","createdAt") VALUES (?,?,?,?,?)`,
      [uid, email, passwordHash, "CLIENT", t],
      client,
    );
    await execute(
      `INSERT INTO "Client" ("id","userId","companyName","regNumber","industry","contactName","contactEmail","phone","address","profilePhoto","profileType","profileData","profileComplete","createdAt","updatedAt")
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        cid,
        uid,
        mapped.companyName,
        mapped.regNumber,
        mapped.industry,
        mapped.contactName,
        mapped.contactEmail,
        mapped.phone,
        mapped.address,
        data.profilePhoto,
        mapped.profileType,
        mapped.profileDataJson,
        profileComplete,
        t,
        t,
      ],
      client,
    );
  });
  res.status(201).json({ ok: true, user: { id: uid, email } });
});

const optionalTrimmed = (max: number) =>
  z
    .string()
    .max(max)
    .optional()
    .transform((s) => (s && s.trim() ? s.trim() : null));

const allowedDelivery = new Set<string>(DELIVERY_MODE_OPTIONS);

const registerTrainerSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
    fullName: z.string().min(2),
    phone: z.string().min(5),
    bio: z.string().min(10),
    expertise: z.array(z.string().min(1).max(120)).min(1).max(30),
    yearsExp: z.number().int().min(0),
    linkedIn: z.string().url().optional().or(z.literal("")),
    portfolioUrl: z.string().url().optional().or(z.literal("")),
    certFileUrl: z
      .string()
      .min(1)
      .refine((s) => s !== "pending-upload", "Upload your HRDC certificate")
      .refine(
        (s) =>
          s.startsWith("/api/uploads/certificates/") ||
          s.startsWith("/uploads/") ||
          /^https?:\/\//i.test(s),
        "Invalid certificate file reference",
      ),
    stateOrLocation: optionalTrimmed(200),
    languages: optionalTrimmed(500),
    deliveryModes: z
      .array(z.string())
      .min(1, "Select at least one delivery mode")
      .max(10)
      .refine((arr) => arr.every((m) => allowedDelivery.has(m)), "Invalid delivery mode"),
    willingToTravel: z.enum(["Yes", "No"]),
    travelLocations: z.array(z.string().min(1).max(120)).max(30).default([]),
    profilePhoto: z
      .preprocess(
        (v) => (v == null || v === "" ? null : String(v).trim()),
        z
          .string()
          .max(600)
          .nullable()
          .refine(
            (s) =>
              s === null ||
              s.startsWith("/api/uploads/trainer-photos/") ||
              /^https:\/\//i.test(s),
            "Invalid profile photo",
          ),
      )
      .optional()
      .transform((v) => v ?? null),
  })
  .superRefine((data, ctx) => {
    if (data.willingToTravel === "Yes" && data.travelLocations.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Add at least one travel location when you select Yes.",
        path: ["travelLocations"],
      });
    }
  });

restRouter.post("/register/trainer", async (req, res) => {
  const parsed = registerTrainerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid payload",
      details: parsed.error.flatten(),
    });
    return;
  }
  const data = parsed.data;
  const email = data.email.toLowerCase().trim();
  const existing = await queryOne<{ id: string }>(
    `SELECT "id" FROM "User" WHERE "email" = ?`,
    [email],
  );
  if (existing) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }
  const passwordHash = await bcrypt.hash(data.password, 12);
  const travelLocations =
    data.willingToTravel === "Yes" ? data.travelLocations : [];
  const uid = newId();
  const tid = newId();
  const t = isoNow();
  await withTransaction(async (client) => {
    await execute(
      `INSERT INTO "User" ("id","email","passwordHash","role","createdAt") VALUES (?,?,?,?,?)`,
      [uid, email, passwordHash, "TRAINER", t],
      client,
    );
    await execute(
      `INSERT INTO "Trainer" ("id","userId","fullName","phone","bio","expertise","yearsExp","linkedIn","portfolioUrl",
        "profilePhoto","stateOrLocation","languages","deliveryModes","willingToTravel","travelLocations","certFileUrl","status","createdAt","updatedAt")
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        tid,
        uid,
        data.fullName,
        data.phone,
        data.bio,
        JSON.stringify(data.expertise),
        data.yearsExp,
        data.linkedIn || null,
        data.portfolioUrl || null,
        data.profilePhoto,
        data.stateOrLocation,
        data.languages,
        JSON.stringify(data.deliveryModes),
        data.willingToTravel,
        JSON.stringify(travelLocations),
        data.certFileUrl,
        "PENDING",
        t,
        t,
      ],
      client,
    );
  });
  // Fire and forget — do not await, do not block the response
  setImmediate(() => {
    fetch(`${getApiBaseUrl()}/api/trainer/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trainerId: tid }),
    }).catch((err) => console.error("Verification trigger error:", err));
  });

  res
    .status(201)
    .json({ message: "Registration submitted. We will review your certificate shortly." });
});

restRouter.patch("/client/profile", requireAuth, async (req, res) => {
  const u = req.authUser!;
  if (u.role !== "CLIENT") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  if (await respondIfClientSuspended(u.sub, res)) return;
  const parsed = patchClientSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid payload",
      details: parsed.error.flatten(),
    });
    return;
  }
  const d = parsed.data;
  const mapped = mapClientRegistration({
    email: u.email,
    fullName: d.fullName,
    phone: d.phone,
    profileType: d.profileType,
    profileData: d.profileData as Record<string, unknown>,
    contactEmail: d.contactEmail,
  });
  const profileComplete = isClientProfileComplete(d.profileType, mapped);
  await execute(
    `UPDATE "Client" SET "companyName"=?, "regNumber"=?, "industry"=?, "contactName"=?, "contactEmail"=?, "phone"=?, "address"=?, "profileType"=?, "profileData"=?, "profileComplete"=?, "updatedAt"=?
     WHERE "userId"=?`,
    [
      mapped.companyName,
      mapped.regNumber,
      mapped.industry,
      mapped.contactName,
      mapped.contactEmail,
      mapped.phone,
      mapped.address,
      mapped.profileType,
      mapped.profileDataJson,
      profileComplete,
      isoNow(),
      u.sub,
    ],
  );
  res.json({ ok: true });
});

restRouter.delete("/client/account", requireAuth, async (req, res) => {
  const u = req.authUser!;
  if (u.role !== "CLIENT") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const client = await queryOne<{ id: string; profilePhoto: string | null }>(
    `SELECT "id", "profilePhoto" FROM "Client" WHERE "userId" = ?`,
    [u.sub],
  );
  if (!client) {
    res.status(404).json({ error: "Client not found" });
    return;
  }

  const subscriptions = await queryAll<{ proofUrl: string | null }>(
    `SELECT "proofUrl" FROM "Subscription" WHERE "clientId" = ?`,
    [client.id],
  );
  const payments = await queryAll<{ proofUrl: string | null }>(
    `SELECT "proofUrl" FROM "PaymentSubmission" WHERE "clientId" = ?`,
    [client.id],
  );

  const fileUrls = [
    client.profilePhoto,
    ...subscriptions.map((s) => s.proofUrl),
    ...payments.map((p) => p.proofUrl),
  ];

  const deleted = await execute(
    `DELETE FROM "User" WHERE "id" = ? AND "role" = 'CLIENT'`,
    [u.sub],
  );
  if (deleted.rowCount === 0) {
    res.status(404).json({ error: "Account not found" });
    return;
  }

  for (const url of fileUrls) {
    deleteUploadByPublicUrl(url);
  }

  clearAuthCookie(res);
  res.json({ ok: true });
});

const trainerAvailabilityPatchSchema = z.object({
  availabilityStatus: z.enum(["AVAILABLE", "LIMITED", "UNAVAILABLE"]),
  earliestStartDate: z.preprocess(
    (v) => (v == null || v === "" ? null : String(v)),
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format.")
      .nullable(),
  ),
});

restRouter.patch("/trainer/availability", requireAuth, async (req, res) => {
  const u = req.authUser!;
  if (u.role !== "TRAINER") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const parsed = trainerAvailabilityPatchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid availability data." });
    return;
  }
  const updated = await execute(
    `UPDATE "Trainer" SET "availabilityStatus"=?, "earliestStartDate"=?, "updatedAt"=?
     WHERE "userId"=?`,
    [
      parsed.data.availabilityStatus,
      parsed.data.earliestStartDate,
      isoNow(),
      u.sub,
    ],
  );
  if (updated.rowCount === 0) {
    res.status(404).json({ error: "Trainer not found" });
    return;
  }
  res.json({ ok: true });
});

restRouter.delete("/trainer/account", requireAuth, async (req, res) => {
  const u = req.authUser!;
  if (u.role !== "TRAINER") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const trainer = await queryOne<{ id: string; certFileUrl: string | null; profilePhoto: string | null }>(
    `SELECT "id", "certFileUrl", "profilePhoto" FROM "Trainer" WHERE "userId" = ?`,
    [u.sub],
  );
  if (!trainer) {
    res.status(404).json({ error: "Trainer not found" });
    return;
  }

  const fileUrls = [trainer.certFileUrl, trainer.profilePhoto];

  const deleted = await execute(
    `DELETE FROM "User" WHERE "id" = ? AND "role" = 'TRAINER'`,
    [u.sub],
  );
  if (deleted.rowCount === 0) {
    res.status(404).json({ error: "Account not found" });
    return;
  }

  for (const url of fileUrls) {
    deleteUploadByPublicUrl(url);
  }

  clearAuthCookie(res);
  res.json({ ok: true });
});

const trainerProfilePutSchema = z
  .object({
    fullName: z.string().trim().min(2).max(120),
    phone: z.string().trim().min(5).max(40),
    yearsExp: z.coerce.number().int().min(0).max(80),
    expertise: z.array(z.string().min(1).max(120)).min(1).max(30),
    bio: z.string().trim().min(10).max(5000),
    linkedIn: z.preprocess(
      (v) => (v == null ? "" : String(v)),
      z.string().trim().max(500).transform((s) => (s.length ? s : null)),
    ),
    portfolioUrl: z.preprocess(
      (v) => (v == null ? "" : String(v)),
      z.string().trim().max(500).transform((s) => (s.length ? s : null)),
    ),
    stateOrLocation: z.preprocess(
      (v) => (v == null ? "" : String(v)),
      z.string().trim().max(200).transform((s) => (s.length ? s : null)),
    ),
    languages: z.preprocess(
      (v) => (v == null ? "" : String(v)),
      z.string().trim().max(500).transform((s) => (s.length ? s : null)),
    ),
    deliveryModes: z
      .array(z.string())
      .min(1)
      .max(10)
      .refine((arr) => arr.every((m) => allowedDelivery.has(m)), "Invalid delivery mode"),
    willingToTravel: z.preprocess(
      (v) => (v == null || v === "" ? undefined : String(v)),
      z.enum(["Yes", "No"]),
    ),
    travelLocations: z.array(z.string().min(1).max(120)).max(30).default([]),
    redirectTo: z
      .string()
      .trim()
      .optional()
      .transform((s) => (s && s.startsWith("/") ? s : "/trainer/profile")),
  })
  .superRefine((data, ctx) => {
    if (data.willingToTravel === "Yes" && data.travelLocations.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Add at least one travel location when you select Yes.",
        path: ["travelLocations"],
      });
    }
  });

restRouter.put("/trainer/profile", requireAuth, async (req, res) => {
  const u = req.authUser!;
  if (u.role !== "TRAINER") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const parsed = trainerProfilePutSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid form data.",
      issues: parsed.error.issues,
    });
    return;
  }
  const data = parsed.data;
  const travelLocations =
    data.willingToTravel === "Yes" ? data.travelLocations : [];
  await execute(
    `UPDATE "Trainer" SET "fullName"=?, "phone"=?, "yearsExp"=?, "expertise"=?, "bio"=?, "linkedIn"=?, "portfolioUrl"=?,
      "stateOrLocation"=?, "languages"=?, "deliveryModes"=?, "willingToTravel"=?, "travelLocations"=?, "status"=?, "updatedAt"=?
     WHERE "userId"=?`,
    [
      data.fullName,
      data.phone,
      data.yearsExp,
      JSON.stringify(data.expertise),
      data.bio,
      data.linkedIn,
      data.portfolioUrl,
      data.stateOrLocation,
      data.languages,
      JSON.stringify(data.deliveryModes),
      data.willingToTravel,
      JSON.stringify(travelLocations),
      "UNDER_REVIEW",
      isoNow(),
      u.sub,
    ],
  );
  res.json({ ok: true, redirectTo: `${data.redirectTo}?saved=1` });
});

const profilePhotoUrlSchema = z.object({
  profilePhotoUrl: z
    .string()
    .trim()
    .min(1)
    .max(500)
    .refine(
      (s) =>
        s.startsWith("/api/uploads/company-photos/") ||
        s.startsWith("/api/uploads/trainer-photos/"),
      "Invalid profile photo URL.",
    ),
});

restRouter.patch("/client/profile-photo", requireAuth, async (req, res) => {
  const u = req.authUser!;
  if (u.role !== "CLIENT") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  if (await respondIfClientSuspended(u.sub, res)) return;
  const parsed = profilePhotoUrlSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload" });
    return;
  }
  await execute(
    `UPDATE "Client" SET "profilePhoto"=?, "updatedAt"=? WHERE "userId"=?`,
    [parsed.data.profilePhotoUrl, isoNow(), u.sub],
  );
  res.json({ ok: true, profilePhotoUrl: parsed.data.profilePhotoUrl });
});

const trainerCertFileUrlSchema = z.object({
  certFileUrl: z
    .string()
    .min(1)
    .refine((s) => s !== "pending-upload", "Upload your HRDC certificate")
    .refine(
      (s) =>
        s.startsWith("/api/uploads/certificates/") ||
        s.startsWith("/uploads/") ||
        /^https?:\/\//i.test(s),
      "Invalid certificate file reference",
    ),
});

restRouter.patch("/trainer/certificate", requireAuth, async (req, res) => {
  const u = req.authUser!;
  if (u.role !== "TRAINER") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const parsed = trainerCertFileUrlSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid payload",
      details: parsed.error.flatten(),
    });
    return;
  }

  const row = await queryOne<{ id: string; certFileUrl: string }>(
    `SELECT "id", "certFileUrl" FROM "Trainer" WHERE "userId" = ?`,
    [u.sub],
  );
  if (!row) {
    res.status(404).json({ error: "Trainer not found" });
    return;
  }

  const newUrl = parsed.data.certFileUrl;
  const oldUrl = String(row.certFileUrl ?? "").trim();
  const now = isoNow();

  await execute(
    `UPDATE "Trainer" SET "certFileUrl"=?, "status"='UNDER_REVIEW', "adminNote"=NULL, "updatedAt"=? WHERE "id"=?`,
    [newUrl, now, row.id],
  );

  if (
    oldUrl &&
    oldUrl !== newUrl &&
    oldUrl.startsWith("/api/uploads/certificates/")
  ) {
    try {
      const filename = path.basename(oldUrl);
      const certPath = resolveHrdcCertPath(filename);
      if (fs.existsSync(certPath)) fs.unlinkSync(certPath);
    } catch {
      /* best-effort cleanup */
    }
  }

  fetch(`${getApiBaseUrl()}/api/trainer/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ trainerId: row.id, force: true }),
  }).catch((err) => console.error("Certificate re-verify trigger error:", err));

  res.json({
    ok: true,
    certFileUrl: newUrl,
    message: "Certificate updated. AI verification is running.",
  });
});

restRouter.patch("/trainer/profile-photo", requireAuth, async (req, res) => {
  const u = req.authUser!;
  if (u.role !== "TRAINER") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const parsed = profilePhotoUrlSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload" });
    return;
  }
  await execute(
    `UPDATE "Trainer" SET "profilePhoto"=?, "updatedAt"=? WHERE "userId"=?`,
    [parsed.data.profilePhotoUrl, isoNow(), u.sub],
  );
  res.json({ ok: true, profilePhotoUrl: parsed.data.profilePhotoUrl });
});

restRouter.get("/trainer/me", requireAuth, async (req, res) => {
  const u = req.authUser!;
  if (u.role !== "TRAINER" && u.role !== "ADMIN") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  if (u.role === "ADMIN") {
    res.json({ trainer: null, isAdminViewer: true });
    return;
  }
  if (await respondIfTrainerSuspended(u.sub, res)) return;
  const row = await queryOne<Record<string, unknown>>(
    `SELECT * FROM "Trainer" WHERE "userId" = ?`,
    [u.sub],
  );
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const qv = await queryOne<Record<string, unknown>>(
    `SELECT * FROM ai_verification WHERE trainer_id = ?`,
    [String(row.id)],
  );
  const av = await queryOne<Record<string, unknown>>(
    `SELECT * FROM "AiVerification" WHERE "trainerId" = ?`,
    [String(row.id)],
  );
  const expertise = asStringArray(JSON.parse(String(row.expertise)));
  const deliveryModes = asStringArray(JSON.parse(String(row.deliveryModes)));
  const travelLocations = asStringArray(JSON.parse(String(row.travelLocations)));

  let aiVerification: Record<string, unknown> | null = null;
  if (qv) {
    const flagsArr = JSON.parse(String(qv.flags ?? "[]") || "[]");
    const flags = Array.isArray(flagsArr) ? (flagsArr as unknown[]).map(String) : [];
    aiVerification = {
      validCert: Boolean(qv.overall_passed),
      extractedName: qv.cert_name,
      certNumber: qv.cert_number,
      issueDate: qv.cert_issue_date,
      expiryDate: qv.cert_expiry_date,
      domain: qv.cert_domain,
      confidence: qv.confidence_score,
      flags,
      summary: qv.summary,
      aiRecommendation: qv.ai_recommendation,
    };
  } else if (av) {
    const flagsRaw = av.flags;
    const flagsArr = Array.isArray(flagsRaw)
      ? (flagsRaw as unknown[]).map(String)
      : typeof flagsRaw === "string"
        ? asStringArray(JSON.parse(flagsRaw))
        : [];
    aiVerification = {
      validCert: Boolean(av.validCert),
      extractedName: av.extractedName,
      certNumber: av.certNumber,
      issueDate: av.issueDate,
      expiryDate: av.expiryDate,
      domain: av.domain,
      confidence: av.confidence,
      flags: flagsArr,
      summary: av.summary,
    };
  }

  res.json({
    trainer: {
      id: row.id,
      status: row.status,
      adminNote: row.adminNote,
      fullName: row.fullName,
      phone: row.phone,
      bio: row.bio,
      expertise,
      yearsExp: row.yearsExp,
      certFileUrl: row.certFileUrl,
      portfolioUrl: row.portfolioUrl,
      linkedIn: row.linkedIn,
      stateOrLocation: row.stateOrLocation,
      languages: row.languages,
      deliveryModes,
      willingToTravel: row.willingToTravel,
      travelLocations,
      profilePhoto:
        typeof row.profilePhoto === "string" && String(row.profilePhoto).trim()
          ? String(row.profilePhoto).trim()
          : null,
      availabilityStatus: row.availabilityStatus ?? null,
      earliestStartDate: row.earliestStartDate ?? null,
      aiVerification,
    },
    isAdminViewer: false,
  });
});

restRouter.get("/trainer/verification", requireAuth, async (req, res) => {
  const u = req.authUser!;
  if (u.role !== "TRAINER") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const trow = await queryOne<{ id: string }>(
    `SELECT "id" FROM "Trainer" WHERE "userId" = ?`,
    [u.sub],
  );
  if (!trow) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const verification = await queryOne<Record<string, unknown>>(
    `SELECT * FROM ai_verification WHERE trainer_id = ?`,
    [trow.id],
  );
  if (!verification) {
    res.status(404).json({ error: "No verification found" });
    return;
  }
  res.json(serializeAiVerificationRow(verification));
});

restRouter.get("/client/me", requireAuth, async (req, res) => {
  const u = req.authUser!;
  if (u.role !== "CLIENT" && u.role !== "ADMIN") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  if (u.role === "ADMIN") {
    res.json({ client: null, isAdminViewer: true });
    return;
  }
  if (await respondIfClientSuspended(u.sub, res)) return;
  const client = await queryOne<Record<string, unknown>>(
    `SELECT c.*, u."email" as "userEmail",
        s."id" as "sub_id", s."status" as "sub_status", s."planType" as "sub_planType", s."amount" as "sub_amount",
        s."proofUrl" as "sub_proofUrl", s."requestedAt" as "sub_requestedAt", s."paidAt" as "sub_paidAt", s."expiresAt" as "sub_expiresAt", s."approvedBy" as "sub_approvedBy"
       FROM "Client" c
       JOIN "User" u ON u."id" = c."userId"
       LEFT JOIN "Subscription" s ON s."clientId" = c."id"
       WHERE c."userId" = ?`,
    [u.sub],
  );
  if (!client) {
    res.json({ client: null, isAdminViewer: false });
    return;
  }
  const subscription =
    client.sub_id != null
      ? {
          id: client.sub_id,
          clientId: client.id,
          status: client.sub_status,
          planType: client.sub_planType,
          amount: client.sub_amount,
          proofUrl: client.sub_proofUrl,
          requestedAt: client.sub_requestedAt,
          paidAt: client.sub_paidAt,
          expiresAt: client.sub_expiresAt,
          approvedBy: client.sub_approvedBy,
        }
      : null;
  const profileType =
    typeof client.profileType === "string" && client.profileType
      ? client.profileType
      : "COMPANY";
  res.json({
    client: {
      id: client.id,
      userId: client.userId,
      companyName: client.companyName,
      regNumber: client.regNumber,
      industry: client.industry,
      contactName: client.contactName,
      contactEmail: client.contactEmail ?? null,
      phone: client.phone,
      address: client.address,
      profilePhoto: client.profilePhoto ?? null,
      profileType,
      profileData: parseProfileDataJson(client.profileData),
      profileComplete: Boolean(client.profileComplete),
      accountStatus: client.accountStatus === "SUSPENDED" ? "SUSPENDED" : "ACTIVE",
      suspensionReason:
        typeof client.suspensionReason === "string" ? client.suspensionReason : null,
      suspendedAt: typeof client.suspendedAt === "string" ? client.suspendedAt : null,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
      user: { email: client.userEmail },
      subscription,
    },
    isAdminViewer: false,
  });
});

function subscriptionIsActive(status: SubStatus, expiresAt: string | null): boolean {
  if (status !== "ACTIVE") return false;
  if (expiresAt && new Date(expiresAt).getTime() < Date.now()) return false;
  return true;
}

/** Company cancels their own active subscription immediately. */
restRouter.post(
  "/client/subscription/cancel",
  requireRoles(["CLIENT"]),
  async (req, res) => {
    const u = req.authUser!;
    const client = await queryOne<{ id: string }>(
      `SELECT "id" FROM "Client" WHERE "userId" = ?`,
      [u.sub],
    );
    if (!client) {
      res.status(404).json({ error: "Client not found" });
      return;
    }
    const sub = await queryOne<{ id: string; status: string }>(
      `SELECT "id","status" FROM "Subscription" WHERE "clientId" = ?`,
      [client.id],
    );
    if (!sub) {
      res.status(404).json({ error: "No subscription to cancel" });
      return;
    }
    if (sub.status !== "ACTIVE") {
      res
        .status(400)
        .json({ error: "Only active subscriptions can be cancelled." });
      return;
    }
    const now = isoNow();
    await execute(
      `UPDATE "Subscription"
          SET "status" = 'EXPIRED',
              "expiresAt" = ?
        WHERE "id" = ?`,
      [now, sub.id],
    );
    res.json({ status: "EXPIRED", expiresAt: now });
  },
);

restRouter.get("/client/dashboard", requireAuth, async (req, res) => {
  const u = req.authUser!;
  if (u.role !== "CLIENT" && u.role !== "ADMIN") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  if (u.role === "ADMIN") {
    res.json({
      isAdmin: true,
      companyName: null,
      subscriptionLabel: null,
      profileLabel: null,
      coursesListed: null,
      subActive: false,
    });
    return;
  }
  if (await respondIfClientSuspended(u.sub, res)) return;
  const row = await queryOne<{
    companyName: string;
    profileComplete: boolean;
    subStatus: string | null;
    subExpires: string | null;
  }>(
    `SELECT c."companyName", c."profileComplete",
        s."status" as "subStatus", s."expiresAt" as "subExpires"
       FROM "Client" c
       LEFT JOIN "Subscription" s ON s."clientId" = c."id"
       WHERE c."userId" = ?`,
    [u.sub],
  );
  const companyName = row?.companyName ?? "";
  const profileLabel = row?.profileComplete ? "Complete" : "Incomplete";
  const subActive =
    !!row?.subStatus &&
    row.subStatus === "ACTIVE" &&
    (!row.subExpires || new Date(row.subExpires) > new Date());
  let subscriptionLabel = "Free";
  if (subActive) subscriptionLabel = "Pro";
  else if (row?.subStatus === "PROOF_UPLOADED") subscriptionLabel = "Proof uploaded";
  else if (row?.subStatus === "PENDING_PAYMENT") subscriptionLabel = "Pending payment";
  const coursesListed = asCount(
    await queryOne<{ c: number | string }>(
      `SELECT count(*)::int as c
       FROM "TpCourse" c
       JOIN "TpOrganization" o ON o."id" = c."tpOrgId"
       WHERE c."isPublished" = true AND o."status" = 'APPROVED'`,
    ),
  );
  res.json({
    isAdmin: false,
    companyName,
    subscriptionLabel,
    subscriptionExpiresAt: subActive ? row?.subExpires ?? null : null,
    profileLabel,
    coursesListed,
    subActive,
  });
});

restRouter.get("/admin/dashboard-stats", requireRoles(["ADMIN"]), async (_req, res) => {
  /** Trainers awaiting admin approve/reject (not already decided). */
  const pendingApprovals = asCount(
    await queryOne<{ c: number | string }>(
      `SELECT count(*)::int as c FROM "Trainer" WHERE "status" IN ('PENDING', 'UNDER_REVIEW')`,
    ),
  );
  const activeSubscriptions = asCount(
    await queryOne<{ c: number | string }>(
      `SELECT count(*)::int as c FROM "Subscription" WHERE "status" = 'ACTIVE'`,
    ),
  );
  /** Employer subscription payments awaiting admin approve/reject. */
  const pendingPaymentApprovals = asCount(
    await queryOne<{ c: number | string }>(
      `SELECT count(*)::int as c FROM "Subscription" WHERE "status" IN ('PENDING_PAYMENT','PROOF_UPLOADED')`,
    ),
  );
  res.json({
    pendingApprovals,
    activeSubscriptions,
    pendingPaymentApprovals,
  });
});

const MONTH_LABELS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const EXPERTISE_COLORS = [
  "#6366f1",
  "#ec4899",
  "#14b8a6",
  "#f59e0b",
  "#0ea5e9",
  "#8b5cf6",
  "#22c55e",
  "#ef4444",
  "#0891b2",
  "#a855f7",
  "#84cc16",
  "#f97316",
];

restRouter.get("/admin/dashboard-analytics", requireRoles(["ADMIN"]), async (_req, res) => {
  // ---- Registrations: last 6 months bucketed by year-month -------------
  const now = new Date();
  const buckets: Array<{ key: string; label: string; trainers: number; companies: number }> = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    buckets.push({
      key,
      label: MONTH_LABELS_SHORT[d.getMonth()] ?? key,
      trainers: 0,
      companies: 0,
    });
  }
  const oldestKey = buckets[0]?.key ?? `${now.getFullYear()}-01`;
  const oldestStartIso = new Date(`${oldestKey}-01T00:00:00.000Z`).toISOString();

  const trainerRows = await queryAll<{ ym: string; c: number }>(
    `SELECT substring("createdAt" from 1 for 7) as ym, count(*)::int as c
       FROM "Trainer"
       WHERE "createdAt" >= ?
       GROUP BY ym`,
    [oldestStartIso],
  );
  const clientRows = await queryAll<{ ym: string; c: number }>(
    `SELECT substring("createdAt" from 1 for 7) as ym, count(*)::int as c
       FROM "Client"
       WHERE "createdAt" >= ?
       GROUP BY ym`,
    [oldestStartIso],
  );

  const bucketByKey = new Map(buckets.map((b) => [b.key, b]));
  for (const row of trainerRows) {
    const b = bucketByKey.get(row.ym);
    if (b) b.trainers = row.c;
  }
  for (const row of clientRows) {
    const b = bucketByKey.get(row.ym);
    if (b) b.companies = row.c;
  }

  // ---- Expertise: count occurrences across all trainers ----------------
  const expertiseRaw = await queryAll<{ expertise: string }>(
    `SELECT "expertise" FROM "Trainer"`,
  );
  const counts = new Map<string, number>();
  for (const row of expertiseRaw) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(row.expertise ?? "[]");
    } catch {
      parsed = [];
    }
    const labels = asStringArray(parsed);
    for (const raw of labels) {
      const label = raw.trim();
      if (!label) continue;
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
  }
  const expertise = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([label, value], idx) => ({
      label,
      value,
      color: EXPERTISE_COLORS[idx % EXPERTISE_COLORS.length] ?? "#6366f1",
    }));

  res.json({
    registrations: {
      labels: buckets.map((b) => b.label),
      trainers: buckets.map((b) => b.trainers),
      companies: buckets.map((b) => b.companies),
    },
    expertise,
  });
});

function trainerSubtitle(expertiseJson: string): string {
  const ar = asStringArray(JSON.parse(expertiseJson));
  if (!ar.length) return "Trainer profile";
  return ar.slice(0, 3).join(", ");
}

/** Normalizes an `ai_verification` row for API responses (admin + trainer self-service). */
function serializeAiVerificationRow(verification: Record<string, unknown>) {
  return {
    ...verification,
    flags: JSON.parse(String(verification.flags ?? "[]") || "[]"),
    rawResponse: JSON.parse(String(verification.raw_response ?? "{}") || "{}"),
    overallPassed: Boolean(verification.overall_passed),
    certIsHrdc: Boolean(verification.cert_is_hrdc),
    certExpired: Boolean(verification.cert_expired),
    certHasSeal: Boolean(verification.cert_has_seal),
    certTampered: Boolean(verification.cert_tampered),
    nameMatchesReg: Boolean(verification.name_matches_reg),
  };
}

/** Public-to-company browse listing: only approved trainers, browse-card fields only. */
restRouter.get("/client/trainers", requireRoles(["CLIENT", "ADMIN"]), async (_req, res) => {
  const rows = await queryAll<{
    id: string;
    fullName: string;
    expertise: string;
    yearsExp: number;
    languages: string | null;
    stateOrLocation: string | null;
    deliveryModes: string;
    profilePhoto: string | null;
  }>(
    `SELECT t."id", t."fullName", t."expertise", t."yearsExp", t."languages",
              t."stateOrLocation", t."deliveryModes", t."profilePhoto",
              t."approvedAt", t."createdAt"
       FROM "Trainer" t
       WHERE t."status" = 'APPROVED'
       ORDER BY COALESCE(t."approvedAt", t."createdAt") DESC`,
  );
  res.json({
    trainers: rows.map((t) => {
      const expertise = asStringArray(JSON.parse(t.expertise || "[]"));
      const delivery = asStringArray(JSON.parse(t.deliveryModes || "[]"));
      return {
        id: t.id,
        fullName: t.fullName,
        title: expertise.slice(0, 3).join(", ") || "Certified trainer",
        location: t.stateOrLocation ?? "",
        languages: t.languages ?? "",
        yearsExp: t.yearsExp,
        deliveryModes: delivery.join(", "),
        profilePhoto: t.profilePhoto,
        topics: expertise,
      };
    }),
  });
});

/** Single approved trainer for the company browse → details flow. */
restRouter.get("/client/trainers/:id", requireRoles(["CLIENT", "ADMIN"]), async (req, res) => {
  const row = await queryOne<Record<string, unknown>>(
    `SELECT t.*, u."email" as "userEmail"
       FROM "Trainer" t JOIN "User" u ON u."id" = t."userId"
       WHERE t."id" = ? AND t."status" = 'APPROVED'`,
    [req.params.id],
  );
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({
    trainer: {
      id: row.id,
      fullName: row.fullName,
      email: row.userEmail,
      phone: row.phone,
      bio: row.bio,
      expertise: asStringArray(JSON.parse(String(row.expertise || "[]"))),
      yearsExp: row.yearsExp,
      linkedIn: row.linkedIn,
      portfolioUrl: row.portfolioUrl,
      profilePhoto: row.profilePhoto,
      stateOrLocation: row.stateOrLocation,
      languages: row.languages,
      deliveryModes: asStringArray(JSON.parse(String(row.deliveryModes || "[]"))),
      willingToTravel: row.willingToTravel,
      travelLocations: asStringArray(JSON.parse(String(row.travelLocations || "[]"))),
      certFileUrl: row.certFileUrl,
      approvedAt: row.approvedAt,
      createdAt: row.createdAt,
    },
  });
});

function serializeClientBrowseCourse(row: Record<string, unknown>) {
  return {
    id: row.id,
    title: row.title,
    courseCode: row.courseCode,
    category: row.category,
    description: row.description,
    learningOutcomes: row.learningOutcomes,
    duration: row.duration,
    deliveryMode: row.deliveryMode,
    hrdcClaimable: row.hrdcClaimable,
    courseFee: Number(row.courseFee ?? 0),
    maxParticipants: Number(row.maxParticipants ?? 0),
    language: row.language,
    skillLevel: row.skillLevel,
    trainingLocation: row.trainingLocation ?? null,
    materialsNote: row.materialsNote ?? null,
    providerName: row.providerName ?? row.providername ?? "",
    tpOrgId: row.tpOrgId ?? null,
    brochureUrl: row.brochureUrl ?? null,
    slidesUrl: row.slidesUrl ?? null,
    sampleMaterialsUrl: row.sampleMaterialsUrl ?? null,
  };
}

/** Published courses from approved training providers for employer browse. */
restRouter.get("/client/courses", requireRoles(["CLIENT", "ADMIN"]), async (_req, res) => {
  const rows = await queryAll<Record<string, unknown>>(
    `SELECT c.*, o."companyName" AS "providerName", o."id" AS "tpOrgId"
     FROM "TpCourse" c
     JOIN "TpOrganization" o ON o."id" = c."tpOrgId"
     WHERE c."isPublished" = true AND o."status" = 'APPROVED'
     ORDER BY c."updatedAt" DESC`,
  );
  res.json({ courses: rows.map(serializeClientBrowseCourse) });
});

restRouter.get("/client/courses/:id", requireRoles(["CLIENT", "ADMIN"]), async (req, res) => {
  const row = await queryOne<Record<string, unknown>>(
    `SELECT c.*, o."companyName" AS "providerName", o."id" AS "tpOrgId"
     FROM "TpCourse" c
     JOIN "TpOrganization" o ON o."id" = c."tpOrgId"
     WHERE c."id" = ? AND c."isPublished" = true AND o."status" = 'APPROVED'`,
    [req.params.id],
  );
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ course: serializeClientBrowseCourse(row) });
});

restRouter.get("/admin/trainers", requireRoles(["ADMIN"]), async (_req, res) => {
  const rows = await queryAll<{
    id: string;
    fullName: string;
    expertise: string;
    phone: string;
    status: string;
    profilePhoto: string | null;
    email: string;
  }>(
    `SELECT t."id", t."fullName", t."expertise", t."phone", t."status", t."profilePhoto", u."email"
       FROM "Trainer" t JOIN "User" u ON u."id" = t."userId"
       ORDER BY t."fullName" ASC`,
  );
  res.json({
    trainers: rows.map((t) => {
      const rawPhoto = t.profilePhoto;
      const profilePhoto =
        typeof rawPhoto === "string" && rawPhoto.trim() ? rawPhoto.trim() : null;
      return {
        id: t.id,
        fullName: t.fullName,
        subtitle: trainerSubtitle(t.expertise),
        email: t.email,
        phone: t.phone,
        status: t.status,
        profilePhoto,
      };
    }),
  });
});

restRouter.get("/admin/trainers/:id", requireRoles(["ADMIN"]), async (req, res) => {
  const row = await queryOne<Record<string, unknown>>(
    `SELECT t.*, u."email" as "userEmail" FROM "Trainer" t JOIN "User" u ON u."id" = t."userId" WHERE t."id" = ?`,
    [req.params.id],
  );
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const userEmail = String(row.userEmail);
  res.json({
    trainer: {
      id: row.id,
      userId: row.userId,
      fullName: row.fullName,
      phone: row.phone,
      bio: row.bio,
      expertise: asStringArray(JSON.parse(String(row.expertise))),
      yearsExp: row.yearsExp,
      linkedIn: row.linkedIn,
      portfolioUrl: row.portfolioUrl,
      profilePhoto: row.profilePhoto,
      stateOrLocation: row.stateOrLocation,
      languages: row.languages,
      deliveryModes: asStringArray(JSON.parse(String(row.deliveryModes))),
      willingToTravel: row.willingToTravel,
      travelLocations: asStringArray(JSON.parse(String(row.travelLocations))),
      certFileUrl: row.certFileUrl,
      status: row.status,
      adminNote: row.adminNote,
      approvedAt: row.approvedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      accountStatus: row.accountStatus === "SUSPENDED" ? "SUSPENDED" : "ACTIVE",
      suspensionReason:
        typeof row.suspensionReason === "string" ? row.suspensionReason : null,
      suspendedAt: typeof row.suspendedAt === "string" ? row.suspendedAt : null,
      user: { email: userEmail },
    },
  });
});

restRouter.get(
  "/admin/trainers/:id/verification",
  requireRoles(["ADMIN"]),
  async (req, res) => {
    const verification = await queryOne<Record<string, unknown>>(
      `SELECT * FROM ai_verification WHERE trainer_id = ?`,
      [req.params.id],
    );

    if (!verification) {
      res.status(404).json({ error: "No verification found" });
      return;
    }

    res.json(serializeAiVerificationRow(verification));
  },
);

restRouter.post(
  "/admin/trainers/:id/verify-rerun",
  requireRoles(["ADMIN"]),
  async (req, res) => {
    await execute(`UPDATE "Trainer" SET "status" = 'PENDING' WHERE "id" = ?`, [
      req.params.id,
    ]);

    fetch(`${getApiBaseUrl()}/api/trainer/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trainerId: req.params.id }),
    }).catch((err) => console.error("Re-run trigger error:", err));

    res.json({ message: "Verification re-running. Refresh in 10-15 seconds." });
  },
);

restRouter.patch("/admin/trainers/:id/approve", requireRoles(["ADMIN"]), async (req, res) => {
  const trainerId = req.params.id;
  await execute(
    `UPDATE "Trainer" SET "status" = 'APPROVED', "approvedAt" = ? WHERE "id" = ?`,
    [new Date().toISOString(), trainerId],
  );
  res.json({ message: "Trainer approved" });
});

restRouter.patch("/admin/trainers/:id/reject", requireRoles(["ADMIN"]), async (req, res) => {
  const trainerId = req.params.id;
  const adminNote = (req.body as { adminNote?: unknown } | undefined)?.adminNote;
  const note = adminNote == null || adminNote === "" ? null : String(adminNote);
  await execute(`UPDATE "Trainer" SET "status" = 'REJECTED', "adminNote" = ? WHERE "id" = ?`, [
    note,
    trainerId,
  ]);
  await execute(`DELETE FROM notifications WHERE trainer_id = ?`, [trainerId]);
  res.json({ message: "Trainer rejected" });
});

function mapAdminApprovalRow(row: Record<string, unknown>) {
  let trainerExpertiseLabel = "—";
  const expertiseRaw = row.trainerExpertiseJson ?? row.trainerexpertisejson ?? "[]";
  try {
    const ex = asStringArray(JSON.parse(String(expertiseRaw)));
    trainerExpertiseLabel = ex.slice(0, 6).join(", ") || "—";
  } catch {
    /* keep — */
  }
  const rawPhoto = row.trainerProfilePhoto ?? row.trainerprofilephoto;
  const profilePhoto =
    typeof rawPhoto === "string" && rawPhoto.trim() ? rawPhoto.trim() : null;
  const notifType = String(row.type ?? "");
  const tpOrgId = row.tp_org_id != null ? String(row.tp_org_id) : "";
  const trainerStatus = String(row.trainerStatus ?? row.trainerstatus ?? "");
  const tpOrgStatus = String(row.tpOrgStatus ?? row.tporgstatus ?? "");
  const accountStatus = tpOrgId ? tpOrgStatus : trainerStatus;
  const approvalRole =
    notifType === "TP_SIGNUP" || tpOrgId
      ? "Training Provider"
      : notifType.startsWith("CLIENT") || notifType === "CLIENT_SIGNUP"
        ? "Employer"
        : "Trainer";
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    trainer_id: row.trainer_id,
    tp_org_id: row.tp_org_id ?? null,
    is_read: row.is_read,
    created_at: row.created_at,
    isRead: Boolean(row.is_read),
    approvalRole,
    accountStatus,
    tpCompanyName: row.tpCompanyName ?? row.tpcompanyname ?? null,
    trainerFullName: row.trainerFullName ?? row.trainerfullname ?? null,
    trainerPhone: row.trainerPhone ?? row.trainerphone ?? null,
    trainerProfilePhoto: profilePhoto,
    trainerLocation: row.trainerLocation ?? row.trainerlocation ?? null,
    trainerAccountEmail: row.trainerAccountEmail ?? row.traineraccountemail ?? null,
    trainerExpertiseLabel,
  };
}

function dedupeApprovalNotificationRows(rows: Record<string, unknown>[]) {
  const byTrainer = new Map<string, Record<string, unknown>>();
  const withoutTrainer: Record<string, unknown>[] = [];

  for (const row of rows) {
    const trainerId = row.trainer_id != null ? String(row.trainer_id) : "";
    if (!trainerId) {
      withoutTrainer.push(row);
      continue;
    }
    const prev = byTrainer.get(trainerId);
    if (!prev || String(row.created_at) > String(prev.created_at)) {
      byTrainer.set(trainerId, row);
    }
  }

  return [...byTrainer.values(), ...withoutTrainer];
}

function approvalQueueRank(row: Record<string, unknown>): number {
  const tpOrgId = row.tp_org_id != null ? String(row.tp_org_id) : "";
  const status = tpOrgId
    ? String(row.tpOrgStatus ?? row.tporgstatus ?? "")
    : String(row.trainerStatus ?? row.trainerstatus ?? "");
  return status === "APPROVED" ? 1 : 0;
}

function sortApprovalQueueRows(rows: Record<string, unknown>[]) {
  return rows.sort((a, b) => {
    const rankDiff = approvalQueueRank(a) - approvalQueueRank(b);
    if (rankDiff !== 0) return rankDiff;
    return String(b.created_at).localeCompare(String(a.created_at));
  });
}

restRouter.get("/admin/notifications", requireRoles(["ADMIN"]), async (_req, res) => {
  const fromNotifications = await queryAll<Record<string, unknown>>(
    `SELECT n."id", n."type", n."title", n."body", n."trainer_id", n."tp_org_id", n."is_read", n."created_at",
              t."fullName" AS "trainerFullName",
              t."phone" AS "trainerPhone",
              t."profilePhoto" AS "trainerProfilePhoto",
              t."stateOrLocation" AS "trainerLocation",
              t."expertise" AS "trainerExpertiseJson",
              t."status" AS "trainerStatus",
              u."email" AS "trainerAccountEmail",
              o."companyName" AS "tpCompanyName",
              o."status" AS "tpOrgStatus"
       FROM notifications n
       LEFT JOIN "Trainer" t ON t."id" = n.trainer_id
       LEFT JOIN "User" u ON u."id" = t."userId"
       LEFT JOIN "TpOrganization" o ON o."id" = n.tp_org_id
       WHERE (n.tp_org_id IS NOT NULL AND n.type = 'TP_SIGNUP' AND o."status" IN ('PENDING', 'UNDER_REVIEW', 'APPROVED'))
          OR (t."id" IS NOT NULL AND t."status" IN ('PENDING', 'UNDER_REVIEW', 'APPROVED'))
       ORDER BY n.created_at DESC
       LIMIT 200`,
  );

  const approvedTrainersNoNotif = await queryAll<Record<string, unknown>>(
    `SELECT ('approved-trainer-' || t."id") AS "id",
              'TRAINER_APPROVED' AS "type",
              'Trainer approved' AS "title",
              '' AS "body",
              t."id" AS "trainer_id",
              NULL AS "tp_org_id",
              true AS "is_read",
              COALESCE(t."approvedAt", t."updatedAt") AS "created_at",
              t."fullName" AS "trainerFullName",
              t."phone" AS "trainerPhone",
              t."profilePhoto" AS "trainerProfilePhoto",
              t."stateOrLocation" AS "trainerLocation",
              t."expertise" AS "trainerExpertiseJson",
              t."status" AS "trainerStatus",
              u."email" AS "trainerAccountEmail",
              NULL AS "tpCompanyName",
              NULL AS "tpOrgStatus"
       FROM "Trainer" t
       JOIN "User" u ON u."id" = t."userId"
       WHERE t."status" = 'APPROVED'
         AND NOT EXISTS (SELECT 1 FROM notifications n WHERE n.trainer_id = t."id")`,
  );

  const approvedTpNoNotif = await queryAll<Record<string, unknown>>(
    `SELECT ('approved-tp-' || o."id") AS "id",
              'TP_SIGNUP' AS "type",
              'Training provider approved' AS "title",
              '' AS "body",
              NULL AS "trainer_id",
              o."id" AS "tp_org_id",
              true AS "is_read",
              COALESCE(o."approvedAt", o."updatedAt") AS "created_at",
              NULL AS "trainerFullName",
              NULL AS "trainerPhone",
              NULL AS "trainerProfilePhoto",
              NULL AS "trainerLocation",
              NULL AS "trainerExpertiseJson",
              NULL AS "trainerStatus",
              NULL AS "trainerAccountEmail",
              o."companyName" AS "tpCompanyName",
              o."status" AS "tpOrgStatus"
       FROM "TpOrganization" o
       WHERE o."status" = 'APPROVED'
         AND NOT EXISTS (SELECT 1 FROM notifications n WHERE n.tp_org_id = o."id")`,
  );

  const merged = dedupeApprovalNotificationRows([
    ...fromNotifications,
    ...approvedTrainersNoNotif,
    ...approvedTpNoNotif,
  ]);
  sortApprovalQueueRows(merged);

  res.json(merged.map(mapAdminApprovalRow));
});

restRouter.patch("/admin/notifications/:id/read", requireRoles(["ADMIN"]), async (req, res) => {
  await execute(`UPDATE notifications SET is_read = true WHERE id = ?`, [req.params.id]);
  res.json({ message: "Marked as read" });
});

restRouter.delete("/admin/notifications/:id", requireRoles(["ADMIN"]), async (req, res) => {
  const result = await execute(`DELETE FROM notifications WHERE id = ?`, [req.params.id]);
  if (result.rowCount === 0) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ message: "Deleted" });
});

restRouter.patch("/admin/notifications/read-all", requireRoles(["ADMIN"]), async (_req, res) => {
  await execute(`UPDATE notifications SET is_read = true WHERE is_read = false`);
  res.json({ message: "All marked as read" });
});

restRouter.get("/admin/clients", requireRoles(["ADMIN"]), async (_req, res) => {
  const rows = await queryAll<{
    id: string;
    companyName: string;
    userEmail: string;
    industry: string;
    phone: string;
    profilePhoto: string | null;
    profileType: string | null;
    accountStatus: string | null;
    subStatus: string | null;
    subExpires: string | null;
  }>(
    `SELECT c.*, u."email" as "userEmail",
        s."status" as "subStatus", s."expiresAt" as "subExpires"
       FROM "Client" c
       JOIN "User" u ON u."id" = c."userId"
       LEFT JOIN "Subscription" s ON s."clientId" = c."id"
       ORDER BY c."companyName" ASC`,
  );
  res.json({
    companies: rows.map((c) => ({
      id: c.id,
      companyName: c.companyName,
      subtitle: profileTypeLabel(c.profileType),
      profileType: c.profileType ?? "COMPANY",
      industry: c.industry,
      email: c.userEmail,
      phone: c.phone,
      profilePhoto: c.profilePhoto ?? null,
      planTier: subscriptionIsActive(
        (c.subStatus ?? "PENDING_PAYMENT") as SubStatus,
        c.subExpires ?? null,
      )
        ? "pro"
        : "free",
      accountStatus: c.accountStatus === "SUSPENDED" ? "SUSPENDED" : "ACTIVE",
    })),
  });
});

restRouter.get("/admin/clients/:id", requireRoles(["ADMIN"]), async (req, res) => {
  const row = await queryOne<Record<string, unknown>>(
    `SELECT c.*, u."email" as "userEmail",
        s."id" as "sub_id", s."status" as "sub_status", s."planType" as "sub_planType", s."amount" as "sub_amount",
        s."proofUrl" as "sub_proofUrl", s."requestedAt" as "sub_requestedAt", s."paidAt" as "sub_paidAt", s."expiresAt" as "sub_expiresAt", s."approvedBy" as "sub_approvedBy"
       FROM "Client" c
       JOIN "User" u ON u."id" = c."userId"
       LEFT JOIN "Subscription" s ON s."clientId" = c."id"
       WHERE c."id" = ?`,
    [req.params.id],
  );
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const subscription =
    row.sub_id != null
      ? {
          id: row.sub_id,
          clientId: row.id,
          status: row.sub_status,
          planType: row.sub_planType,
          amount: row.sub_amount,
          proofUrl: row.sub_proofUrl,
          requestedAt: row.sub_requestedAt,
          paidAt: row.sub_paidAt,
          expiresAt: row.sub_expiresAt,
          approvedBy: row.sub_approvedBy,
        }
      : null;
  res.json({
    client: {
      id: row.id,
      userId: row.userId,
      companyName: row.companyName,
      regNumber: row.regNumber,
      industry: row.industry,
      contactName: row.contactName,
      contactEmail: row.contactEmail ?? null,
      phone: row.phone,
      address: row.address,
      profilePhoto: row.profilePhoto ?? null,
      profileComplete: Boolean(row.profileComplete),
      accountStatus: row.accountStatus === "SUSPENDED" ? "SUSPENDED" : "ACTIVE",
      suspensionReason:
        typeof row.suspensionReason === "string" ? row.suspensionReason : null,
      suspendedAt: typeof row.suspendedAt === "string" ? row.suspendedAt : null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      user: { email: row.userEmail },
      subscription,
    },
  });
});

const suspendClientSchema = z.object({
  reason: z.string().trim().min(3, "Enter a reason (at least 3 characters)").max(2000),
});

restRouter.post(
  "/admin/clients/:id/suspend",
  requireRoles(["ADMIN"]),
  async (req, res) => {
    const parsed = suspendClientSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid payload",
        details: parsed.error.flatten(),
      });
      return;
    }
    const client = await queryOne<{ id: string; accountStatus: string | null }>(
      `SELECT "id", "accountStatus" FROM "Client" WHERE "id" = ?`,
      [req.params.id],
    );
    if (!client) {
      res.status(404).json({ error: "Employer not found" });
      return;
    }
    if (client.accountStatus === "SUSPENDED") {
      res.status(409).json({ error: "Employer is already suspended" });
      return;
    }
    const t = isoNow();
    await execute(
      `UPDATE "Client" SET "accountStatus"='SUSPENDED', "suspensionReason"=?, "suspendedAt"=?, "updatedAt"=? WHERE "id"=?`,
      [parsed.data.reason, t, t, client.id],
    );
    res.json({ ok: true, accountStatus: "SUSPENDED" as const });
  },
);

restRouter.post(
  "/admin/clients/:id/reactivate",
  requireRoles(["ADMIN"]),
  async (req, res) => {
    const client = await queryOne<{ id: string; accountStatus: string | null }>(
      `SELECT "id", "accountStatus" FROM "Client" WHERE "id" = ?`,
      [req.params.id],
    );
    if (!client) {
      res.status(404).json({ error: "Employer not found" });
      return;
    }
    if (client.accountStatus !== "SUSPENDED") {
      res.status(409).json({ error: "Employer is not suspended" });
      return;
    }
    const t = isoNow();
    await execute(
      `UPDATE "Client" SET "accountStatus"='ACTIVE', "suspensionReason"=NULL, "suspendedAt"=NULL, "updatedAt"=? WHERE "id"=?`,
      [t, client.id],
    );
    res.json({ ok: true, accountStatus: "ACTIVE" as const });
  },
);

restRouter.post(
  "/admin/trainers/:id/suspend",
  requireRoles(["ADMIN"]),
  async (req, res) => {
    const parsed = suspendClientSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid payload",
        details: parsed.error.flatten(),
      });
      return;
    }
    const trainer = await queryOne<{ id: string; accountStatus: string | null }>(
      `SELECT "id", "accountStatus" FROM "Trainer" WHERE "id" = ?`,
      [req.params.id],
    );
    if (!trainer) {
      res.status(404).json({ error: "Trainer not found" });
      return;
    }
    if (trainer.accountStatus === "SUSPENDED") {
      res.status(409).json({ error: "Trainer is already suspended" });
      return;
    }
    const t = isoNow();
    await execute(
      `UPDATE "Trainer" SET "accountStatus"='SUSPENDED', "suspensionReason"=?, "suspendedAt"=?, "updatedAt"=? WHERE "id"=?`,
      [parsed.data.reason, t, t, trainer.id],
    );
    res.json({ ok: true, accountStatus: "SUSPENDED" as const });
  },
);

restRouter.post(
  "/admin/trainers/:id/reactivate",
  requireRoles(["ADMIN"]),
  async (req, res) => {
    const trainer = await queryOne<{ id: string; accountStatus: string | null }>(
      `SELECT "id", "accountStatus" FROM "Trainer" WHERE "id" = ?`,
      [req.params.id],
    );
    if (!trainer) {
      res.status(404).json({ error: "Trainer not found" });
      return;
    }
    if (trainer.accountStatus !== "SUSPENDED") {
      res.status(409).json({ error: "Trainer is not suspended" });
      return;
    }
    const t = isoNow();
    await execute(
      `UPDATE "Trainer" SET "accountStatus"='ACTIVE', "suspensionReason"=NULL, "suspendedAt"=NULL, "updatedAt"=? WHERE "id"=?`,
      [t, trainer.id],
    );
    res.json({ ok: true, accountStatus: "ACTIVE" as const });
  },
);

restRouter.get("/admin/subscriptions", requireRoles(["ADMIN"]), async (_req, res) => {
  const rows = await queryAll<{
    id: string;
    companyName: string;
    contactEmail: string;
    status: string;
    planType: string;
    amount: number;
    requestedAt: string;
  }>(
    `SELECT s.*, c."companyName", u."email" as "contactEmail"
       FROM "Subscription" s
       JOIN "Client" c ON c."id" = s."clientId"
       JOIN "User" u ON u."id" = c."userId"
       ORDER BY s."requestedAt" DESC`,
  );
  const subscriptions = rows.map((sub) => ({
    id: sub.id,
    companyName: sub.companyName,
    subtitle: sub.contactEmail,
    status: sub.status,
    planType: sub.planType,
    amountLabel: `MYR ${Number(sub.amount).toFixed(2)}`,
    amountNum: Number(sub.amount),
    dateLabel: formatAdminTableDate(new Date(sub.requestedAt)),
    dateMs: new Date(sub.requestedAt).getTime(),
  }));
  const DEMO_SUBSCRIPTIONS = Object.entries(DEMO_SUBSCRIPTION_DETAILS).map(([id, d]) => ({
    id,
    companyName: d.companyName,
    subtitle: d.contactEmail,
    status: d.status,
    planType: d.planType,
    amountLabel: d.amountLabel,
    amountNum: Number(d.amountLabel.replace(/[^\d.]/g, "")) || 99,
    dateLabel: d.requestedAtLabel,
    dateMs: demoSubscriptionRequestedMs(id),
  }));
  res.json({ subscriptions: [...subscriptions, ...DEMO_SUBSCRIPTIONS] });
});

restRouter.get("/admin/subscriptions/:id", requireRoles(["ADMIN"]), async (req, res) => {
  const { id } = req.params;
  const demo = DEMO_SUBSCRIPTION_DETAILS[id];
  if (demo) {
    res.json({
      detail: {
        id,
        companyName: demo.companyName,
        contactEmail: demo.contactEmail,
        planType: demo.planType,
        amountLabel: demo.amountLabel,
        status: demo.status,
        requestedAtLabel: demo.requestedAtLabel,
        proofNote: demo.proofNote,
      },
    });
    return;
  }
  const sub = await queryOne<{
    id: string;
    companyName: string;
    contactEmail: string;
    planType: string;
    amount: number;
    status: string;
    requestedAt: string;
    proofUrl: string | null;
  }>(
    `SELECT s.*, c."companyName", u."email" as "contactEmail"
       FROM "Subscription" s
       JOIN "Client" c ON c."id" = s."clientId"
       JOIN "User" u ON u."id" = c."userId"
       WHERE s."id" = ?`,
    [id],
  );
  if (!sub) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({
    detail: {
      id: sub.id,
      companyName: sub.companyName,
      contactEmail: sub.contactEmail,
      planType: sub.planType,
      amountLabel: `MYR ${Number(sub.amount).toFixed(2)}`,
      status: sub.status,
      requestedAtLabel: new Date(sub.requestedAt).toLocaleString("en-MY", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      proofNote: sub.proofUrl
        ? "Proof file on record (replace with preview when storage is ready)."
        : "No payment proof uploaded yet.",
    },
  });
});

type PaymentRow = {
  id: string;
  companyName: string;
  subtitle: string;
  paymentType: string;
  amountLabel: string;
  amountNum: number;
  statusKey: string;
  statusLabel: string;
  dateLabel: string;
  dateMs: number;
  proofUrl: string | null;
  notes: string | null;
  profilePhoto: string | null;
};

function paymentStatusFromSubscriptionStatus(status: string): {
  statusKey: string;
  statusLabel: string;
} {
  switch (status) {
    case "PENDING_PAYMENT":
      return { statusKey: "PENDING_PAYMENT", statusLabel: "Awaiting payment" };
    case "PROOF_UPLOADED":
      return { statusKey: "PROOF_UPLOADED", statusLabel: "Awaiting confirmation" };
    case "ACTIVE":
      return { statusKey: "COMPLETED", statusLabel: "Completed" };
    case "EXPIRED":
      return { statusKey: "EXPIRED", statusLabel: "Expired" };
    case "REJECTED":
      return { statusKey: "REJECTED", statusLabel: "Rejected" };
    default:
      return { statusKey: "PENDING_PAYMENT", statusLabel: "Awaiting payment" };
  }
}

restRouter.get("/admin/payments", requireRoles(["ADMIN"]), async (_req, res) => {
  const rows = await queryAll<{
    id: string;
    companyName: string;
    companyProfilePhoto: string | null;
    contactEmail: string;
    status: string;
    amount: number;
    proofUrl: string | null;
    notes: string | null;
    requestedAt: string;
  }>(
    `SELECT s.*, c."companyName", c."profilePhoto" as "companyProfilePhoto", u."email" as "contactEmail"
       FROM "Subscription" s
       JOIN "Client" c ON c."id" = s."clientId"
       JOIN "User" u ON u."id" = c."userId"
       WHERE s."status" IN ('PENDING_PAYMENT','PROOF_UPLOADED','ACTIVE','REJECTED','EXPIRED')
       ORDER BY s."requestedAt" DESC`,
  );
  const fromDb: PaymentRow[] = rows.map((sub) => {
    const { statusKey, statusLabel } = paymentStatusFromSubscriptionStatus(sub.status);
    return {
      id: sub.id,
      companyName: sub.companyName,
      subtitle: sub.contactEmail,
      paymentType: "Subscription",
      amountLabel: `MYR ${Number(sub.amount).toFixed(2)}`,
      amountNum: Number(sub.amount),
      statusKey,
      statusLabel,
      dateLabel: formatAdminTableDate(new Date(sub.requestedAt)),
      dateMs: new Date(sub.requestedAt).getTime(),
      proofUrl: sub.proofUrl ?? null,
      notes: sub.notes ?? null,
      profilePhoto: sub.companyProfilePhoto ?? null,
    };
  });
  res.json({ payments: fromDb });
});

async function reviewPaymentSubmission(
  clientId: string,
  status: "VERIFIED" | "REJECTED",
  reviewedBy: string,
  reviewedAt: string,
) {
  const latest = await queryOne<{ id: string }>(
    `SELECT "id" FROM "PaymentSubmission"
        WHERE "clientId" = ?
        ORDER BY "submittedAt" DESC
        LIMIT 1`,
    [clientId],
  );
  if (!latest) return;
  await execute(
    `UPDATE "PaymentSubmission"
        SET "status" = ?, "reviewedAt" = ?, "reviewedBy" = ?
      WHERE "id" = ?`,
    [status, reviewedAt, reviewedBy, latest.id],
  );
}

restRouter.post(
  "/admin/payments/:id/approve",
  requireRoles(["ADMIN"]),
  async (req, res) => {
    const u = req.authUser!;
    const sub = await queryOne<{ id: string; clientId: string; planType: string }>(
      `SELECT "id","clientId","planType" FROM "Subscription" WHERE "id" = ?`,
      [req.params.id],
    );
    if (!sub) {
      res.status(404).json({ error: "Subscription not found" });
      return;
    }
    const now = new Date();
    const expires = new Date(now);
    expires.setDate(expires.getDate() + 30);
    const nowIso = now.toISOString();
    const expiresIso = expires.toISOString();
    await execute(
      `UPDATE "Subscription"
          SET "status" = 'ACTIVE',
              "paidAt" = ?,
              "expiresAt" = ?,
              "approvedBy" = ?
        WHERE "id" = ?`,
      [nowIso, expiresIso, u.sub, sub.id],
    );
    await reviewPaymentSubmission(sub.clientId, "VERIFIED", u.sub, nowIso);
    res.json({
      subscriptionId: sub.id,
      status: "ACTIVE",
      paidAt: nowIso,
      expiresAt: expiresIso,
    });
  },
);

restRouter.post(
  "/admin/payments/:id/reject",
  requireRoles(["ADMIN"]),
  async (req, res) => {
    const u = req.authUser!;
    const sub = await queryOne<{ id: string; clientId: string }>(
      `SELECT "id","clientId" FROM "Subscription" WHERE "id" = ?`,
      [req.params.id],
    );
    if (!sub) {
      res.status(404).json({ error: "Subscription not found" });
      return;
    }
    const nowIso = isoNow();
    await execute(
      `UPDATE "Subscription"
          SET "status" = 'REJECTED',
              "approvedBy" = ?
        WHERE "id" = ?`,
      [u.sub, sub.id],
    );
    await reviewPaymentSubmission(sub.clientId, "REJECTED", u.sub, nowIso);
    res.json({ subscriptionId: sub.id, status: "REJECTED" });
  },
);

/** Anonymous upload for company registration (field name: `photo`). */
restRouter.post("/uploads/client-profile-photo", (req, res) => {
  clientProfilePhotoUpload.single("photo")(req, res, (err: unknown) => {
    if (err) {
      const code = err instanceof MulterError ? err.code : "";
      if (code === "LIMIT_FILE_SIZE") {
        res.status(400).json({ error: "File too large (max 5MB)." });
        return;
      }
      const msg = err instanceof Error ? err.message : "Upload failed.";
      res.status(400).json({ error: msg });
      return;
    }
    const f = req.file;
    if (!f) {
      res.status(400).json({ error: 'No file uploaded. Use form field name "photo".' });
      return;
    }
    res.status(201).json({ profilePhotoUrl: `/api/uploads/company-photos/${f.filename}` });
  });
});

/** Anonymous upload for trainer registration (field name: `photo`). */
restRouter.post("/uploads/trainer-profile-photo", (req, res) => {
  trainerProfilePhotoUpload.single("photo")(req, res, (err: unknown) => {
    if (err) {
      const code = err instanceof MulterError ? err.code : "";
      if (code === "LIMIT_FILE_SIZE") {
        res.status(400).json({ error: "File too large (max 5MB)." });
        return;
      }
      const msg = err instanceof Error ? err.message : "Upload failed.";
      res.status(400).json({ error: msg });
      return;
    }
    const f = req.file;
    if (!f) {
      res.status(400).json({ error: 'No file uploaded. Use form field name "photo".' });
      return;
    }
    res.status(201).json({ profilePhotoUrl: `/api/uploads/trainer-photos/${f.filename}` });
  });
});

/** Anonymous upload for trainer registration (field name: `cert`). */
restRouter.post("/uploads/trainer-hrdc-cert", (req, res) => {
  hrdcCertUpload.single("cert")(req, res, (err: unknown) => {
    if (err) {
      const code = err instanceof MulterError ? err.code : "";
      if (code === "LIMIT_FILE_SIZE") {
        res.status(400).json({ error: "File too large (max 10MB)." });
        return;
      }
      const msg = err instanceof Error ? err.message : "Upload failed.";
      res.status(400).json({ error: msg });
      return;
    }
    const f = req.file;
    if (!f) {
      res.status(400).json({ error: 'No file uploaded. Use form field name "cert".' });
      return;
    }
    res.status(201).json({ certFileUrl: `/api/uploads/certificates/${f.filename}` });
  });
});

/** Serve uploaded HRDC certificates (UUID filenames only). */
restRouter.get("/uploads/certificates/:filename", (req, res) => {
  const filename = path.basename(req.params.filename);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(pdf|png|jpg|jpeg)$/i.test(filename)) {
    res.status(400).json({ error: "Invalid file" });
    return;
  }
  const base = path.resolve(HRDC_CERT_UPLOAD_DIR);
  const full = path.resolve(base, filename);
  if (!full.startsWith(base + path.sep)) {
    res.status(400).json({ error: "Invalid path" });
    return;
  }
  if (!fs.existsSync(full)) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.sendFile(full);
});

/** Serve uploaded company profile photos (UUID filenames only). */
restRouter.get("/uploads/company-photos/:filename", (req, res) => {
  const filename = path.basename(req.params.filename);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpg|jpeg|webp)$/i.test(filename)) {
    res.status(400).json({ error: "Invalid file" });
    return;
  }
  const base = path.resolve(COMPANY_PROFILE_PHOTO_DIR);
  const full = path.resolve(base, filename);
  if (!full.startsWith(base + path.sep)) {
    res.status(400).json({ error: "Invalid path" });
    return;
  }
  if (!fs.existsSync(full)) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.sendFile(full);
});

/** Serve uploaded trainer profile photos (UUID filenames only). */
restRouter.get("/uploads/trainer-photos/:filename", (req, res) => {
  const filename = path.basename(req.params.filename);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpg|jpeg|webp)$/i.test(filename)) {
    res.status(400).json({ error: "Invalid file" });
    return;
  }
  const base = path.resolve(TRAINER_PROFILE_PHOTO_DIR);
  const full = path.resolve(base, filename);
  if (!full.startsWith(base + path.sep)) {
    res.status(400).json({ error: "Invalid path" });
    return;
  }
  if (!fs.existsSync(full)) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.sendFile(full);
});

/* ----------------------------- Payment settings ---------------------------- */

const PAYMENT_SETTINGS_ID = "singleton";

type PaymentSettingsRow = {
  id: string;
  bankName: string | null;
  accountName: string | null;
  accountNumber: string | null;
  amount: number;
  qrImageUrl: string | null;
  updatedAt: string;
};

async function readPaymentSettings(): Promise<PaymentSettingsRow> {
  const row = await queryOne<PaymentSettingsRow>(
    `SELECT * FROM "PaymentSettings" WHERE "id" = ?`,
    [PAYMENT_SETTINGS_ID],
  );
  if (row) return row;
  const now = isoNow();
  await execute(
    `INSERT INTO "PaymentSettings" ("id","bankName","accountName","accountNumber","amount","qrImageUrl","updatedAt")
     VALUES (?,?,?,?,?,?,?)`,
    [PAYMENT_SETTINGS_ID, null, null, null, 99, null, now],
  );
  return {
    id: PAYMENT_SETTINGS_ID,
    bankName: null,
    accountName: null,
    accountNumber: null,
    amount: 99,
    qrImageUrl: null,
    updatedAt: now,
  };
}

const paymentSettingsSchema = z.object({
  bankName: z
    .preprocess(
      (v) => (v == null || v === "" ? null : String(v).trim()),
      z.string().max(120).nullable(),
    )
    .optional()
    .transform((v) => v ?? null),
  accountName: z
    .preprocess(
      (v) => (v == null || v === "" ? null : String(v).trim()),
      z.string().max(160).nullable(),
    )
    .optional()
    .transform((v) => v ?? null),
  accountNumber: z
    .preprocess(
      (v) => (v == null || v === "" ? null : String(v).trim()),
      z.string().max(60).nullable(),
    )
    .optional()
    .transform((v) => v ?? null),
  amount: z
    .preprocess((v) => {
      if (v == null || v === "") return 99;
      if (typeof v === "number") return v;
      const n = Number(String(v).trim());
      return Number.isFinite(n) ? n : 99;
    }, z.number().min(0).max(1_000_000))
    .optional()
    .transform((v) => (typeof v === "number" ? v : 99)),
  qrImageUrl: z
    .preprocess(
      (v) => (v == null || v === "" ? null : String(v).trim()),
      z
        .string()
        .max(600)
        .nullable()
        .refine(
          (s) => s === null || s.startsWith("/api/uploads/payment-qr/"),
          "Invalid QR image",
        ),
    )
    .optional()
    .transform((v) => v ?? null),
});

/** Public read of payment settings (used by company subscription page). */
restRouter.get("/payment-settings", async (_req, res) => {
  const row = await readPaymentSettings();
  res.json({
    paymentSettings: {
      bankName: row.bankName,
      accountName: row.accountName,
      accountNumber: row.accountNumber,
      amount: row.amount,
      qrImageUrl: row.qrImageUrl,
      updatedAt: row.updatedAt,
    },
  });
});

/** Admin update of payment settings. */
restRouter.put("/admin/payment-settings", requireRoles(["ADMIN"]), async (req, res) => {
  const parsed = paymentSettingsSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid payment settings",
      details: parsed.error.flatten(),
    });
    return;
  }
  await readPaymentSettings();
  const now = isoNow();
  await execute(
    `UPDATE "PaymentSettings"
       SET "bankName" = ?, "accountName" = ?, "accountNumber" = ?, "amount" = ?, "qrImageUrl" = ?, "updatedAt" = ?
     WHERE "id" = ?`,
    [
      parsed.data.bankName,
      parsed.data.accountName,
      parsed.data.accountNumber,
      parsed.data.amount,
      parsed.data.qrImageUrl,
      now,
      PAYMENT_SETTINGS_ID,
    ],
  );
  const row = await readPaymentSettings();
  res.json({
    paymentSettings: {
      bankName: row.bankName,
      accountName: row.accountName,
      accountNumber: row.accountNumber,
      amount: row.amount,
      qrImageUrl: row.qrImageUrl,
      updatedAt: row.updatedAt,
    },
  });
});

/** Admin upload of payment QR image (field name: `photo`). */
restRouter.post(
  "/admin/uploads/payment-qr",
  requireRoles(["ADMIN"]),
  (req, res) => {
    paymentQrUpload.single("photo")(req, res, (err: unknown) => {
      if (err) {
        const code = err instanceof MulterError ? err.code : "";
        if (code === "LIMIT_FILE_SIZE") {
          res.status(400).json({ error: "File too large (max 5MB)." });
          return;
        }
        const msg = err instanceof Error ? err.message : "Upload failed.";
        res.status(400).json({ error: msg });
        return;
      }
      const f = req.file;
      if (!f) {
        res
          .status(400)
          .json({ error: 'No file uploaded. Use form field name "photo".' });
        return;
      }
      res
        .status(201)
        .json({ qrImageUrl: `/api/uploads/payment-qr/${f.filename}` });
    });
  },
);

/** Authenticated client/admin upload of a payment proof file. */
restRouter.post(
  "/uploads/payment-proof",
  requireRoles(["CLIENT", "ADMIN"]),
  (req, res) => {
    paymentProofUpload.single("proof")(req, res, (err: unknown) => {
      if (err) {
        const code = err instanceof MulterError ? err.code : "";
        if (code === "LIMIT_FILE_SIZE") {
          res.status(400).json({ error: "File too large (max 10MB)." });
          return;
        }
        const msg = err instanceof Error ? err.message : "Upload failed.";
        res.status(400).json({ error: msg });
        return;
      }
      const f = req.file;
      if (!f) {
        res
          .status(400)
          .json({ error: 'No file uploaded. Use form field name "proof".' });
        return;
      }
      res
        .status(201)
        .json({ proofUrl: `/api/uploads/payment-proof/${f.filename}` });
    });
  },
);

/** Serve uploaded payment proofs (authenticated users only). */
restRouter.get(
  "/uploads/payment-proof/:filename",
  requireAuth,
  (req, res) => {
    const filename = path.basename(req.params.filename);
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(pdf|png|jpg|jpeg|webp)$/i.test(
        filename,
      )
    ) {
      res.status(400).json({ error: "Invalid file" });
      return;
    }
    const base = path.resolve(PAYMENT_PROOF_DIR);
    const full = path.resolve(base, filename);
    if (!full.startsWith(base + path.sep)) {
      res.status(400).json({ error: "Invalid path" });
      return;
    }
    if (!fs.existsSync(full)) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.sendFile(full);
  },
);

/** Company submits payment proof — creates or updates their subscription. */
const submitPaymentProofSchema = z.object({
  proofUrl: z
    .string()
    .min(1)
    .max(600)
    .refine(
      (s) => s.startsWith("/api/uploads/payment-proof/"),
      "Invalid proof file",
    ),
  notes: z
    .preprocess(
      (v) => (v == null || v === "" ? null : String(v).trim()),
      z.string().max(2000).nullable(),
    )
    .optional()
    .transform((v) => v ?? null),
});

restRouter.post(
  "/client/payment-proof",
  requireRoles(["CLIENT"]),
  async (req, res) => {
    const u = req.authUser!;
    const parsed = submitPaymentProofSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid payment proof",
        details: parsed.error.flatten(),
      });
      return;
    }
    const client = await queryOne<{ id: string }>(
      `SELECT "id" FROM "Client" WHERE "userId" = ?`,
      [u.sub],
    );
    if (!client) {
      res.status(404).json({ error: "Client profile not found" });
      return;
    }
    const settings = await readPaymentSettings();
    const now = isoNow();

    const submissionId = newId();
    await execute(
      `INSERT INTO "PaymentSubmission"
       ("id","clientId","amount","proofUrl","notes","status","submittedAt")
       VALUES (?,?,?,?,?,?,?)`,
      [
        submissionId,
        client.id,
        settings.amount,
        parsed.data.proofUrl,
        parsed.data.notes,
        "PENDING",
        now,
      ],
    );

    const existing = await queryOne<{ id: string }>(
      `SELECT "id" FROM "Subscription" WHERE "clientId" = ?`,
      [client.id],
    );
    if (existing) {
      await execute(
        `UPDATE "Subscription"
            SET "status" = 'PROOF_UPLOADED',
                "amount" = ?,
                "proofUrl" = ?,
                "notes" = ?,
                "requestedAt" = ?
          WHERE "id" = ?`,
        [
          settings.amount,
          parsed.data.proofUrl,
          parsed.data.notes,
          now,
          existing.id,
        ],
      );
      res.json({
        submissionId,
        subscriptionId: existing.id,
        status: "PROOF_UPLOADED",
      });
      return;
    }
    const id = newId();
    await execute(
      `INSERT INTO "Subscription"
       ("id","clientId","status","planType","amount","proofUrl","notes","requestedAt")
       VALUES (?,?,?,?,?,?,?,?)`,
      [
        id,
        client.id,
        "PROOF_UPLOADED",
        "monthly",
        settings.amount,
        parsed.data.proofUrl,
        parsed.data.notes,
        now,
      ],
    );
    res
      .status(201)
      .json({ submissionId, subscriptionId: id, status: "PROOF_UPLOADED" });
  },
);

/** Company reads their own payment submission history. */
restRouter.get(
  "/client/payment-history",
  requireRoles(["CLIENT"]),
  async (req, res) => {
    const u = req.authUser!;
    const client = await queryOne<{ id: string }>(
      `SELECT "id" FROM "Client" WHERE "userId" = ?`,
      [u.sub],
    );
    if (!client) {
      res.json({ history: [] });
      return;
    }
    const rows = await queryAll<{
      id: string;
      amount: number;
      proofUrl: string | null;
      notes: string | null;
      status: string;
      submittedAt: string;
      reviewedAt: string | null;
    }>(
      `SELECT "id","amount","proofUrl","notes","status","submittedAt","reviewedAt"
           FROM "PaymentSubmission"
          WHERE "clientId" = ?
          ORDER BY "submittedAt" DESC`,
      [client.id],
    );
    res.json({ history: rows });
  },
);

/** Serve uploaded payment QR images (UUID filenames only). */
restRouter.get("/uploads/payment-qr/:filename", (req, res) => {
  const filename = path.basename(req.params.filename);
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpg|jpeg|webp)$/i.test(
      filename,
    )
  ) {
    res.status(400).json({ error: "Invalid file" });
    return;
  }
  const base = path.resolve(PAYMENT_QR_DIR);
  const full = path.resolve(base, filename);
  if (!full.startsWith(base + path.sep)) {
    res.status(400).json({ error: "Invalid path" });
    return;
  }
  if (!fs.existsSync(full)) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.sendFile(full);
});
