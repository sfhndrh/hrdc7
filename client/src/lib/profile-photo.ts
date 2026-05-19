/** Normalize stored profile photo paths for display (or null when absent). */
export function normalizeProfilePhotoUrl(
  value: string | null | undefined,
): string | null {
  if (value == null) return null;
  const trimmed = String(value).trim();
  if (!trimmed || trimmed === "null" || trimmed === "pending-upload") return null;
  return trimmed;
}
