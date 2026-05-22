import type { TrainingProvider } from "./training-providers.js";
import { parseCsvLine } from "./training-providers-csv-read.js";

function rowToMap(header: string[], row: string[]): Record<string, string> {
  const m: Record<string, string> = {};
  for (let i = 0; i < header.length; i += 1) {
    m[normalizeHeader(header[i] ?? "")] = row[i] ?? "";
  }
  return m;
}

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, " ");
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

/** Parse CSV text with columns: name, email, phone, website (flexible header names). */
export function parseTrainingProvidersCsvText(csvText: string): TrainingProvider[] {
  const raw = csvText.replace(/^\uFEFF/, "");
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const header = parseCsvLine(lines[0]!);
  const scrapedAt = new Date().toISOString();
  const providers: TrainingProvider[] = [];

  for (const line of lines.slice(1)) {
    const row = parseCsvLine(line);
    const m = rowToMap(header, row);
    const name = pickField(
      m,
      "tp name",
      "tp_name",
      "training provider",
      "training provider name",
      "provider",
      "provider name",
      "name",
      "company",
      "company name",
    );
    if (!name) continue;
    providers.push({
      ...emptyProvider(name, scrapedAt),
      email: pickField(m, "email", "e-mail", "mail"),
      phone: pickField(m, "phone", "telephone", "tel", "mobile"),
      website: pickField(m, "website", "web", "url", "site", "homepage"),
      address: pickField(m, "address"),
    });
  }

  return providers;
}

export function parseTrainingProvidersCsvBuffer(buffer: Buffer): TrainingProvider[] {
  return parseTrainingProvidersCsvText(buffer.toString("utf8"));
}
