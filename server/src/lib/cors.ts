import type { CorsOptions } from "cors";

import { getClientUrl, getExtraCorsOrigins, isProduction } from "../config/env.js";

const DEV_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
  "https://hrdc7.onrender.com",
];

export function buildCorsOptions(): CorsOptions {
  const allowed = new Set<string>([
    ...DEV_ORIGINS,
    getClientUrl(),
    ...getExtraCorsOrigins(),
  ]);

  return {
    origin(origin, callback) {
      // Same-origin or non-browser clients (curl, server-side)
      if (!origin) {
        callback(null, true);
        return;
      }
      if (allowed.has(origin)) {
        callback(null, true);
        return;
      }
      if (!isProduction) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
  };
}
