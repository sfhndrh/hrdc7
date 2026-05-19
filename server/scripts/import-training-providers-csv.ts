/**
 * Import training providers from CSV (written by db:scrape-providers) into PostgreSQL.
 * Run: npm run db:import-providers-csv
 */
import "../src/load-env.js";

import { closeDb, initDb } from "../src/db/connection.js";
import { readTrainingProvidersFromCsv } from "../src/lib/training-providers-csv-read.js";
import { computeProvidersStats } from "../src/lib/training-providers.js";
import { saveTrainingProviders } from "../src/lib/training-providers-store.js";
import { qwenModel } from "../src/services/qwen-json.js";

async function main() {
  await initDb();

  console.log("Reading CSV files…");
  const { providers, scrapedAt } = readTrainingProvidersFromCsv();

  if (providers.length === 0) {
    console.error("No providers found. Run npm run db:scrape-providers first.");
    process.exit(1);
  }

  await saveTrainingProviders({
    scrapedAt,
    model: qwenModel(),
    stats: computeProvidersStats(providers),
    providers,
  });

  console.log(`Imported ${providers.length} providers into the database.`);
  await closeDb();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
