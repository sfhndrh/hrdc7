/**
 * API base URL for production (Vercel → Railway). In dev, leave VITE_API_URL unset
 * so requests use relative /api paths and Vite's proxy.
 */
export function getApiBase(): string {
  const base = import.meta.env.VITE_API_URL?.trim() ?? "";
  return base.replace(/\/$/, "");
}

/** Resolve /api/... to full URL when VITE_API_URL is set. */
export function apiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const base = getApiBase();
  return base ? `${base}${normalized}` : normalized;
}

/** Prefix API-relative asset paths (/api/uploads/...) for production img/href. */
export function apiAssetUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith("/")) return apiUrl(path);
  return path;
}

/** fetch wrapper: credentials for JWT cookies, optional production API host. */
export function apiFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  return fetch(apiUrl(path), {
    credentials: "include",
    ...init,
  });
}
