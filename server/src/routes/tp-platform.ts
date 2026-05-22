import fs from "node:fs";
import path from "node:path";
import { Router } from "express";
import bcrypt from "bcrypt";
import multer, { MulterError } from "multer";
import { randomUUID } from "node:crypto";
import { z } from "zod";

import { clearAuthCookie, requireAuth, requireRoles } from "../auth.js";
import { execute, queryAll, queryOne } from "../db/query.js";
import { newId } from "../db/ids.js";
import {
  registerTpSchema,
  tpCourseSchema,
  tpIsApproved,
  tpScheduleSchema,
  tpTrainerLinkSchema,
  uploadUrlOk,
} from "../lib/tp-platform.js";
import {
  TP_COURSE_FILES_DIR,
  TP_LOGO_DIR,
  TP_VERIFICATION_DIR,
} from "../lib/uploads.js";
import { extractTpOrgDocuments } from "../services/tp-doc-extract.js";
import {
  assertClientConversationForTp,
  getClientConversationMessages,
  listClientConversationsForTp,
  sendClientMessage,
} from "../lib/tp-client-messages.js";
import {
  assertApprovedTrainer,
  assertConversationForTp,
  getConversationMessages,
  getOrCreateConversation,
  listConversationsForTp,
  sendMessage,
} from "../lib/tp-trainer-messages.js";

export const tpPlatformRouter = Router();

const isoNow = () => new Date().toISOString();

function diskStorage(dir: string) {
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || ".bin";
      cb(null, `${randomUUID()}${ext}`);
    },
  });
}

const tpLogoUpload = multer({
  storage: diskStorage(TP_LOGO_DIR),
  limits: { fileSize: 5 * 1024 * 1024 },
});
const tpVerifyUpload = multer({
  storage: diskStorage(TP_VERIFICATION_DIR),
  limits: { fileSize: 10 * 1024 * 1024 },
});
const tpCourseFileUpload = multer({
  storage: diskStorage(TP_COURSE_FILES_DIR),
  limits: { fileSize: 15 * 1024 * 1024 },
});

async function getTpOrgForUser(userId: string) {
  return queryOne<Record<string, unknown>>(
    `SELECT * FROM "TpOrganization" WHERE "userId" = ?`,
    [userId],
  );
}

async function requireTpOrg(req: import("express").Request, res: import("express").Response) {
  const u = req.authUser!;
  if (u.role !== "TRAINING_PROVIDER") {
    res.status(403).json({ error: "Forbidden" });
    return null;
  }
  const org = await getTpOrgForUser(u.sub);
  if (!org) {
    res.status(404).json({ error: "Training provider profile not found" });
    return null;
  }
  if (org.accountStatus === "SUSPENDED") {
    clearAuthCookie(res);
    res.status(403).json({
      code: "ACCOUNT_SUSPENDED",
      error: "Your training provider account has been suspended.",
      suspensionReason: String(org.suspensionReason ?? ""),
    });
    return null;
  }
  return org;
}

function serializeTpOrg(row: Record<string, unknown>) {
  return {
    id: row.id,
    userId: row.userId,
    companyName: row.companyName,
    ssmNumber: row.ssmNumber,
    companyEmail: row.companyEmail,
    phone: row.phone,
    address: row.address,
    website: row.website ?? null,
    hrdcTpId: row.hrdcTpId ?? null,
    logoUrl: row.logoUrl ?? null,
    description: row.description ?? null,
    picName: row.picName,
    picPosition: row.picPosition,
    picEmail: row.picEmail,
    picPhone: row.picPhone,
    ssmCertUrl: row.ssmCertUrl,
    hrdcDocUrl: row.hrdcDocUrl,
    businessLicenseUrl: row.businessLicenseUrl,
    bankProofUrl: row.bankProofUrl,
    status: row.status,
    accountStatus: row.accountStatus === "SUSPENDED" ? "SUSPENDED" : "ACTIVE",
    suspensionReason: row.suspensionReason ?? null,
    suspendedAt: row.suspendedAt ?? null,
    adminNote: row.adminNote ?? null,
    approvedAt: row.approvedAt ?? null,
    hrdcRegApprovedAt: row.hrdcRegApprovedAt ?? null,
    hrdcRegExpiresAt: row.hrdcRegExpiresAt ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function notifyAdminTpSignup(orgId: string, companyName: string) {
  const now = isoNow();
  await execute(
    `INSERT INTO notifications (id, type, title, body, trainer_id, tp_org_id, is_read, created_at)
     VALUES (?, 'TP_SIGNUP', ?, ?, NULL, ?, false, ?)`,
    [
      newId(),
      "New training provider signup",
      `${companyName} submitted verification documents for review.\nReview: /admin/tp-orgs/${orgId}`,
      orgId,
      now,
    ],
  );
}

// --- Public uploads (registration) ---

tpPlatformRouter.post("/uploads/tp-logo", (req, res) => {
  tpLogoUpload.single("file")(req, res, (err: unknown) => {
    if (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : "Upload failed" });
      return;
    }
    const f = req.file;
    if (!f) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }
    res.status(201).json({ url: `/api/uploads/tp-logos/${f.filename}` });
  });
});

