import type { Response } from "express";

import { clearAuthCookie } from "../auth.js";
import { queryOne } from "../db/query.js";

export const ACCOUNT_SUSPENDED_CODE = "ACCOUNT_SUSPENDED";

export type ClientSuspensionRow = {
  accountStatus: string | null;
  suspensionReason: string | null;
};

export function clientAccountStatus(
  row: ClientSuspensionRow | null | undefined,
): "ACTIVE" | "SUSPENDED" {
  return row?.accountStatus === "SUSPENDED" ? "SUSPENDED" : "ACTIVE";
}

/** If suspended, clears auth cookie and sends 403. Returns true when response was sent. */
export async function respondIfClientSuspended(
  userId: string,
  res: Response,
): Promise<boolean> {
  const row = await queryOne<ClientSuspensionRow>(
    `SELECT "accountStatus", "suspensionReason" FROM "Client" WHERE "userId" = ?`,
    [userId],
  );
  if (clientAccountStatus(row) !== "SUSPENDED") return false;

  clearAuthCookie(res);
  res.status(403).json({
    code: ACCOUNT_SUSPENDED_CODE,
    error: "Your employer account has been suspended by an administrator.",
    suspensionReason: row?.suspensionReason?.trim() ?? "",
  });
  return true;
}
