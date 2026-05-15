import "dotenv/config";
import bcrypt from "bcrypt";

import { initDb } from "./src/db/connection.js";
import { execute, queryOne } from "./src/db/query.js";
import { newId } from "./src/db/ids.js";
import type { Role } from "./src/db/types.js";

const now = () => new Date().toISOString();

async function upsertUserByEmail(
  email: string,
  role: Role,
  passwordHash: string,
): Promise<string> {
  const existing = await queryOne<{ id: string }>(
    `SELECT "id" FROM "User" WHERE "email" = ?`,
    [email],
  );
  if (existing) {
    await execute(`UPDATE "User" SET "passwordHash" = ?, "role" = ? WHERE "id" = ?`, [
      passwordHash,
      role,
      existing.id,
    ]);
    return existing.id;
  }
  const id = newId();
  await execute(
    `INSERT INTO "User" ("id","email","passwordHash","role","createdAt") VALUES (?,?,?,?,?)`,
    [id, email, passwordHash, role, now()],
  );
  return id;
}

async function main() {
  await initDb();
  const email = process.env.ADMIN_EMAIL ?? "admin@mytrainer.com";
  const password = process.env.ADMIN_PASSWORD ?? "admin12345";
  const passwordHash = await bcrypt.hash(password, 12);
  await upsertUserByEmail(email, "ADMIN", passwordHash);
  console.log(`Seeded admin: ${email} (password from ADMIN_PASSWORD or default)`);

  const trainerEmail = "trainer2@gmail.com";
  const trainerPassword = "trainer2";
  const trainerHash = await bcrypt.hash(trainerPassword, 12);
  const approvedAt = now();

  const userId = await upsertUserByEmail(trainerEmail, "TRAINER", trainerHash);

  const expertise = JSON.stringify(["Leadership", "IT & Software", "Safety & Compliance"]);
  const deliveryModes = JSON.stringify(["On-site", "Virtual / online", "Hybrid"]);
  const travelLocations = JSON.stringify(["Klang Valley", "Nationwide"]);
  const t = now();

  const existingTrainer = await queryOne<{ id: string }>(
    `SELECT "id" FROM "Trainer" WHERE "userId" = ?`,
    [userId],
  );

  if (existingTrainer) {
    await execute(
      `UPDATE "Trainer" SET "fullName"=?, "phone"=?, "bio"=?, "expertise"=?, "yearsExp"=?,
        "linkedIn"=?, "portfolioUrl"=?, "deliveryModes"=?, "willingToTravel"=?, "travelLocations"=?,
        "certFileUrl"=?, "status"=?, "approvedAt"=?, "adminNote"=?, "updatedAt"=?
       WHERE "userId"=?`,
      [
        "Ahmad Haris",
        "+60129876543",
        "HRDC-certified trainer with experience in leadership development, digital skills, and workplace safety. Available for in-house and virtual workshops across Malaysia.",
        expertise,
        8,
        "https://www.linkedin.com/in/example-verified-trainer",
        "https://example.com/trainer-portfolio",
        deliveryModes,
        "Yes",
        travelLocations,
        "/uploads/hrdc-cert-verified-placeholder.pdf",
        "APPROVED",
        approvedAt,
        "Seeded approved account for UI testing.",
        t,
        userId,
      ],
    );
  } else {
    const tid = newId();
    await execute(
      `INSERT INTO "Trainer" ("id","userId","fullName","phone","bio","expertise","yearsExp","linkedIn","portfolioUrl",
        "profilePhoto","stateOrLocation","languages","deliveryModes","willingToTravel","travelLocations","certFileUrl",
        "status","adminNote","approvedAt","createdAt","updatedAt")
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        tid,
        userId,
        "Ahmad Haris",
        "+60129876543",
        "HRDC-certified trainer with experience in leadership development, digital skills, and workplace safety. Available for in-house and virtual workshops across Malaysia.",
        expertise,
        8,
        "https://www.linkedin.com/in/example-verified-trainer",
        "https://example.com/trainer-portfolio",
        null,
        null,
        null,
        deliveryModes,
        "Yes",
        travelLocations,
        "/uploads/hrdc-cert-verified-placeholder.pdf",
        "APPROVED",
        "Seeded approved account for UI testing.",
        approvedAt,
        t,
        t,
      ],
    );
  }

  console.log(`Seeded approved trainer: ${trainerEmail} / ${trainerPassword}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
