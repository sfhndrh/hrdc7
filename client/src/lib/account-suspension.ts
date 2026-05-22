export const ACCOUNT_SUSPENDED_CODE = "ACCOUNT_SUSPENDED";

export type AccountSuspendedPayload = {
  code: typeof ACCOUNT_SUSPENDED_CODE;
  error: string;
  suspensionReason: string;
};

export function isAccountSuspendedPayload(
  value: unknown,
): value is AccountSuspendedPayload {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return v.code === ACCOUNT_SUSPENDED_CODE;
}

export async function parseAccountSuspendedResponse(
  res: Response,
): Promise<AccountSuspendedPayload | null> {
  if (res.status !== 403) return null;
  const body = (await res.json().catch(() => null)) as unknown;
  if (!isAccountSuspendedPayload(body)) return null;
  return {
    code: ACCOUNT_SUSPENDED_CODE,
    error:
      typeof body.error === "string"
        ? body.error
        : "Your employer account has been suspended by an administrator.",
    suspensionReason:
      typeof body.suspensionReason === "string" ? body.suspensionReason : "",
  };
}
