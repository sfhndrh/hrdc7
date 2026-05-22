import type { TrainingProvider } from "@/lib/training-providers";

/** Stable key for admin HRDC provider detail URLs. */
export function hrdcProviderLookupKey(provider: TrainingProvider): string {
  const reg = provider.registrationNo?.trim();
  if (reg) return reg;
  return `${provider.name.trim()}::${provider.email.trim()}`;
}

export function adminHrdcProviderDetailPath(provider: TrainingProvider): string {
  return `/admin/training-providers/hrdc/${encodeURIComponent(hrdcProviderLookupKey(provider))}`;
}