tpPlatformRouter.post("/uploads/tp-verification", (req, res) => {
  tpVerifyUpload.single("file")(req, res, (err: unknown) => {
    if (err) {
      const code = err instanceof MulterError ? err.code : "";
      res.status(400).json({ error: code === "LIMIT_FILE_SIZE" ? "File too large (max 10MB)" : "Upload failed" });
      return;
    }
    const f = req.file;
    if (!f) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }
    res.status(201).json({ url: `/api/uploads/tp-verification/${f.filename}` });
  });
});

tpPlatformRouter.post("/uploads/tp-course-file", requireAuth, (req, res) => {
  tpCourseFileUpload.single("file")(req, res, (err: unknown) => {
    if (err) {
      res.status(400).json({ error: "Upload failed" });
      return;
    }
    const f = req.file;
    if (!f) {
      res.status(400).json({ error: "No file" });
      return;
    }
    res.status(201).json({ url: `/api/uploads/tp-course-files/${f.filename}` });
  });
});

function serveUpload(dir: string, req: import("express").Request, res: import("express").Response) {
  const filename = path.basename(req.params.filename);
  if (!/^[0-9a-f-]{36}\.[a-z0-9]+$/i.test(filename)) {
    res.status(400).json({ error: "Invalid file" });
    return;
  }
  const base = path.resolve(dir);
  const full = path.resolve(base, filename);
  if (!full.startsWith(base + path.sep) || !fs.existsSync(full)) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.sendFile(full);
}

tpPlatformRouter.get("/uploads/tp-logos/:filename", (req, res) =>
  serveUpload(TP_LOGO_DIR, req, res),
);
tpPlatformRouter.get("/uploads/tp-verification/:filename", (req, res) =>
  serveUpload(TP_VERIFICATION_DIR, req, res),
);
tpPlatformRouter.get("/uploads/tp-course-files/:filename", (req, res) =>
  serveUpload(TP_COURSE_FILES_DIR, req, res),
);

// --- Registration ---

