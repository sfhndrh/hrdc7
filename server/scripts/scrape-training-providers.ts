/**
 * One-time (or periodic) HRDC training provider scrape into PostgreSQL.
 * Run: npm run db:scrape-providers
 */
import "dotenv/config";

import { closeDb, initDb } from "../src/db/connection.js";
import { scrapeTrainingProviders } from "../src/services/scrape-training-providers.js";

async function main() {
  if (!process.env.DASHSCOPE_API_KEY?.trim()) {
    console.error("ERROR: Set DASHSCOPE_API_KEY in server/.env");
    process.exit(1);
  }

  await initDb();

  console.log("Starting HRDC training provider scrape (saved to database)…\n");

  const result = await scrapeTrainingProviders({
    onProgress: (msg) => console.log(msg),
  });

  console.log("\n=== Done ===");
  console.log(`Providers saved: ${result.count}`);
  console.log(`Listing pages: ${result.stats.listingPagesFetched}`);
  console.log(`Qwen calls: ${result.stats.qwenCalls}`);
  if (result.stats.errors.length) {
    console.log(`Errors (${result.stats.errors.length}):`);
    for (const e of result.stats.errors.slice(0, 20)) console.log(`  - ${e}`);
    if (result.stats.errors.length > 20) {
      console.log(`  … and ${result.stats.errors.length - 20} more`);
    }
  }

  await closeDb();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
