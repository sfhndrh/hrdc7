/**
 * Deduplicate existing CSV files (no re-scrape).
 * Run: npm run db:dedupe-providers-csv
 */
import "../src/load-env.js";

import {
  dedupeTrainingProviders,
  writeTrainingProvidersCsv,
} from "../src/lib/training-providers-csv.js";
import { readTrainingProvidersFromCsv } from "../src/lib/training-providers-csv-read.js";
import { computeProvidersStats } from "../src/lib/training-providers.js";
import { qwenModel } from "../src/services/qwen-json.js";

async function main() {
  console.log("Reading CSV…");
  const { providers, scrapedAt } = readTrainingProvidersFromCsv();
  const before = providers.length;
  const { providers: deduped, removed } = dedupeTrainingProviders(providers);

  const written = writeTrainingProvidersCsv({
    scrapedAt,
    model: qwenModel(),
    stats: computeProvidersStats(deduped),
    providers: deduped,
  });

  console.log(`\nBefore: ${before} provider rows`);
  console.log(`After:  ${deduped.length} provider rows (removed ${removed} duplicates)`);
  console.log(`Wrote ${written.providersPath} (provider, email, telephone, address)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
