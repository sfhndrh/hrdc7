import "../src/load-env.js";

import { dedupeTrainingProviderList } from "../src/lib/training-provider-keys.js";
import { computeProvidersStats } from "../src/lib/training-providers.js";
import {
  getTrainingProviders,
  saveTrainingProviders,
} from "../src/lib/training-providers-store.js";

async function main() {
  const data = await getTrainingProviders();
  if (!data?.providers.length) {
    console.log("No training providers in database.");
    return;
  }
  const before = data.providers.length;
  const { providers, removed } = dedupeTrainingProviderList(data.providers);
  if (removed === 0) {
    console.log(`No duplicates found (${before} providers).`);
    return;
  }
  await saveTrainingProviders({
    ...data,
    scrapedAt: new Date().toISOString(),
    stats: computeProvidersStats(providers),
    providers,
  });
  console.log(`Removed ${removed} duplicate(s): ${before} → ${providers.length} providers.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