tpPlatformRouter.post("/register/tp", async (req, res) => {
  const parsed = registerTpSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
    return;
  }
  const data = parsed.data;
  for (const url of [data.ssmCertUrl, data.hrdcDocUrl, data.logoUrl]) {
    if (url && !uploadUrlOk(url)) {
      res.status(400).json({ error: "Invalid document URL" });
      return;
    }
  }
  const email = data.email.toLowerCase().trim();
  const existing = await queryOne<{ id: string }>(`SELECT id FROM "User" WHERE email = ?`, [
    email,
  ]);
  if (existing) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }
  const passwordHash = await bcrypt.hash(data.password, 12);
  const uid = newId();
  const oid = newId();
  const t = isoNow();
  await execute(
    `INSERT INTO "User" ("id","email","passwordHash","role","createdAt") VALUES (?,?,?,?,?)`,
    [uid, email, passwordHash, "TRAINING_PROVIDER", t],
  );
  await execute(
    `INSERT INTO "TpOrganization" (
      "id","userId","companyName","ssmNumber","companyEmail","phone","address","website","hrdcTpId",
      "logoUrl","description","picName","picPosition","picEmail","picPhone",
      "ssmCertUrl","hrdcDocUrl","businessLicenseUrl","bankProofUrl",
      "status","accountStatus","createdAt","updatedAt"
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      oid,
      uid,
      data.companyName,
      "",
      data.companyEmail,
      data.phone,
      data.address,
      data.website?.trim() || null,
      data.hrdcTpId.trim(),
      data.logoUrl,
      data.description?.trim() || null,
      data.picName,
      data.picPosition?.trim() || "",
      data.picEmail,
      data.picPhone,
      data.ssmCertUrl,
      data.hrdcDocUrl,
      data.businessLicenseUrl?.trim() || "",
      data.bankProofUrl?.trim() || "",
      "PENDING",
      "ACTIVE",
      t,
      t,
    ],
  );
  void notifyAdminTpSignup(oid, data.companyName);
  void extractTpOrgDocuments(oid, data.ssmCertUrl, data.hrdcDocUrl);
  res.status(201).json({ ok: true, message: "Registration submitted. Awaiting admin approval." });
});

// --- TP session ---

tpPlatformRouter.get("/tp/me", requireAuth, async (req, res) => {
  const u = req.authUser!;
  if (u.role === "ADMIN") {
    res.json({ org: null, isAdminViewer: true });
    return;
  }
  if (u.role !== "TRAINING_PROVIDER") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const org = await getTpOrgForUser(u.sub);
  if (!org) {
    res.json({ org: null, isAdminViewer: false });
    return;
  }
  if (org.accountStatus === "SUSPENDED") {
    clearAuthCookie(res);
    res.status(403).json({
      code: "ACCOUNT_SUSPENDED",
      error: "Your training provider account has been suspended.",
      suspensionReason: org.suspensionReason ?? "",
    });
    return;
  }
  res.json({
    org: { ...serializeTpOrg(org), user: { email: u.email } },
    isAdminViewer: false,
  });
});

tpPlatformRouter.get("/tp/dashboard", requireAuth, async (req, res) => {
  const org = await requireTpOrg(req, res);
  if (!org) return;
  const tpOrgId = String(org.id);
  const courses = asCount(
    await queryOne<{ c: number }>(
      `SELECT COUNT(*)::int AS c FROM "TpCourse" WHERE "tpOrgId" = ?`,
      [tpOrgId],
    ),
  );
  const trainers = asCount(
    await queryOne<{ c: number }>(
      `SELECT COUNT(*)::int AS c FROM "TpTrainerLink" WHERE "tpOrgId" = ? AND status = 'ACTIVE'`,
      [tpOrgId],
    ),
  );
  const requests = asCount(
    await queryOne<{ c: number }>(
      `SELECT COUNT(*)::int AS c FROM "TpEmployerRequest" WHERE "tpOrgId" = ? AND status IN ('REQUESTED','PROPOSED')`,
      [tpOrgId],
    ),
  );
  const upcoming = asCount(
    await queryOne<{ c: number }>(
      `SELECT COUNT(*)::int AS c FROM "TpSchedule" WHERE "tpOrgId" = ? AND status IN ('PROPOSED','CONFIRMED') AND "scheduledDate" >= ?`,
      [tpOrgId, new Date().toISOString().slice(0, 10)],
    ),
  );
  const ratingRow = await queryOne<{ avg: number | null; cnt: number }>(
    `SELECT AVG(score)::float AS avg, COUNT(*)::int AS cnt FROM "TpRating" WHERE "tpOrgId" = ?`,
    [tpOrgId],
  );
  const revenueRow = await queryOne<{ total: number | null }>(
    `SELECT COALESCE(SUM(c."courseFee"), 0)::float AS total
     FROM "TpSchedule" s
     JOIN "TpCourse" c ON c."id" = s."courseId"
     WHERE s."tpOrgId" = ? AND s.status = 'COMPLETED'`,
    [tpOrgId],
  );
  res.json({
    status: org.status,
    approved: tpIsApproved(String(org.status)),
    courses,
    trainers,
    pendingRequests: requests,
    upcomingTrainings: upcoming,
    averageRating: ratingRow?.avg ? Math.round(ratingRow.avg * 10) / 10 : null,
    ratingCount: ratingRow?.cnt ?? 0,
    revenueCompleted: revenueRow?.total ?? 0,
  });
});

function asCount(row: { c: number | string } | null | undefined): number {
  return Number(row?.c ?? 0);
}

// --- Courses ---

tpPlatformRouter.get("/tp/courses", requireAuth, async (req, res) => {
  const org = await requireTpOrg(req, res);
  if (!org) return;
  const rows = await queryAll<Record<string, unknown>>(
    `SELECT * FROM "TpCourse" WHERE "tpOrgId" = ? ORDER BY "updatedAt" DESC`,
    [org.id],
  );
  res.json({ courses: rows.map(serializeCourse) });
});

tpPlatformRouter.get("/tp/courses/:id", requireAuth, async (req, res) => {
  const org = await requireTpOrg(req, res);
  if (!org) return;
  const row = await queryOne<Record<string, unknown>>(
    `SELECT * FROM "TpCourse" WHERE id = ? AND "tpOrgId" = ?`,
    [req.params.id, org.id],
  );
  if (!row) {
    res.status(404).json({ error: "Course not found" });
    return;
  }
  res.json({ course: serializeCourse(row) });
});

tpPlatformRouter.post("/tp/courses", requireAuth, async (req, res) => {
  const org = await requireTpOrg(req, res);
  if (!org) return;
  const parsed = tpCourseSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
    return;
  }
  const d = parsed.data;
  const id = newId();
  const t = isoNow();
  await execute(
    `INSERT INTO "TpCourse" (
      "id","tpOrgId","title","courseCode","category","description","learningOutcomes","duration",
      "deliveryMode","hrdcClaimable","courseFee","maxParticipants","materialsNote","language",
      "skillLevel","trainingLocation","brochureUrl","slidesUrl","sampleMaterialsUrl","isPublished",
      "createdAt","updatedAt"
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      id,
      org.id,
      d.title,
      d.courseCode,
      d.category,
      d.description,
      d.learningOutcomes,
      d.duration,
      d.deliveryMode,
      d.hrdcClaimable,
      d.courseFee,
      d.maxParticipants,
      d.materialsNote?.trim() || null,
      d.language,
      d.skillLevel,
      d.trainingLocation?.trim() || null,
      d.brochureUrl ?? null,
      d.slidesUrl ?? null,
      d.sampleMaterialsUrl ?? null,
      d.isPublished ?? true,
      t,
      t,
    ],
  );
  res.status(201).json({ course: { id } });
});

