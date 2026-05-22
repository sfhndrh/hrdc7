import { execute, queryAll, queryOne } from "../db/query.js";
import { newId } from "../db/ids.js";

export type MessageSenderRole = "TP" | "TRAINER";

function asStringArray(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String);
  try {
    const parsed = JSON.parse(String(raw ?? "[]"));
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export async function getOrCreateConversation(tpOrgId: string, trainerId: string) {
  const existing = await queryOne<{ id: string }>(
    `SELECT id FROM "TpTrainerConversation" WHERE "tpOrgId" = ? AND "trainerId" = ?`,
    [tpOrgId, trainerId],
  );
  if (existing) return existing.id;

  const t = new Date().toISOString();
  const id = newId();
  await execute(
    `INSERT INTO "TpTrainerConversation" ("id","tpOrgId","trainerId","createdAt","updatedAt")
     VALUES (?,?,?,?,?)`,
    [id, tpOrgId, trainerId, t, t],
  );
  return id;
}

export async function listConversationsForTp(tpOrgId: string) {
  const rows = await queryAll<Record<string, unknown>>(
    `SELECT c."id", c."trainerId", c."updatedAt",
            t."fullName" AS "trainerName", t."expertise" AS "trainerExpertise"
     FROM "TpTrainerConversation" c
     JOIN "Trainer" t ON t."id" = c."trainerId"
     WHERE c."tpOrgId" = ?
     ORDER BY c."updatedAt" DESC`,
    [tpOrgId],
  );
  return Promise.all(rows.map((row) => enrichConversationRow(row)));
}

export async function listConversationsForTrainer(trainerId: string) {
  const rows = await queryAll<Record<string, unknown>>(
    `SELECT c."id", c."tpOrgId", c."updatedAt",
            o."companyName" AS "tpCompanyName"
     FROM "TpTrainerConversation" c
     JOIN "TpOrganization" o ON o."id" = c."tpOrgId"
     WHERE c."trainerId" = ?
     ORDER BY c."updatedAt" DESC`,
    [trainerId],
  );
  return Promise.all(rows.map((row) => enrichConversationRow(row)));
}

async function enrichConversationRow(row: Record<string, unknown>) {
  const last = await queryOne<Record<string, unknown>>(
    `SELECT "body", "senderRole", "createdAt"
     FROM "TpTrainerMessage"
     WHERE "conversationId" = ?
     ORDER BY "createdAt" DESC
     LIMIT 1`,
    [String(row.id)],
  );
  const expertise = asStringArray(row.trainerExpertise);
  return {
    id: String(row.id),
    trainerId: row.trainerId != null ? String(row.trainerId) : undefined,
    tpOrgId: row.tpOrgId != null ? String(row.tpOrgId) : undefined,
    trainerName: row.trainerName != null ? String(row.trainerName) : undefined,
    trainerTitle:
      expertise.length > 0
        ? expertise.slice(0, 3).join(", ")
        : row.trainerName
          ? "Certified trainer"
          : undefined,
    tpCompanyName: row.tpCompanyName != null ? String(row.tpCompanyName) : undefined,
    updatedAt: String(row.updatedAt),
    lastMessage: last
      ? {
          body: String(last.body),
          senderRole: String(last.senderRole) as MessageSenderRole,
          sentAt: String(last.createdAt),
        }
      : null,
  };
}

export async function getConversationMessages(conversationId: string) {
  return queryAll<Record<string, unknown>>(
    `SELECT "id", "senderRole", "body", "createdAt"
     FROM "TpTrainerMessage"
     WHERE "conversationId" = ?
     ORDER BY "createdAt" ASC`,
    [conversationId],
  );
}

export async function sendMessage(
  conversationId: string,
  senderRole: MessageSenderRole,
  body: string,
) {
  const t = new Date().toISOString();
  const id = newId();
  await execute(
    `INSERT INTO "TpTrainerMessage" ("id","conversationId","senderRole","body","createdAt")
     VALUES (?,?,?,?,?)`,
    [id, conversationId, senderRole, body, t],
  );
  await execute(`UPDATE "TpTrainerConversation" SET "updatedAt" = ? WHERE "id" = ?`, [
    t,
    conversationId,
  ]);
  return { id, senderRole, body, sentAt: t };
}

export async function assertConversationForTp(conversationId: string, tpOrgId: string) {
  return queryOne<{ id: string; trainerId: string }>(
    `SELECT "id", "trainerId" FROM "TpTrainerConversation"
     WHERE "id" = ? AND "tpOrgId" = ?`,
    [conversationId, tpOrgId],
  );
}

export async function assertConversationForTrainer(conversationId: string, trainerId: string) {
  return queryOne<{ id: string; tpOrgId: string }>(
    `SELECT "id", "tpOrgId" FROM "TpTrainerConversation"
     WHERE "id" = ? AND "trainerId" = ?`,
    [conversationId, trainerId],
  );
}

export async function assertApprovedTrainer(trainerId: string) {
  return queryOne<{ id: string; fullName: string; status: string }>(
    `SELECT "id", "fullName", "status" FROM "Trainer" WHERE "id" = ?`,
    [trainerId],
  );
}
