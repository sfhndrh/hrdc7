/**
 * HRDC training provider scrape → CSV export.
 * Run: npm run db:scrape-providers
 *
 * If data/training-providers.csv already exists, new rows are appended only
 * (set SCRAPE_REPLACE=1 to overwrite). Columns: provider, email, telephone, address.
 */
import fs from "node:fs";

import "../src/load-env.js";

import {
  appendMissingProviders,
  writeTrainingProvidersCsv,
} from "../src/lib/training-providers-csv.js";
import { readTrainingProvidersFromCsv } from "../src/lib/training-providers-csv-read.js";
import { TRAINING_PROVIDERS_CSV_PATH } from "../src/lib/training-providers.js";
import { scrapeTrainingProviders } from "../src/services/scrape-training-providers.js";
import { qwenModel } from "../src/services/qwen-json.js";
import { computeProvidersStats } from "../src/lib/training-providers.js";

function envFlag(name: string): boolean {
  const v = process.env[name]?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

async function main() {
  if (!process.env.DASHSCOPE_API_KEY?.trim()) {
    console.error("ERROR: Set DASHSCOPE_API_KEY in server/.env");
    process.exit(1);
  }

  const replace = envFlag("SCRAPE_REPLACE");
  const csvExists = fs.existsSync(TRAINING_PROVIDERS_CSV_PATH);
  const mergeExisting = !replace && csvExists;

  console.log("Starting HRDC training provider scrape (export to CSV)…\n");
  console.log(`Output: ${TRAINING_PROVIDERS_CSV_PATH}\n`);

  if (mergeExisting) {
    console.log(
      "Mode: MERGE — keeping your current CSV and appending providers not already present.",
    );
    console.log("      Set SCRAPE_REPLACE=1 in server/.env to replace the file entirely.\n");
  } else if (replace) {
    console.log("Mode: REPLACE — overwriting existing CSV.\n");
  }

  console.log(
    "Scrape: listing table only (provider, email, telephone, address).\n",
  );

  let existingProviders: Awaited<
    ReturnType<typeof readTrainingProvidersFromCsv>
  >["providers"] = [];
  if (mergeExisting) {
    const existing = readTrainingProvidersFromCsv();
    existingProviders = existing.providers;
    console.log(`Existing CSV: ${existingProviders.length} provider row(s).\n`);
  }

  const result = await scrapeTrainingProviders({
    persistToDatabase: false,
    skipDetailPages: true,
    skipWebsiteEnrichment: true,
    onProgress: (msg) => console.log(msg),
  });

  let finalProviders = result.data.providers;
  let addedCount = finalProviders.length;

  if (mergeExisting) {
    const merged = appendMissingProviders(existingProviders, result.data.providers);
    finalProviders = merged.providers;
    addedCount = merged.addedCount;
    console.log(
      `\nMerge: kept ${existingProviders.length} existing, added ${addedCount} new provider row(s).`,
    );
    if (addedCount === 0) {
      console.log("No new providers found on HRDC vs your CSV (keys: registration no, else name).");
    }
  }

  const written = writeTrainingProvidersCsv(
    {
      scrapedAt: new Date().toISOString(),
      model: qwenModel(),
      stats: computeProvidersStats(finalProviders),
      providers: finalProviders,
    },
    { skipDedupe: mergeExisting },
  );

  console.log("\n=== Done ===");
  console.log(`Providers: ${written.providerRows} rows → ${written.providersPath}`);
  if (mergeExisting) {
    console.log(`New rows appended this run: ${addedCount}`);
  }
  console.log(`Listing pages: ${result.stats.listingPagesFetched}`);
  console.log(`Qwen calls: ${result.stats.qwenCalls}`);
  if (result.stats.errors.length) {
    console.log(`Errors (${result.stats.errors.length}):`);
    for (const e of result.stats.errors.slice(0, 20)) console.log(`  - ${e}`);
    if (result.stats.errors.length > 20) {
      console.log(`  … and ${result.stats.errors.length - 20} more`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
