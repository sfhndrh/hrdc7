import fs from "node:fs";
import path from "node:path";

import { getUploadRoot } from "../config/env.js";

/**
 * Local disk uploads (multer). Railway volumes are ephemeral unless you attach
 * persistent storage — plan migration to S3/R2/Supabase Storage for production
 * file retention across deploys.
 */
const uploadRoot = path.resolve(process.cwd(), getUploadRoot());

export const HRDC_CERT_UPLOAD_DIR = path.join(uploadRoot, "hrdc-certs");
export const COMPANY_PROFILE_PHOTO_DIR = path.join(
  uploadRoot,
  "company-profile-photos",
);
export const TRAINER_PROFILE_PHOTO_DIR = path.join(
  uploadRoot,
  "trainer-profile-photos",
);
export const PAYMENT_QR_DIR = path.join(uploadRoot, "payment-qr");
export const PAYMENT_PROOF_DIR = path.join(uploadRoot, "payment-proofs");
export const TP_LOGO_DIR = path.join(uploadRoot, "tp-logos");
export const TP_VERIFICATION_DIR = path.join(uploadRoot, "tp-verification");
export const TP_COURSE_FILES_DIR = path.join(uploadRoot, "tp-course-files");

const DIRS = [
  HRDC_CERT_UPLOAD_DIR,
  COMPANY_PROFILE_PHOTO_DIR,
  TRAINER_PROFILE_PHOTO_DIR,
  PAYMENT_QR_DIR,
  PAYMENT_PROOF_DIR,
  TP_LOGO_DIR,
  TP_VERIFICATION_DIR,
  TP_COURSE_FILES_DIR,
];

export function ensureUploadDirs(): void {
  for (const dir of DIRS) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function resolveHrdcCertPath(filename: string): string {
  return path.join(HRDC_CERT_UPLOAD_DIR, filename);
}

const UPLOAD_URL_PREFIXES: Array<{ prefix: string; dir: string }> = [
  { prefix: "/api/uploads/company-photos/", dir: COMPANY_PROFILE_PHOTO_DIR },
  { prefix: "/api/uploads/payment-proof/", dir: PAYMENT_PROOF_DIR },
  { prefix: "/api/uploads/tp-logos/", dir: TP_LOGO_DIR },
  { prefix: "/api/uploads/tp-verification/", dir: TP_VERIFICATION_DIR },
  { prefix: "/api/uploads/tp-course-files/", dir: TP_COURSE_FILES_DIR },
];

/** Best-effort removal of a file previously served under /api/uploads/… */
export function deleteUploadByPublicUrl(url: string | null | undefined): void {
  const trimmed = url?.trim();
  if (!trimmed) return;

  for (const { prefix, dir } of UPLOAD_URL_PREFIXES) {
    if (!trimmed.startsWith(prefix)) continue;
    const filename = path.basename(trimmed.slice(prefix.length));
    const base = path.resolve(dir);
    const full = path.resolve(base, filename);
    if (!full.startsWith(base + path.sep)) return;
    try {
      if (fs.existsSync(full)) fs.unlinkSync(full);
    } catch {
      /* ignore cleanup errors */
    }
    return;
  }
}
