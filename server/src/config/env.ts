/**
 * Centralized environment configuration for local dev and production (Railway).
 */

function required(name: string, value: string | undefined): string {
  const v = value?.trim();
  if (!v) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return v;
}

export const isProduction = process.env.NODE_ENV === "production";

export function getClientUrl(): string {
  return (
    process.env.CLIENT_URL?.trim() ||
    process.env.CLIENT_ORIGIN?.trim() ||
    "http://localhost:5173"
  );
}

/** Dev-only extra origins (comma-separated), e.g. http://127.0.0.1:5173 */
export function getExtraCorsOrigins(): string[] {
  const raw = process.env.CORS_ORIGINS?.trim();
  if (!raw) return [];
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

export function getJwtSecret(): string {
  if (isProduction) {
    return required(
      "JWT_SECRET",
      process.env.JWT_SECRET ?? process.env.NEXTAUTH_SECRET,
    );
  }
  return (
    process.env.JWT_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    "dev-secret-change-me"
  );
}

export function getDatabaseUrl(): string {
  if (isProduction) {
    return required("DATABASE_URL", process.env.DATABASE_URL);
  }
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error(
      "DATABASE_URL is required (Railway PostgreSQL connection string or Supabase URI)",
    );
  }
  return url;
}

/**
 * Base URL for server-initiated HTTP calls (e.g. background verify).
 * On Railway set to your public API URL, e.g. https://your-app.up.railway.app
 */
export function getApiBaseUrl(): string {
  const explicit = process.env.API_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  const port = Number(process.env.PORT ?? 4000);
  return `http://127.0.0.1:${port}`;
}

export function getUploadRoot(): string {
  return process.env.UPLOAD_DIR?.trim() || "uploads";
}

export function validateProductionEnv(): void {
  if (!isProduction) return;
  getJwtSecret();
  getDatabaseUrl();
  getClientUrl();
  if (!process.env.CLIENT_URL?.trim() && !process.env.CLIENT_ORIGIN?.trim()) {
    console.warn(
      "[warn] Set CLIENT_URL to your Vercel frontend URL (e.g. https://app.vercel.app) for CORS and cookies.",
    );
  }
}
