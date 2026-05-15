/** Consistent with subscription detail `requestedAtLabel` (en-MY). */
export function formatAdminTableDate(d: Date): string {
  return d.toLocaleString("en-MY", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
