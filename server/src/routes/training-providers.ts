import path from "node:path";
import { Router } from "express";
import multer, { MulterError } from "multer";

import { requireRoles } from "../auth.js";
import { serperConfigured } from "../config/serper.js";
import { parseTrainingProvidersCsvBuffer } from "../lib/training-providers-csv-parse.js";
import {
  dedupeTrainingProviderList,
  trainingProviderLookupKey,
} from "../lib/training-provider-keys.js";
import {
  computeProvidersStats,
  type TrainingProvider,
} from "../lib/training-providers.js";
import {
  getTrainingProviders,
  saveTrainingProviders,
} from "../lib/training-providers-store.js";
import {
  importCsvProvidersAndMaybeScrape,
  scrapeAllDirectoryCourses,
} from "../services/scrape-tp-courses-serper.js";
import { scrapeTrainingProviders } from "../services/scrape-training-providers.js";

function findHrdcProvider(
  providers: TrainingProvider[],
  lookupKey: string,
): TrainingProvider | undefined {
  const key = decodeURIComponent(lookupKey).trim();
  return providers.find((p) => trainingProviderLookupKey(p) === key);
}

const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === ".csv" || file.mimetype === "text/csv" || file.mimetype === "application/vnd.ms-excel") {
      cb(null, true);
      return;
    }
    cb(new Error("Upload a CSV file (.csv)."));
  },
});

export const trainingProvidersRouter = Router();

trainingProvidersRouter.get(
  "/admin/training-providers/hrdc/:lookupKey",
  requireRoles(["ADMIN"]),
  async (req, res) => {
    const data = await getTrainingProviders();
    if (!data) {
      res.status(404).json({ error: "Provider not found" });
      return;
    }
    const provider = findHrdcProvider(data.providers, req.params.lookupKey);
    if (!provider) {
      res.status(404).json({ error: "Provider not found" });
      return;
    }
    res.json({ provider });
  },
);

trainingProvidersRouter.get(
  "/admin/training-providers",
  requireRoles(["ADMIN"]),
  async (_req, res) => {
    const data = await getTrainingProviders();
    if (!data) {
      res.status(404).json({ error: "No provider data yet" });
      return;
    }
    res.json(data);
  },
);

trainingProvidersRouter.post(
  "/admin/training-providers/import-csv",
  requireRoles(["ADMIN"]),
  (req, res, next) => {
    csvUpload.single("file")(req, res, (err: unknown) => {
      if (err instanceof MulterError) {
        res.status(400).json({ error: err.message });
        return;
      }
      if (err) {
        res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
        return;
      }
      next();
    });
  },
  async (req, res) => {
    const file = req.file;
    if (!file?.buffer?.length) {
      res.status(400).json({ error: "CSV file is required (field name: file)." });
      return;
    }

    const scrapeCourses =
      req.body?.scrapeCourses === true ||
      req.body?.scrapeCourses === "true" ||
      req.body?.scrapeCourses === "1";

    if (scrapeCourses && !serperConfigured()) {
      res.status(500).json({ error: "SERPER_API_KEY is not configured" });
      return;
    }

    const providers = parseTrainingProvidersCsvBuffer(file.buffer);
    if (providers.length === 0) {
      res.status(400).json({
        error:
          "No providers found in CSV. Expected columns: name (or tp name), email, phone, website.",
      });
      return;
    }

    const maxScrape = Number.parseInt(String(req.body?.maxScrapeProviders ?? ""), 10);
    const maxScrapeProviders = Number.isFinite(maxScrape) && maxScrape > 0 ? maxScrape : undefined;

    req.socket.setTimeout(0);

    try {
      const result = await importCsvProvidersAndMaybeScrape({
        providers,
        scrapeCourses,
        maxScrapeProviders,
        onProgress: (msg) => console.log(`[import-csv] ${msg}`),
      });

      res.json({
        success: true,
        imported: providers.length,
        merge: result.merge,
        scrape: result.scrape,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[import-csv]", message);
      res.status(500).json({ error: message });
    }
  },
);

trainingProvidersRouter.post(
  "/admin/training-providers/dedupe",
  requireRoles(["ADMIN"]),
  async (_req, res) => {
    const data = await getTrainingProviders();
    if (!data?.providers.length) {
      res.status(404).json({ error: "No training providers in database." });
      return;
    }
    const before = data.providers.length;
    const { providers, removed } = dedupeTrainingProviderList(data.providers);
    if (removed === 0) {
      res.json({ success: true, before, after: before, removed: 0 });
      return;
    }
    await saveTrainingProviders({
      ...data,
      scrapedAt: new Date().toISOString(),
      stats: computeProvidersStats(providers),
      providers,
    });
    res.json({ success: true, before, after: providers.length, removed });
  },
);

trainingProvidersRouter.post(
  "/admin/training-providers/scrape-courses",
  requireRoles(["ADMIN"]),
  async (req, res) => {
    if (!serperConfigured()) {
      res.status(500).json({ error: "SERPER_API_KEY is not configured" });
      return;
    }

    const body = (req.body ?? {}) as { maxProviders?: number };
    const maxProviders =
      typeof body.maxProviders === "number" && body.maxProviders > 0
        ? body.maxProviders
        : undefined;

    req.socket.setTimeout(0);

    try {
      const result = await scrapeAllDirectoryCourses({
        maxProviders,
        onProgress: (msg) => console.log(`[scrape-courses] ${msg}`),
      });

      res.json({
        success: true,
        stats: result.stats,
        merge: result.merge,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[scrape-courses]", message);
      res.status(500).json({ error: message });
    }
  },
);

trainingProvidersRouter.post(
  "/admin/scrape-training-providers",
  requireRoles(["ADMIN"]),
  async (req, res) => {
    if (!process.env.DASHSCOPE_API_KEY?.trim()) {
      res.status(500).json({ error: "DASHSCOPE_API_KEY is not configured" });
      return;
    }

    const body = (req.body ?? {}) as {
      maxPages?: number;
      maxProviders?: number;
      recordsPerPage?: number;
    };

    const maxPages =
      typeof body.maxPages === "number"
        ? body.maxPages
        : Number.parseInt(process.env.SCRAPE_MAX_PAGES ?? "0", 10) || 0;
    const maxProviders =
      typeof body.maxProviders === "number"
        ? body.maxProviders
        : Number.parseInt(process.env.SCRAPE_MAX_PROVIDERS ?? "0", 10) || 0;
    const recordsPerPage =
      typeof body.recordsPerPage === "number" ? body.recordsPerPage : 100;

    req.socket.setTimeout(0);

    try {
      const result = await scrapeTrainingProviders({
        maxPages,
        maxProviders,
        recordsPerPage,
      });

      res.json({
        success: true,
        count: result.count,
        stats: {
          ...result.stats,
          saved: result.data.stats,
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[scrape-training-providers]", message);
      res.status(500).json({ error: message });
    }
  },
);
