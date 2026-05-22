import fs from "node:fs";

import type { TrainingProvider } from "./training-providers.js";
import { TRAINING_PROVIDERS_CSV_PATH } from "./training-providers.js";

/** Parse a single CSV line (handles quoted fields). */
export function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]!;
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function readCsvTable(filePath: string): { header: string[]; rows: string[][] } {
  const raw = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) {
    return { header: [], rows: [] };
  }
  const header = parseCsvLine(lines[0]!);
  const rows = lines.slice(1).map(parseCsvLine);
  return { header, rows };
}

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, " ");
}

function rowToMap(header: string[], row: string[]): Record<string, string> {
  const m: Record<string, string> = {};
  for (let i = 0; i < header.length; i += 1) {
    m[normalizeHeader(header[i] ?? "")] = row[i] ?? "";
  }
  return m;
}

function pickField(m: Record<string, string>, ...keys: string[]): string {
  for (const k of keys) {
    const v = m[k]?.trim();
    if (v) return v;
  }
  return "";
}

function emptyProvider(name: string, scrapedAt: string): TrainingProvider {
  return {
    name,
    registrationNo: "",
    status: "",
    email: "",
    phone: "",
    fax: "",
    website: "",
    address: "",
    state: "",
    description: "",
    courses: [],
    detailUrl: "",
    scrapedAt,
  };
}

export function readTrainingProvidersFromCsv(options?: {
  providersPath?: string;
}): { providers: TrainingProvider[]; scrapedAt: string } {
  const providersPath = options?.providersPath ?? TRAINING_PROVIDERS_CSV_PATH;
  const { header: pHeader, rows: pRows } = readCsvTable(providersPath);

  const scrapedAt = new Date().toISOString();
  const providers: TrainingProvider[] = [];

  for (const row of pRows) {
    const m = rowToMap(pHeader, row);
    const name = pickField(
      m,
      "tp name",
      "provider",
      "provider name",
      "name",
      "company name",
    );
    if (!name) continue;
    providers.push({
      ...emptyProvider(name, scrapedAt),
      email: pickField(m, "email"),
      phone: pickField(m, "telephone", "phone"),
      website: pickField(m, "website", "web", "url"),
      address: pickField(m, "address"),
    });
  }

  return { providers, scrapedAt };
}
