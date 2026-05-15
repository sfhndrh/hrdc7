/** Normalize Prisma Json fields that store string arrays (MySQL). */
export function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((x) => String(x));
  return [];
}
