import fs from "node:fs";
import path from "node:path";

import type { ProvidersData, TrainingProvider } from "./training-providers.js";
import { computeProvidersStats } from "./training-providers.js";
import { TRAINING_PROVIDERS_CSV_PATH } from "./training-providers.js";

function csvCell(value: string | number | boolean): string {
  const s = String(value ?? "");
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function csvRow(values: Array<string | number | boolean>): string {
  return values.map(csvCell).join(",");
}

export type CsvWriteResult = {
  providersPath: string;
  providerRows: number;
};

export function providerDedupeKey(p: TrainingProvider): string {
  return p.name.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Keep all existing rows unchanged; append providers from `incoming` whose key is not present.
 */
export function appendMissingProviders(
  existing: TrainingProvider[],
  incoming: TrainingProvider[],
): { providers: TrainingProvider[]; added: TrainingProvider[]; addedCount: number } {
  const seen = new Set(existing.map(providerDedupeKey));
  const added: TrainingProvider[] = [];
  for (const p of incoming) {
    if (!p.name.trim()) continue;
    const key = providerDedupeKey(p);
    if (seen.has(key)) continue;
    seen.add(key);
    added.push(p);
  }
  return {
    providers: [...existing, ...added],
    added,
    addedCount: added.length,
  };
}

function providerRichness(p: TrainingProvider): number {
  return (
    (p.email.trim() ? 4 : 0) +
    (p.phone.trim() ? 4 : 0) +
    (p.address.trim() ? 2 : 0)
  );
}

function mergeProviders(keep: TrainingProvider, other: TrainingProvider): TrainingProvider {
  const preferOther = providerRichness(other) > providerRichness(keep);
  const a = preferOther ? other : keep;
  const b = preferOther ? keep : other;
  return {
    ...a,
    name: a.name || b.name,
    email: a.email.trim() || b.email.trim(),
    phone: a.phone.trim() || b.phone.trim(),
    address: a.address.trim() || b.address.trim(),
  };
}

/** Remove duplicate providers (by name), keeping the richest contact row. */
export function dedupeTrainingProviders(
  providers: TrainingProvider[],
): { providers: TrainingProvider[]; removed: number } {
  const byKey = new Map<string, TrainingProvider>();
  for (const p of providers) {
    if (!p.name.trim()) continue;
    const key = providerDedupeKey(p);
    const prev = byKey.get(key);
    byKey.set(key, prev ? mergeProviders(prev, p) : p);
  }
  const deduped = [...byKey.values()];
  return { providers: deduped, removed: providers.length - deduped.length };
}

export function writeTrainingProvidersCsv(
  data: ProvidersData,
  options?: {
    providersPath?: string;
    skipDedupe?: boolean;
  },
): CsvWriteResult {
  let providers = data.providers;
  let removed = 0;
  if (!options?.skipDedupe) {
    const deduped = dedupeTrainingProviders(providers);
    providers = deduped.providers;
    removed = deduped.removed;
    if (removed > 0) {
      console.log(`[csv] Deduplicated ${removed} provider row(s) before write.`);
    }
  }
  const payload: ProvidersData = { ...data, providers, stats: computeProvidersStats(providers) };

  const providersPath = path.resolve(
    options?.providersPath ?? TRAINING_PROVIDERS_CSV_PATH,
  );

  fs.mkdirSync(path.dirname(providersPath), { recursive: true });

  const providerHeader = ["provider", "email", "telephone", "address"];

  const providerLines = [csvRow(providerHeader)];
  for (const p of payload.providers) {
    providerLines.push(
      csvRow([p.name, p.email, p.phone, p.address]),
    );
  }

  fs.writeFileSync(providersPath, providerLines.join("\n"), "utf8");

  return {
    providersPath,
    providerRows: payload.providers.length,
  };
}
