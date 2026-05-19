import "./src/load-env.js";
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
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
