import type { TrainingProvider } from "@/lib/training-providers";

function normalizeProviderName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Stable key for admin HRDC provider detail URLs (matches server). */
export function hrdcProviderLookupKey(provider: TrainingProvider): string {
  const reg = provider.registrationNo?.trim();
  if (reg) return reg;
  return normalizeProviderName(provider.name);
}

export function adminHrdcProviderDetailPath(provider: TrainingProvider): string {
  return `/admin/training-providers/hrdc/${encodeURIComponent(hrdcProviderLookupKey(provider))}`;
}