tpPlatformRouter.patch("/tp/courses/:id", requireAuth, async (req, res) => {
  const org = await requireTpOrg(req, res);
  if (!org) return;
  const parsed = tpCourseSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload" });
    return;
  }
  const existing = await queryOne<{ id: string }>(
    `SELECT id FROM "TpCourse" WHERE id = ? AND "tpOrgId" = ?`,
    [req.params.id, org.id],
  );
  if (!existing) {
    res.status(404).json({ error: "Course not found" });
    return;
  }
  const d = parsed.data;
  const t = isoNow();
  await execute(
    `UPDATE "TpCourse" SET
      "title"=COALESCE(?,"title"), "courseCode"=COALESCE(?,"courseCode"), "category"=COALESCE(?,"category"),
      "description"=COALESCE(?,"description"), "learningOutcomes"=COALESCE(?,"learningOutcomes"),
      "duration"=COALESCE(?,"duration"), "deliveryMode"=COALESCE(?,"deliveryMode"),
      "hrdcClaimable"=COALESCE(?,"hrdcClaimable"), "courseFee"=COALESCE(?,"courseFee"),
      "maxParticipants"=COALESCE(?,"maxParticipants"), "materialsNote"=COALESCE(?,"materialsNote"),
      "language"=COALESCE(?,"language"), "skillLevel"=COALESCE(?,"skillLevel"),
      "trainingLocation"=COALESCE(?,"trainingLocation"), "brochureUrl"=COALESCE(?,"brochureUrl"),
      "slidesUrl"=COALESCE(?,"slidesUrl"), "sampleMaterialsUrl"=COALESCE(?,"sampleMaterialsUrl"),
      "isPublished"=COALESCE(?,"isPublished"), "updatedAt"=?
     WHERE id=?`,
    [
      d.title ?? null,
      d.courseCode ?? null,
      d.category ?? null,
      d.description ?? null,
      d.learningOutcomes ?? null,
      d.duration ?? null,
      d.deliveryMode ?? null,
      d.hrdcClaimable ?? null,
      d.courseFee ?? null,
      d.maxParticipants ?? null,
      d.materialsNote ?? null,
      d.language ?? null,
      d.skillLevel ?? null,
      d.trainingLocation ?? null,
      d.brochureUrl ?? null,
      d.slidesUrl ?? null,
      d.sampleMaterialsUrl ?? null,
      d.isPublished ?? null,
      t,
      req.params.id,
    ],
  );
  res.json({ ok: true });
});

tpPlatformRouter.delete("/tp/courses/:id", requireAuth, async (req, res) => {
  const org = await requireTpOrg(req, res);
  if (!org) return;
  await execute(`DELETE FROM "TpCourse" WHERE id = ? AND "tpOrgId" = ?`, [
    req.params.id,
    org.id,
  ]);
  res.json({ ok: true });
});

