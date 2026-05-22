import type { Response } from "express";

import { clearAuthCookie } from "../auth.js";
import { queryOne } from "../db/query.js";
import { ACCOUNT_SUSPENDED_CODE } from "./client-suspension.js";

export type TrainerSuspensionRow = {
  accountStatus: string | null;
  suspensionReason: string | null;
};

export function trainerAccountStatus(
  row: TrainerSuspensionRow | null | undefined,
): "ACTIVE" | "SUSPENDED" {
  return row?.accountStatus === "SUSPENDED" ? "SUSPENDED" : "ACTIVE";
}

/** If suspended, clears auth cookie and sends 403. Returns true when response was sent. */
export async function respondIfTrainerSuspended(
  userId: string,
  res: Response,
): Promise<boolean> {
  const row = await queryOne<TrainerSuspensionRow>(
    `SELECT "accountStatus", "suspensionReason" FROM "Trainer" WHERE "userId" = ?`,
    [userId],
  );
  if (trainerAccountStatus(row) !== "SUSPENDED") return false;

  clearAuthCookie(res);
  res.status(403).json({
    code: ACCOUNT_SUSPENDED_CODE,
    error: "Your trainer account has been suspended by an administrator.",
    suspensionReason: row?.suspensionReason?.trim() ?? "",
  });
  return true;
}
