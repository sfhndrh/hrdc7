import pg from "pg";
import { getDatabaseUrl, isProduction } from "../config/env.js";

const { Pool } = pg;

let pool: pg.Pool | null = null;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'CLIENT',
  "createdAt" TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

CREATE TABLE IF NOT EXISTS "Trainer" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "fullName" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "bio" TEXT NOT NULL,
  "expertise" TEXT NOT NULL,
  "yearsExp" INTEGER NOT NULL,
  "linkedIn" TEXT,
  "portfolioUrl" TEXT,
  "profilePhoto" TEXT,
  "stateOrLocation" TEXT,
  "languages" TEXT,
  "deliveryModes" TEXT NOT NULL,
  "willingToTravel" TEXT,
  "travelLocations" TEXT NOT NULL,
  "certFileUrl" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "adminNote" TEXT,
  "approvedAt" TEXT,
  "ai_recommendation" TEXT,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "Trainer_userId_key" ON "Trainer"("userId");

CREATE TABLE IF NOT EXISTS "AiVerification" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "trainerId" TEXT NOT NULL REFERENCES "Trainer"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "validCert" BOOLEAN NOT NULL,
  "extractedName" TEXT,
  "certNumber" TEXT,
  "issueDate" TEXT,
  "expiryDate" TEXT,
  "domain" TEXT,
  "confidence" INTEGER NOT NULL,
  "flags" TEXT NOT NULL,
  "summary" TEXT,
  "rawResponse" TEXT NOT NULL,
  "createdAt" TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "AiVerification_trainerId_key" ON "AiVerification"("trainerId");

CREATE TABLE IF NOT EXISTS ai_verification (
  id                TEXT PRIMARY KEY,
  trainer_id        TEXT NOT NULL UNIQUE REFERENCES "Trainer"("id") ON DELETE CASCADE,
  overall_passed    BOOLEAN NOT NULL DEFAULT false,
  confidence_score  INTEGER NOT NULL DEFAULT 0,
  flags             TEXT NOT NULL DEFAULT '[]',
  cert_is_hrdc      BOOLEAN,
  cert_name         TEXT,
  cert_number       TEXT,
  cert_issue_date   TEXT,
  cert_expiry_date  TEXT,
  cert_domain       TEXT,
  cert_expired      BOOLEAN,
  cert_has_seal     BOOLEAN,
  cert_tampered     BOOLEAN,
  name_matches_reg  BOOLEAN,
  ai_recommendation TEXT,
  summary           TEXT,
  raw_response      TEXT NOT NULL DEFAULT '{}',
  created_at        TEXT NOT NULL DEFAULT (NOW()::text)
);

CREATE TABLE IF NOT EXISTS notifications (
  id          TEXT PRIMARY KEY,
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  trainer_id  TEXT,
  is_read     BOOLEAN NOT NULL DEFAULT false,
  created_at  TEXT NOT NULL DEFAULT (NOW()::text)
);

CREATE TABLE IF NOT EXISTS "Client" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "companyName" TEXT NOT NULL,
  "regNumber" TEXT NOT NULL,
  "industry" TEXT NOT NULL,
  "contactName" TEXT NOT NULL,
  "contactEmail" TEXT,
  "phone" TEXT NOT NULL,
  "address" TEXT,
  "profilePhoto" TEXT,
  "profileComplete" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "Client_userId_key" ON "Client"("userId");

CREATE TABLE IF NOT EXISTS "Subscription" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "clientId" TEXT NOT NULL REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "status" TEXT NOT NULL DEFAULT 'PENDING_PAYMENT',
  "planType" TEXT NOT NULL DEFAULT 'monthly',
  "amount" DOUBLE PRECISION NOT NULL,
  "proofUrl" TEXT,
  "notes" TEXT,
  "requestedAt" TEXT NOT NULL,
  "paidAt" TEXT,
  "expiresAt" TEXT,
  "approvedBy" TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_clientId_key" ON "Subscription"("clientId");

