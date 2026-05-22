import type { TrainingCourse, TrainingProvider } from "./training-providers.js";

export function normalizeProviderName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Dedupe / merge key when registration number is absent. */
export function providerDedupeKey(p: TrainingProvider): string {
  return normalizeProviderName(p.name);
}

export function trainingProviderMergeKey(p: TrainingProvider): string {
  const reg = p.registrationNo.trim();
  if (reg) return `reg:${reg.toLowerCase()}`;
  return `name:${providerDedupeKey(p)}`;
}

/** Stable admin detail URL segment (must match server lookup). */
export function trainingProviderLookupKey(p: TrainingProvider): string {
  const reg = p.registrationNo?.trim();
  if (reg) return reg;
  return providerDedupeKey(p);
}

function dedupeCoursesByTitle(courses: TrainingCourse[]): TrainingCourse[] {
  const seen = new Set<string>();
  const out: TrainingCourse[] = [];
  for (const c of courses) {
    const title = c.title.trim();
    if (!title) continue;
    const key = title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
  }
  return out;
}

function providerRichness(p: TrainingProvider): number {
  return (
    p.courses.length * 2 +
    (p.website.trim() ? 3 : 0) +
    (p.email.trim() ? 4 : 0) +
    (p.phone.trim() ? 4 : 0) +
    (p.address.trim() ? 2 : 0)
  );
}

/** Merge two provider rows into one (richest contact + combined courses). */
export function mergeTrainingProviderRows(
  keep: TrainingProvider,
  other: TrainingProvider,
): TrainingProvider {
  const preferOther = providerRichness(other) > providerRichness(keep);
  const a = preferOther ? other : keep;
  const b = preferOther ? keep : other;
  return {
    ...a,
    name: a.name || b.name,
    registrationNo: a.registrationNo || b.registrationNo,
    email: a.email.trim() || b.email.trim(),
    phone: a.phone.trim() || b.phone.trim(),
    website: a.website.trim() || b.website.trim(),
    address: a.address.trim() || b.address.trim(),
    fax: a.fax.trim() || b.fax.trim(),
    state: a.state.trim() || b.state.trim(),
    status: a.status || b.status,
    description: a.description || b.description,
    detailUrl: a.detailUrl || b.detailUrl,
    courses: dedupeCoursesByTitle([...a.courses, ...b.courses]),
    scrapedAt: a.scrapedAt || b.scrapedAt,
  };
}

export function dedupeTrainingProviderList(
  providers: TrainingProvider[],
): { providers: TrainingProvider[]; removed: number } {
  const byKey = new Map<string, TrainingProvider>();
  for (const p of providers) {
    if (!p.name.trim()) continue;
    const reg = p.registrationNo.trim();
    const key = reg ? `reg:${reg.toLowerCase()}` : `name:${providerDedupeKey(p)}`;
    const prev = byKey.get(key);
    byKey.set(key, prev ? mergeTrainingProviderRows(prev, p) : p);
  }
  const deduped = [...byKey.values()];
  return { providers: deduped, removed: providers.length - deduped.length };
}
