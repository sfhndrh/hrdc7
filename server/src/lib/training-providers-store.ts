import fs from "node:fs/promises";

import {
  computeProvidersStats,
  TRAINING_PROVIDERS_JSON_PATH,
  type ProvidersData,
  type TrainingProvider,
} from "./training-providers.js";
import {
  countTrainingProviders,
  getTrainingProvidersFromDb,
  saveTrainingProvidersToDb,
  upsertTrainingProvidersInDb,
} from "./training-providers-db.js";

export async function getTrainingProviders(): Promise<ProvidersData | null> {
  return getTrainingProvidersFromDb();
}

export async function saveTrainingProviders(data: ProvidersData): Promise<void> {
  await saveTrainingProvidersToDb(data);
}

export async function upsertTrainingProviders(
  providers: TrainingProvider[],
  options?: { model?: string; scrapedAt?: string },
): Promise<void> {
  await upsertTrainingProvidersInDb(providers, options);
}

async function readTrainingProvidersJson(): Promise<ProvidersData | null> {
  try {
    const raw = await fs.readFile(TRAINING_PROVIDERS_JSON_PATH, "utf8");
    const parsed = JSON.parse(raw) as ProvidersData;
    if (!Array.isArray(parsed.providers)) return null;
    return {
      scrapedAt: parsed.scrapedAt ?? new Date().toISOString(),
      model: parsed.model ?? "",
      stats: parsed.stats ?? computeProvidersStats(parsed.providers),
      providers: parsed.providers,
    };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

/** If the database is empty, import from data/training-providers.json when present. */
export async function ensureTrainingProvidersInDb(): Promise<void> {
  const count = await countTrainingProviders();
  if (count > 0) return;

  const fromJson = await readTrainingProvidersJson();
  if (!fromJson) {
    console.log(
      "[info] No training providers in database. Run npm run db:scrape-providers then import CSV.",
    );
    return;
  }

  await saveTrainingProvidersToDb(fromJson);
  console.log(
    `[info] Imported ${fromJson.providers.length} training providers from JSON into database.`,
  );
}
