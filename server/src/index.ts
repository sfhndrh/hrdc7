import "./load-env.js";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";

import { getClientUrl, isProduction, validateProductionEnv } from "./config/env.js";
import { initDb } from "./db/connection.js";
import { ensureTrainingProvidersInDb } from "./lib/training-providers-store.js";
import { buildCorsOptions } from "./lib/cors.js";
import { ensureUploadDirs } from "./lib/uploads.js";
import { restRouter } from "./routes/rest.js";
import { tpPlatformRouter } from "./routes/tp-platform.js";
import { trainingProvidersRouter } from "./routes/training-providers.js";
import verifyRouter from "./routes/verify.js";

function warnIfGhostscriptMissing() {
  const candidates =
    process.platform === "win32" ? ["gswin64c", "gswin32c", "gs"] : ["gs"];

  const found = candidates.some((cmd) => {
    const res = spawnSync(cmd, ["--version"], { stdio: "ignore" });
    return !res.error && res.status === 0;
  });

  if (!found) {
    console.warn(
      "[warn] Ghostscript not detected. PDF certificate conversion (pdf2pic) may fail.",
    );
    console.warn(
      "[warn] Railway: add server/nixpacks.toml (aptPkgs: ghostscript). Upload PNG/JPEG certs as a workaround.",
    );
  }
}

async function main() {
  validateProductionEnv();
  ensureUploadDirs();
  await initDb();
  await ensureTrainingProvidersInDb();
  warnIfGhostscriptMissing();

  const app = express();
  const clientUrl = getClientUrl();

  if (isProduction) {
    app.set("trust proxy", 1);
  }

  app.use(cors(buildCorsOptions()));
  app.use(express.json({ limit: "2mb" }));
  app.use(cookieParser());
  app.use("/api", restRouter);
  app.use("/api", tpPlatformRouter);
  app.use("/api", trainingProvidersRouter);
  app.use("/api/trainer", verifyRouter);

  // Optional: serve built client when API and UI share one host (not used for Vercel split).
  const clientDist = path.resolve(process.cwd(), "../client/dist");
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api")) {
        next();
        return;
      }
      res.sendFile(path.join(clientDist, "index.html"));
    });
  } else if (!isProduction) {
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api")) {
        next();
        return;
      }
      const target = new URL(req.originalUrl || "/", clientUrl).toString();
      res.redirect(302, target);
    });
  }

  const port = Number(process.env.PORT ?? 4000);
  app.listen(port, "0.0.0.0", () => {
    console.log(
      `API listening on port ${port} (${isProduction ? "production" : "development"})`,
    );
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