CREATE TABLE IF NOT EXISTS "PaymentSubmission" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "clientId" TEXT NOT NULL REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "amount" DOUBLE PRECISION NOT NULL,
  "proofUrl" TEXT,
  "notes" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "submittedAt" TEXT NOT NULL,
  "reviewedAt" TEXT,
  "reviewedBy" TEXT
);
CREATE INDEX IF NOT EXISTS "PaymentSubmission_clientId_idx" ON "PaymentSubmission"("clientId");

CREATE TABLE IF NOT EXISTS "PaymentSettings" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "bankName" TEXT,
  "accountName" TEXT,
  "accountNumber" TEXT,
  "amount" DOUBLE PRECISION NOT NULL DEFAULT 99,
  "qrImageUrl" TEXT,
  "updatedAt" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS training_provider_sync (
  id TEXT PRIMARY KEY DEFAULT 'default',
  scraped_at TEXT NOT NULL,
  model TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS training_provider (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  registration_no TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  fax TEXT NOT NULL DEFAULT '',
  website TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  state TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  detail_url TEXT NOT NULL DEFAULT '',
  scraped_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS training_provider_name_idx ON training_provider(name);

CREATE TABLE IF NOT EXISTS training_provider_course (
  id TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL REFERENCES training_provider(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  code TEXT NOT NULL DEFAULT '',
  scheme TEXT NOT NULL DEFAULT '',
  claimable BOOLEAN NOT NULL DEFAULT false,
  duration TEXT NOT NULL DEFAULT '',
  fee TEXT NOT NULL DEFAULT '',
  mode TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS training_provider_course_provider_idx ON training_provider_course(provider_id);
`;

export function getPool(): pg.Pool {
  if (!pool) {
    const useSsl =
      process.env.DATABASE_SSL === "true" ||
      (isProduction && process.env.DATABASE_SSL !== "false");

    pool = new Pool({
      connectionString: getDatabaseUrl(),
      ssl: useSsl ? { rejectUnauthorized: false } : false,
      max: Number(process.env.DATABASE_POOL_MAX ?? 10),
    });
  }
  return pool;
}

const SCHEMA_MIGRATIONS = `
ALTER TABLE "Trainer" ADD COLUMN IF NOT EXISTS "earliestStartDate" TEXT;
ALTER TABLE "Trainer" ADD COLUMN IF NOT EXISTS "availabilityStatus" TEXT;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "profileType" TEXT NOT NULL DEFAULT 'COMPANY';
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "profileData" TEXT;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "accountStatus" TEXT NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "suspensionReason" TEXT;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "suspendedAt" TEXT;
ALTER TABLE "Trainer" ADD COLUMN IF NOT EXISTS "accountStatus" TEXT NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "Trainer" ADD COLUMN IF NOT EXISTS "suspensionReason" TEXT;
ALTER TABLE "Trainer" ADD COLUMN IF NOT EXISTS "suspendedAt" TEXT;

CREATE TABLE IF NOT EXISTS "TpOrganization" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "companyName" TEXT NOT NULL,
  "ssmNumber" TEXT NOT NULL,
  "companyEmail" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "address" TEXT NOT NULL,
  "website" TEXT,
  "hrdcTpId" TEXT,
  "logoUrl" TEXT,
  "description" TEXT,
  "picName" TEXT NOT NULL,
  "picPosition" TEXT NOT NULL,
  "picEmail" TEXT NOT NULL,
  "picPhone" TEXT NOT NULL,
  "ssmCertUrl" TEXT NOT NULL,
  "hrdcDocUrl" TEXT NOT NULL,
  "businessLicenseUrl" TEXT NOT NULL,
  "bankProofUrl" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "accountStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
  "suspensionReason" TEXT,
  "suspendedAt" TEXT,
  "adminNote" TEXT,
  "approvedAt" TEXT,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "TpOrganization_userId_key" ON "TpOrganization"("userId");

CREATE TABLE IF NOT EXISTS "TpCourse" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tpOrgId" TEXT NOT NULL REFERENCES "TpOrganization"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "courseCode" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "learningOutcomes" TEXT NOT NULL,
  "duration" TEXT NOT NULL,
  "deliveryMode" TEXT NOT NULL,
  "hrdcClaimable" TEXT NOT NULL,
  "courseFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "maxParticipants" INTEGER NOT NULL DEFAULT 20,
  "materialsNote" TEXT,
  "language" TEXT NOT NULL,
  "skillLevel" TEXT NOT NULL,
  "trainingLocation" TEXT,
  "brochureUrl" TEXT,
  "slidesUrl" TEXT,
  "sampleMaterialsUrl" TEXT,
  "isPublished" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS "TpCourse_tpOrgId_idx" ON "TpCourse"("tpOrgId");

CREATE TABLE IF NOT EXISTS "TpTrainerLink" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tpOrgId" TEXT NOT NULL REFERENCES "TpOrganization"("id") ON DELETE CASCADE,
  "trainerId" TEXT NOT NULL REFERENCES "Trainer"("id") ON DELETE CASCADE,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TEXT NOT NULL,
  UNIQUE("tpOrgId", "trainerId")
);

CREATE TABLE IF NOT EXISTS "TpEmployerRequest" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tpOrgId" TEXT NOT NULL REFERENCES "TpOrganization"("id") ON DELETE CASCADE,
  "clientId" TEXT REFERENCES "Client"("id") ON DELETE SET NULL,
  "companyName" TEXT NOT NULL,
  "contactName" TEXT NOT NULL,
  "contactEmail" TEXT,
  "contactPhone" TEXT,
  "courseTitle" TEXT NOT NULL,
  "message" TEXT,
  "preferredDates" TEXT,
  "status" TEXT NOT NULL DEFAULT 'REQUESTED',
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS "TpEmployerRequest_tpOrgId_idx" ON "TpEmployerRequest"("tpOrgId");

CREATE TABLE IF NOT EXISTS "TpSchedule" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tpOrgId" TEXT NOT NULL REFERENCES "TpOrganization"("id") ON DELETE CASCADE,
  "courseId" TEXT REFERENCES "TpCourse"("id") ON DELETE SET NULL,
  "employerRequestId" TEXT REFERENCES "TpEmployerRequest"("id") ON DELETE SET NULL,
  "trainerId" TEXT REFERENCES "Trainer"("id") ON DELETE SET NULL,
  "clientId" TEXT REFERENCES "Client"("id") ON DELETE SET NULL,
  "scheduledDate" TEXT NOT NULL,
  "scheduledTime" TEXT NOT NULL,
  "venue" TEXT,
  "onlineMeetingLink" TEXT,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "notes" TEXT,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS "TpSchedule_tpOrgId_idx" ON "TpSchedule"("tpOrgId");

CREATE TABLE IF NOT EXISTS "TpRating" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tpOrgId" TEXT NOT NULL REFERENCES "TpOrganization"("id") ON DELETE CASCADE,
  "scheduleId" TEXT REFERENCES "TpSchedule"("id") ON DELETE SET NULL,
  "clientId" TEXT REFERENCES "Client"("id") ON DELETE SET NULL,
  "score" INTEGER NOT NULL,
  "comment" TEXT,
  "createdAt" TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS "TpRating_tpOrgId_idx" ON "TpRating"("tpOrgId");

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS tp_org_id TEXT;
ALTER TABLE "TpOrganization" ADD COLUMN IF NOT EXISTS "hrdcRegApprovedAt" TEXT;
ALTER TABLE "TpOrganization" ADD COLUMN IF NOT EXISTS "hrdcRegExpiresAt" TEXT;
`;

export async function initDb(): Promise<void> {
  const p = getPool();
  await p.query(SCHEMA);
  await p.query(SCHEMA_MIGRATIONS);
}

export async function closeDb(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
