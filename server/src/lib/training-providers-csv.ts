import fs from "node:fs";
import path from "node:path";

import type { ProvidersData, TrainingProvider } from "./training-providers.js";
import { computeProvidersStats } from "./training-providers.js";
import { TRAINING_PROVIDERS_CSV_PATH } from "./training-providers.js";
import {
  dedupeTrainingProviderList,
  providerDedupeKey,
} from "./training-provider-keys.js";

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

export { providerDedupeKey } from "./training-provider-keys.js";

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

/** Remove duplicate providers (by name or registration no), keeping the richest row. */
export function dedupeTrainingProviders(
  providers: TrainingProvider[],
): { providers: TrainingProvider[]; removed: number } {
  return dedupeTrainingProviderList(providers);
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
