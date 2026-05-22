import type { TrainingProvider } from "./training-providers.js";
import {
  mergeTrainingProviderRows,
  trainingProviderMergeKey,
} from "./training-provider-keys.js";

export { trainingProviderMergeKey } from "./training-provider-keys.js";

export function mergeTrainingProviderLists(
  existing: TrainingProvider[],
  incoming: TrainingProvider[],
): { providers: TrainingProvider[]; inserted: number; updated: number } {
  const byKey = new Map<string, TrainingProvider>();
  for (const p of existing) {
    byKey.set(trainingProviderMergeKey(p), p);
  }

  let inserted = 0;
  let updated = 0;

  for (const row of incoming) {
    const key = trainingProviderMergeKey(row);
    const prev = byKey.get(key);
    if (prev) {
      byKey.set(key, mergeTrainingProviderRows(prev, row));
      updated += 1;
    } else {
      byKey.set(key, row);
      inserted += 1;
    }
  }

  const providers = [...byKey.values()].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
  );
  return { providers, inserted, updated };
}
