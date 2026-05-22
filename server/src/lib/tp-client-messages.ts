import { execute, queryAll, queryOne } from "../db/query.js";
import { newId } from "../db/ids.js";

export type ClientMessageSenderRole = "TP" | "CLIENT";

export async function getOrCreateClientConversation(tpOrgId: string, clientId: string) {
  const existing = await queryOne<{ id: string }>(
    `SELECT id FROM "TpClientConversation" WHERE "tpOrgId" = ? AND "clientId" = ?`,
    [tpOrgId, clientId],
  );
  if (existing) return existing.id;

  const t = new Date().toISOString();
  const id = newId();
  await execute(
    `INSERT INTO "TpClientConversation" ("id","tpOrgId","clientId","createdAt","updatedAt")
     VALUES (?,?,?,?,?)`,
    [id, tpOrgId, clientId, t, t],
  );
  return id;
}

async function enrichClientConversationRow(row: Record<string, unknown>) {
  const last = await queryOne<Record<string, unknown>>(
    `SELECT "body", "senderRole", "createdAt"
     FROM "TpClientMessage"
     WHERE "conversationId" = ?
     ORDER BY "createdAt" DESC
     LIMIT 1`,
    [String(row.id)],
  );
  return {
    id: String(row.id),
    channel: "client" as const,
    clientId: row.clientId != null ? String(row.clientId) : undefined,
    tpOrgId: row.tpOrgId != null ? String(row.tpOrgId) : undefined,
    clientCompanyName:
      row.clientCompanyName != null ? String(row.clientCompanyName) : undefined,
    clientContactName: row.clientContactName != null ? String(row.clientContactName) : undefined,
    tpCompanyName: row.tpCompanyName != null ? String(row.tpCompanyName) : undefined,
    updatedAt: String(row.updatedAt),
    lastMessage: last
      ? {
          body: String(last.body),
          senderRole: String(last.senderRole) as ClientMessageSenderRole,
          sentAt: String(last.createdAt),
        }
      : null,
  };
}

export async function listClientConversationsForTp(tpOrgId: string) {
  const rows = await queryAll<Record<string, unknown>>(
    `SELECT c."id", c."clientId", c."tpOrgId", c."updatedAt",
            cl."companyName" AS "clientCompanyName", cl."contactName" AS "clientContactName"
     FROM "TpClientConversation" c
     JOIN "Client" cl ON cl."id" = c."clientId"
     WHERE c."tpOrgId" = ?
     ORDER BY c."updatedAt" DESC`,
    [tpOrgId],
  );
  return Promise.all(rows.map((row) => enrichClientConversationRow(row)));
}

export async function listClientConversationsForClient(clientId: string) {
  const rows = await queryAll<Record<string, unknown>>(
    `SELECT c."id", c."tpOrgId", c."updatedAt",
            o."companyName" AS "tpCompanyName"
     FROM "TpClientConversation" c
     JOIN "TpOrganization" o ON o."id" = c."tpOrgId"
     WHERE c."clientId" = ?
     ORDER BY c."updatedAt" DESC`,
    [clientId],
  );
  return Promise.all(rows.map((row) => enrichClientConversationRow(row)));
}

export async function getClientConversationMessages(conversationId: string) {
  return queryAll<Record<string, unknown>>(
    `SELECT "id", "senderRole", "body", "createdAt"
     FROM "TpClientMessage"
     WHERE "conversationId" = ?
     ORDER BY "createdAt" ASC`,
    [conversationId],
  );
}

export async function sendClientMessage(
  conversationId: string,
  senderRole: ClientMessageSenderRole,
  body: string,
) {
  const t = new Date().toISOString();
  const id = newId();
  await execute(
    `INSERT INTO "TpClientMessage" ("id","conversationId","senderRole","body","createdAt")
     VALUES (?,?,?,?,?)`,
    [id, conversationId, senderRole, body, t],
  );
  await execute(`UPDATE "TpClientConversation" SET "updatedAt" = ? WHERE "id" = ?`, [
    t,
    conversationId,
  ]);
  return { id, senderRole, body, sentAt: t };
}

export async function assertClientConversationForTp(conversationId: string, tpOrgId: string) {
  return queryOne<{ id: string; clientId: string }>(
    `SELECT "id", "clientId" FROM "TpClientConversation"
     WHERE "id" = ? AND "tpOrgId" = ?`,
    [conversationId, tpOrgId],
  );
}

export async function assertClientConversationForClient(
  conversationId: string,
  clientId: string,
) {
  return queryOne<{ id: string; tpOrgId: string }>(
    `SELECT "id", "tpOrgId" FROM "TpClientConversation"
     WHERE "id" = ? AND "clientId" = ?`,
    [conversationId, clientId],
  );
}
