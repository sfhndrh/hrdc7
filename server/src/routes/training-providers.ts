import { Router } from "express";

import { requireRoles } from "../auth.js";
import { getTrainingProviders } from "../lib/training-providers-store.js";
import { scrapeTrainingProviders } from "../services/scrape-training-providers.js";

export const trainingProvidersRouter = Router();

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
