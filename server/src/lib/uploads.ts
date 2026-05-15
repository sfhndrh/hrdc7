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

const DIRS = [
  HRDC_CERT_UPLOAD_DIR,
  COMPANY_PROFILE_PHOTO_DIR,
  TRAINER_PROFILE_PHOTO_DIR,
  PAYMENT_QR_DIR,
  PAYMENT_PROOF_DIR,
];

export function ensureUploadDirs(): void {
  for (const dir of DIRS) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function resolveHrdcCertPath(filename: string): string {
  return path.join(HRDC_CERT_UPLOAD_DIR, filename);
}