function serializeCourse(row: Record<string, unknown>) {
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
    courseFee: row.courseFee,
    maxParticipants: row.maxParticipants,
    materialsNote: row.materialsNote,
    language: row.language,
    skillLevel: row.skillLevel,
    trainingLocation: row.trainingLocation,
    brochureUrl: row.brochureUrl,
    slidesUrl: row.slidesUrl,
    sampleMaterialsUrl: row.sampleMaterialsUrl,
    isPublished: Boolean(row.isPublished),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

// --- Trainers ---

function asStringArray(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String);
  try {
    const parsed = JSON.parse(String(raw ?? "[]"));
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

tpPlatformRouter.get("/tp/trainers/browse", requireAuth, async (req, res) => {
  const org = await requireTpOrg(req, res);
  if (!org) return;
  if (!tpIsApproved(String(org.status))) {
    res.status(403).json({ error: "Available after admin approval" });
    return;
  }
  const rows = await queryAll<{
    id: string;
    fullName: string;
    expertise: string;
    yearsExp: number;
    languages: string | null;
    stateOrLocation: string | null;
    deliveryModes: string;
    profilePhoto: string | null;
    email: string;
  }>(
    `SELECT t."id", t."fullName", t."expertise", t."yearsExp", t."languages",
            t."stateOrLocation", t."deliveryModes", t."profilePhoto",
            u."email"
     FROM "Trainer" t
     JOIN "User" u ON u."id" = t."userId"
     WHERE t."status" = 'APPROVED'
       AND COALESCE(t."accountStatus", 'ACTIVE') <> 'SUSPENDED'
     ORDER BY t."fullName" ASC`,
  );
  res.json({
    trainers: rows.map((t) => {
      const expertise = asStringArray(JSON.parse(t.expertise || "[]"));
      const delivery = asStringArray(JSON.parse(t.deliveryModes || "[]"));
      return {
        id: t.id,
        fullName: t.fullName,
        email: t.email,
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

tpPlatformRouter.get("/tp/trainers/:id", requireAuth, async (req, res) => {
  const org = await requireTpOrg(req, res);
  if (!org) return;
  if (!tpIsApproved(String(org.status))) {
    res.status(403).json({ error: "Available after admin approval" });
    return;
  }
  const row = await queryOne<Record<string, unknown>>(
    `SELECT t.*, u."email" AS "userEmail"
     FROM "Trainer" t
     JOIN "User" u ON u."id" = t."userId"
     WHERE t."id" = ?
       AND t."status" = 'APPROVED'
       AND COALESCE(t."accountStatus", 'ACTIVE') <> 'SUSPENDED'`,
    [req.params.id],
  );
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const expertise = asStringArray(JSON.parse(String(row.expertise || "[]")));
  const delivery = asStringArray(JSON.parse(String(row.deliveryModes || "[]")));
  const travelLocations = asStringArray(JSON.parse(String(row.travelLocations || "[]")));
  res.json({
    trainer: {
      id: row.id,
      fullName: row.fullName,
      email: row.userEmail,
      phone: row.phone,
      bio: row.bio,
      expertise,
      yearsExp: row.yearsExp,
      linkedIn: row.linkedIn,
      portfolioUrl: row.portfolioUrl,
      profilePhoto: row.profilePhoto,
      stateOrLocation: row.stateOrLocation,
      languages: row.languages,
      deliveryModes: delivery,
      willingToTravel: row.willingToTravel,
      travelLocations,
      certFileUrl: row.certFileUrl,
      approvedAt: row.approvedAt,
      createdAt: row.createdAt,
    },
  });
});

tpPlatformRouter.get("/tp/trainers", requireAuth, async (req, res) => {
  const org = await requireTpOrg(req, res);
  if (!org) return;
  const rows = await queryAll<Record<string, unknown>>(
    `SELECT l.id AS "linkId", l.status AS "linkStatus", l."createdAt" AS "linkedAt",
            t."id" AS "trainerId", t."fullName", t."phone", t."expertise", t."status" AS "trainerStatus",
            u."email" AS "trainerEmail"
     FROM "TpTrainerLink" l
     JOIN "Trainer" t ON t."id" = l."trainerId"
     JOIN "User" u ON u."id" = t."userId"
     WHERE l."tpOrgId" = ?
     ORDER BY l."createdAt" DESC`,
    [org.id],
  );
  res.json({ trainers: rows });
});

tpPlatformRouter.get("/tp/trainers/available", requireAuth, async (req, res) => {
  const org = await requireTpOrg(req, res);
  if (!org) return;
  const rows = await queryAll<Record<string, unknown>>(
    `SELECT t."id", t."fullName", t."expertise", u."email"
     FROM "Trainer" t
     JOIN "User" u ON u."id" = t."userId"
     WHERE t."status" = 'APPROVED'
       AND t."id" NOT IN (SELECT "trainerId" FROM "TpTrainerLink" WHERE "tpOrgId" = ?)
     ORDER BY t."fullName" ASC
     LIMIT 100`,
    [org.id],
  );
  res.json({ trainers: rows });
});

tpPlatformRouter.post("/tp/trainers/link", requireAuth, async (req, res) => {
  const org = await requireTpOrg(req, res);
  if (!org) return;
  const parsed = tpTrainerLinkSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload" });
    return;
  }
  const trainer = await queryOne<{ id: string; status: string }>(
    `SELECT id, status FROM "Trainer" WHERE id = ?`,
    [parsed.data.trainerId],
  );
  if (!trainer || trainer.status !== "APPROVED") {
    res.status(400).json({ error: "Trainer not found or not approved" });
    return;
  }
  const t = isoNow();
  try {
    await execute(
      `INSERT INTO "TpTrainerLink" ("id","tpOrgId","trainerId","status","createdAt") VALUES (?,?,?,?,?)`,
      [newId(), org.id, parsed.data.trainerId, "ACTIVE", t],
    );
  } catch {
    res.status(409).json({ error: "Trainer already linked" });
    return;
  }
  res.status(201).json({ ok: true });
});

tpPlatformRouter.delete("/tp/trainers/link/:trainerId", requireAuth, async (req, res) => {
  const org = await requireTpOrg(req, res);
  if (!org) return;
  await execute(`DELETE FROM "TpTrainerLink" WHERE "tpOrgId" = ? AND "trainerId" = ?`, [
    org.id,
    req.params.trainerId,
  ]);
  res.json({ ok: true });
});

// --- Messages (training provider ↔ trainer) ---

const tpMessageBodySchema = z.object({
  body: z.string().trim().min(1).max(4000),
});

const tpOpenConversationSchema = z.object({
  trainerId: z.string().min(1),
});

tpPlatformRouter.get("/tp/messages", requireAuth, async (req, res) => {
  const org = await requireTpOrg(req, res);
  if (!org) return;
  if (!tpIsApproved(String(org.status))) {
    res.status(403).json({ error: "Available after admin approval" });
    return;
  }
  const trainerConvs = await listConversationsForTp(String(org.id));
  const clientConvs = await listClientConversationsForTp(String(org.id));
  const conversations = [
    ...trainerConvs.map((c) => ({ ...c, channel: "trainer" as const })),
    ...clientConvs.map((c) => ({ ...c, channel: "client" as const })),
  ].sort(
    (a, b) => new Date(String(b.updatedAt)).getTime() - new Date(String(a.updatedAt)).getTime(),
  );
  res.json({ conversations });
});

tpPlatformRouter.get("/tp/messages/:conversationId", requireAuth, async (req, res) => {
  const org = await requireTpOrg(req, res);
  if (!org) return;
  if (!tpIsApproved(String(org.status))) {
    res.status(403).json({ error: "Available after admin approval" });
    return;
  }
  const conv = await assertConversationForTp(req.params.conversationId, String(org.id));
  if (conv) {
    const trainer = await assertApprovedTrainer(conv.trainerId);
    const messages = await getConversationMessages(conv.id);
    res.json({
      conversation: {
        id: conv.id,
        channel: "trainer",
        trainerId: conv.trainerId,
        trainerName: trainer?.fullName ?? "Trainer",
      },
      messages: messages.map((m) => ({
        id: String(m.id),
        senderRole: String(m.senderRole),
        body: String(m.body),
        sentAt: String(m.createdAt),
      })),
    });
    return;
  }
  const clientConv = await assertClientConversationForTp(
    req.params.conversationId,
    String(org.id),
  );
  if (!clientConv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  const client = await queryOne<{ companyName: string; contactName: string }>(
    `SELECT "companyName", "contactName" FROM "Client" WHERE "id" = ?`,
    [clientConv.clientId],
  );
  const messages = await getClientConversationMessages(clientConv.id);
  res.json({
    conversation: {
      id: clientConv.id,
      channel: "client",
      clientId: clientConv.clientId,
      clientCompanyName: client?.companyName ?? "Employer",
      clientContactName: client?.contactName ?? "",
    },
    messages: messages.map((m) => ({
      id: String(m.id),
      senderRole: String(m.senderRole),
      body: String(m.body),
      sentAt: String(m.createdAt),
    })),
  });
});

tpPlatformRouter.post("/tp/messages/open", requireAuth, async (req, res) => {
  const org = await requireTpOrg(req, res);
  if (!org) return;
  if (!tpIsApproved(String(org.status))) {
    res.status(403).json({ error: "Available after admin approval" });
    return;
  }
  const parsed = tpOpenConversationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload" });
    return;
  }
  const trainer = await assertApprovedTrainer(parsed.data.trainerId);
  if (!trainer || trainer.status !== "APPROVED") {
    res.status(404).json({ error: "Trainer not found" });
    return;
  }
  const conversationId = await getOrCreateConversation(String(org.id), trainer.id);
  const messages = await getConversationMessages(conversationId);
  res.json({
    conversation: {
      id: conversationId,
      trainerId: trainer.id,
      trainerName: trainer.fullName,
    },
    messages: messages.map((m) => ({
      id: String(m.id),
      senderRole: String(m.senderRole),
      body: String(m.body),
      sentAt: String(m.createdAt),
    })),
  });
});

tpPlatformRouter.post("/tp/messages/:conversationId/send", requireAuth, async (req, res) => {
  const org = await requireTpOrg(req, res);
  if (!org) return;
  if (!tpIsApproved(String(org.status))) {
    res.status(403).json({ error: "Available after admin approval" });
    return;
  }
  const parsed = tpMessageBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload" });
    return;
  }
  const conv = await assertConversationForTp(req.params.conversationId, String(org.id));
  if (conv) {
    const message = await sendMessage(conv.id, "TP", parsed.data.body);
    res.status(201).json({ message });
    return;
  }
  const clientConv = await assertClientConversationForTp(
    req.params.conversationId,
    String(org.id),
  );
  if (!clientConv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  const message = await sendClientMessage(clientConv.id, "TP", parsed.data.body);
  res.status(201).json({ message });
});

// --- Employer requests ---

tpPlatformRouter.get("/tp/requests", requireAuth, async (req, res) => {
  const org = await requireTpOrg(req, res);
  if (!org) return;
  const rows = await queryAll<Record<string, unknown>>(
    `SELECT * FROM "TpEmployerRequest" WHERE "tpOrgId" = ? ORDER BY "createdAt" DESC`,
    [org.id],
  );
  res.json({ requests: rows });
});

// --- Schedules ---

tpPlatformRouter.get("/tp/schedules", requireAuth, async (req, res) => {
  const org = await requireTpOrg(req, res);
  if (!org) return;
  const rows = await queryAll<Record<string, unknown>>(
    `SELECT s.*, c."title" AS "courseTitle", t."fullName" AS "trainerName", cl."companyName" AS "clientCompany"
     FROM "TpSchedule" s
     LEFT JOIN "TpCourse" c ON c."id" = s."courseId"
     LEFT JOIN "Trainer" t ON t."id" = s."trainerId"
     LEFT JOIN "Client" cl ON cl."id" = s."clientId"
     WHERE s."tpOrgId" = ?
     ORDER BY s."scheduledDate" ASC, s."scheduledTime" ASC`,
    [org.id],
  );
  res.json({ schedules: rows });
});

tpPlatformRouter.post("/tp/schedules", requireAuth, async (req, res) => {
  const org = await requireTpOrg(req, res);
  if (!org) return;
  const parsed = tpScheduleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
    return;
  }
  const d = parsed.data;
  const id = newId();
  const t = isoNow();
  await execute(
    `INSERT INTO "TpSchedule" (
      "id","tpOrgId","courseId","employerRequestId","trainerId","clientId",
      "scheduledDate","scheduledTime","venue","onlineMeetingLink","status","notes","createdAt","updatedAt"
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      id,
      org.id,
      d.courseId,
      d.employerRequestId ?? null,
      d.trainerId ?? null,
      d.clientId ?? null,
      d.scheduledDate,
      d.scheduledTime,
      d.venue?.trim() || null,
      d.onlineMeetingLink?.trim() || null,
      d.status ?? "DRAFT",
      d.notes?.trim() || null,
      t,
      t,
    ],
  );
  if (d.employerRequestId) {
    await execute(
      `UPDATE "TpEmployerRequest" SET status='PROPOSED', "updatedAt"=? WHERE id=? AND "tpOrgId"=?`,
      [t, d.employerRequestId, org.id],
    );
  }
  res.status(201).json({ id });
});

tpPlatformRouter.patch("/tp/schedules/:id", requireAuth, async (req, res) => {
  const org = await requireTpOrg(req, res);
  if (!org) return;
  const parsed = tpScheduleSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload" });
    return;
  }
  const d = parsed.data;
  const t = isoNow();
  await execute(
    `UPDATE "TpSchedule" SET
      "courseId"=COALESCE(?,"courseId"), "trainerId"=COALESCE(?,"trainerId"),
      "clientId"=COALESCE(?,"clientId"), "scheduledDate"=COALESCE(?,"scheduledDate"),
      "scheduledTime"=COALESCE(?,"scheduledTime"), "venue"=COALESCE(?,"venue"),
      "onlineMeetingLink"=COALESCE(?,"onlineMeetingLink"), "status"=COALESCE(?,"status"),
      "notes"=COALESCE(?,"notes"), "updatedAt"=?
     WHERE id=? AND "tpOrgId"=?`,
    [
      d.courseId ?? null,
      d.trainerId ?? null,
      d.clientId ?? null,
      d.scheduledDate ?? null,
      d.scheduledTime ?? null,
      d.venue ?? null,
      d.onlineMeetingLink ?? null,
      d.status ?? null,
      d.notes ?? null,
      t,
      req.params.id,
      org.id,
    ],
  );
  res.json({ ok: true });
});

// --- Ratings ---

tpPlatformRouter.get("/tp/ratings", requireAuth, async (req, res) => {
  const org = await requireTpOrg(req, res);
  if (!org) return;
  const rows = await queryAll<Record<string, unknown>>(
    `SELECT r.*, c."companyName" FROM "TpRating" r
     LEFT JOIN "Client" c ON c."id" = r."clientId"
     WHERE r."tpOrgId" = ? ORDER BY r."createdAt" DESC`,
    [org.id],
  );
  res.json({ ratings: rows });
});

// --- Admin ---

tpPlatformRouter.get("/admin/tp-orgs", requireRoles(["ADMIN"]), async (_req, res) => {
  const rows = await queryAll<Record<string, unknown>>(
    `SELECT o.*, u."email" AS "userEmail",
            (SELECT COUNT(*) FROM "TpCourse" c WHERE c."tpOrgId" = o."id") AS "courseCount"
     FROM "TpOrganization" o
     JOIN "User" u ON u."id" = o."userId"
     WHERE o."status" <> 'REJECTED'
     ORDER BY o."createdAt" DESC`,
  );
  res.json({
    orgs: rows.map((r) => ({
      ...serializeTpOrg(r),
      userEmail: r.userEmail,
      courseCount: Number(r.courseCount ?? 0),
    })),
  });
});

tpPlatformRouter.get("/admin/tp-orgs/:id", requireRoles(["ADMIN"]), async (req, res) => {
  const row = await queryOne<Record<string, unknown>>(
    `SELECT o.*, u."email" AS "userEmail",
            (SELECT COUNT(*) FROM "TpCourse" c WHERE c."tpOrgId" = o."id") AS "courseCount"
     FROM "TpOrganization" o
     JOIN "User" u ON u."id" = o."userId" WHERE o."id" = ?`,
    [req.params.id],
  );
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({
    org: {
      ...serializeTpOrg(row),
      userEmail: row.userEmail,
      courseCount: Number(row.courseCount ?? 0),
    },
  });
});

tpPlatformRouter.get("/admin/tp-orgs/:id/courses", requireRoles(["ADMIN"]), async (req, res) => {
  const rows = await queryAll<Record<string, unknown>>(
    `SELECT * FROM "TpCourse" WHERE "tpOrgId" = ? ORDER BY "updatedAt" DESC`,
    [req.params.id],
  );
  res.json({ courses: rows.map(serializeCourse) });
});

tpPlatformRouter.patch("/admin/tp-orgs/:id/approve", requireRoles(["ADMIN"]), async (req, res) => {
  const t = isoNow();
  await execute(
    `UPDATE "TpOrganization" SET status='APPROVED', "approvedAt"=?, "adminNote"=NULL, "updatedAt"=? WHERE id=?`,
    [t, t, req.params.id],
  );
  res.json({ ok: true });
});

tpPlatformRouter.get("/admin/tp-courses/:id", requireRoles(["ADMIN"]), async (req, res) => {
  const row = await queryOne<Record<string, unknown>>(
    `SELECT c.*, o."companyName", o."status" AS "tpStatus", o."id" AS "tpOrgId"
     FROM "TpCourse" c
     JOIN "TpOrganization" o ON o."id" = c."tpOrgId"
     WHERE c."id" = ?`,
    [req.params.id],
  );
  if (!row) {
    res.status(404).json({ error: "Course not found" });
    return;
  }
  res.json({
    course: {
      ...serializeCourse(row),
      companyName: String(row.companyName ?? ""),
      tpStatus: String(row.tpStatus ?? ""),
      tpOrgId: String(row.tpOrgId ?? ""),
    },
  });
});

tpPlatformRouter.get("/admin/tp-courses", requireRoles(["ADMIN"]), async (_req, res) => {
  const rows = await queryAll<Record<string, unknown>>(
    `SELECT c.*, o."companyName", o."status" AS "tpStatus"
     FROM "TpCourse" c
     JOIN "TpOrganization" o ON o."id" = c."tpOrgId"
     ORDER BY c."updatedAt" DESC`,
  );
  res.json({
    courses: rows.map((row) => ({
      ...serializeCourse(row),
      companyName: String(row.companyName ?? ""),
      tpStatus: String(row.tpStatus ?? ""),
      tpOrgId: String(row.tpOrgId ?? ""),
    })),
  });
});

tpPlatformRouter.patch("/admin/tp-orgs/:id/reject", requireRoles(["ADMIN"]), async (req, res) => {
  const note = z.string().trim().max(2000).optional().parse(req.body?.adminNote);
  const t = isoNow();
  await execute(
    `UPDATE "TpOrganization" SET status='REJECTED', "adminNote"=?, "updatedAt"=? WHERE id=?`,
    [note ?? "Application rejected.", t, req.params.id],
  );
  await execute(`DELETE FROM notifications WHERE tp_org_id = ?`, [req.params.id]);
  res.json({ ok: true });
});
