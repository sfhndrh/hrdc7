import {
  computeProvidersStats,
  type ProvidersData,
  type TrainingCourse,
  type TrainingProvider,
} from "../lib/training-providers.js";
import { saveTrainingProviders } from "../lib/training-providers-store.js";
import { qwenJsonCompletion, qwenModel } from "./qwen-json.js";

const ETRIS_ORIGIN = "https://etris.hrdcorp.gov.my";
const DIGIGOV_BASE = `${ETRIS_ORIGIN}/DigiGov`;

/** HRDC eTRiS — Listing of Training Provider (anonymous search). */
const DEFAULT_LISTING_URL =
  "https://etris.hrdcorp.gov.my/DigiGov/digigovportal.htm?actionFlag=SC_getSearchCompoPage&isPopup=0&isAnonymous=true&tableid=row&tableid=row&tableid=row&hideActionBtns=Y&screenMode=edit&elementId=1100889&applicationMstId=1100011&defaultSearchCrt=1100100%7E1%7EN%7EN&changeLang=en_US";

function listingStartUrl(): string {
  return process.env.TRAINING_PROVIDERS_LISTING_URL?.trim() || DEFAULT_LISTING_URL;
}

const MAX_HTML_CHARS = 120_000;
const FETCH_DELAY_MS = 400;

export type ScrapeOptions = {
  maxPages?: number;
  maxProviders?: number;
  recordsPerPage?: number;
  onProgress?: (message: string) => void;
};

export type ScrapeStats = {
  listingPagesFetched: number;
  providersListed: number;
  detailPagesFetched: number;
  websitePagesFetched: number;
  qwenCalls: number;
  errors: string[];
};

type ListingRow = {
  name: string;
  registrationNo: string;
  status: string;
  detailHref: string;
  email?: string;
  phone?: string;
  address?: string;
};

type ProviderDetail = {
  name: string;
  registrationNo: string;
  status: string;
  email: string;
  phone: string;
  fax: string;
  website: string;
  address: string;
  state: string;
  description: string;
  courses: TrainingCourse[];
};

type ContactEnrichment = {
  address: string;
  phone: string;
  email: string;
  state: string;
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function truncateHtml(html: string): string {
  if (html.length <= MAX_HTML_CHARS) return html;
  return html.slice(0, MAX_HTML_CHARS);
}

function resolveEtrisUrl(href: string, baseUrl: string): string {
  const trimmed = href.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("/")) return `${ETRIS_ORIGIN}${trimmed}`;
  try {
    return new URL(trimmed, baseUrl).toString();
  } catch {
    return `${DIGIGOV_BASE}/${trimmed.replace(/^\//, "")}`;
  }
}

function normalizeWebsite(url: string): string {
  const u = url.trim();
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u;
  return `https://${u}`;
}

function isClaimableScheme(scheme: string): boolean {
  const s = scheme.toUpperCase();
  return s.includes("SBL") || s.includes("SBL-KHAS") || s.includes("HRD CORP CLAIMABLE");
}

function normalizeCourse(raw: Partial<TrainingCourse>): TrainingCourse {
  const scheme = String(raw.scheme ?? "");
  const claimable =
    typeof raw.claimable === "boolean" ? raw.claimable : isClaimableScheme(scheme);
  return {
    title: String(raw.title ?? ""),
    code: String(raw.code ?? ""),
    scheme,
    claimable,
    duration: String(raw.duration ?? ""),
    fee: String(raw.fee ?? ""),
    mode: String(raw.mode ?? ""),
    category: String(raw.category ?? ""),
  };
}

function normalizeDetail(raw: ProviderDetail, fallbackName: string): ProviderDetail {
  const courses = Array.isArray(raw.courses)
    ? raw.courses.map((c) => normalizeCourse(c))
    : [];
  return {
    name: String(raw.name ?? fallbackName),
    registrationNo: String(raw.registrationNo ?? ""),
    status: String(raw.status ?? ""),
    email: String(raw.email ?? ""),
    phone: String(raw.phone ?? ""),
    fax: String(raw.fax ?? ""),
    website: String(raw.website ?? ""),
    address: String(raw.address ?? ""),
    state: String(raw.state ?? ""),
    description: String(raw.description ?? ""),
    courses,
  };
}

async function fetchHtml(url: string): Promise<string> {
  const resp = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; HRDCTrainerBot/1.0; +https://github.com/hrdctrainer)",
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.9",
    },
    redirect: "follow",
  });
  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status} for ${url}`);
  }
  return resp.text();
}

function parseListingPageCount(html: string): number {
  const lastMatch = html.match(/d-16544-p=(\d+)[^>]*>Last</i);
  if (lastMatch) return Number.parseInt(lastMatch[1]!, 10);
  const banner = html.match(/(\d[\d,]*)\s+records found/i);
  if (!banner) return 1;
  const total = Number.parseInt(banner[1]!.replace(/,/g, ""), 10);
  const perPageMatch = html.match(/displaying\s+\d+\s+to\s+(\d+)\s+records/i);
  const perPage = perPageMatch ? Number.parseInt(perPageMatch[1]!, 10) : 5;
  return Math.max(1, Math.ceil(total / perPage));
}

/**
 * Build a paginated listing URL while preserving repeated query keys (e.g. tableid=row×3)
 * that the DigiGov portal expects.
 */
function buildListingPageUrl(page: number, recordsPerPage: number): string {
  let url = listingStartUrl();

  if (/[?&]d-16544-p=\d+/.test(url)) {
    url = url.replace(/([?&])d-16544-p=\d+/, `$1d-16544-p=${page}`);
  } else {
    url += `${url.includes("?") ? "&" : "?"}d-16544-p=${page}`;
  }

  if (recordsPerPage > 0) {
    if (/[?&]recordsPerPage=/.test(url)) {
      url = url.replace(/([?&])recordsPerPage=[^&]*/, `$1recordsPerPage=${recordsPerPage}`);
    } else {
      url += `&recordsPerPage=${recordsPerPage}`;
    }
  }

  return url;
}

/** Deterministic fallback when Qwen misses rows in the results table. */
function parseListingRowsFromHtml(html: string): ListingRow[] {
  const rows: ListingRow[] = [];
  const rowRe =
    /<tr[^>]*class="(?:odd|even)"[^>]*>([\s\S]*?)<\/tr>/gi;
  let m: RegExpExecArray | null;
  while ((m = rowRe.exec(html)) !== null) {
    const cells = [...m[1]!.matchAll(/class="tablecelltext"[^>]*>([\s\S]*?)<\/td>/gi)].map(
      (c) =>
        c[1]!
          .replace(/<[^>]+>/g, "")
          .replace(/&nbsp;/g, " ")
          .replace(/&amp;/g, "&")
          .trim(),
    );
    if (cells.length < 2) continue;
    const name = cells[0] ?? "";
    if (!name || name === "Total Amount (RM)") continue;
    rows.push({
      name,
      registrationNo: "",
      status: "",
      detailHref: "",
      email: cells[1] ?? "",
      phone: cells[2] ?? "",
      address: cells[3] ?? "",
    });
  }
  return rows;
}

function mergeListingRows(qwenRows: ListingRow[], htmlRows: ListingRow[]): ListingRow[] {
  const byName = new Map<string, ListingRow>();
  for (const r of htmlRows) {
    byName.set(r.name.toLowerCase(), r);
  }
  const merged: ListingRow[] = [];
  const seen = new Set<string>();

  for (const q of qwenRows) {
    const key = q.name.toLowerCase();
    const html = byName.get(key);
    merged.push({
      ...q,
      email: q.email ?? html?.email,
      phone: q.phone ?? html?.phone,
      address: q.address ?? html?.address,
    });
    seen.add(key);
  }

  for (const h of htmlRows) {
    const key = h.name.toLowerCase();
    if (!seen.has(key)) merged.push(h);
  }

  return merged;
}

async function extractListingRows(html: string, stats: ScrapeStats): Promise<ListingRow[]> {
  const prompt = `Extract ALL training provider rows from this HTML.
Return ONLY a JSON array:
[{ "name": "", "registrationNo": "", "status": "", "detailHref": "" }]
Return [] if none found.
HTML: ${truncateHtml(html)}`;

  stats.qwenCalls += 1;
  let qwenRows: ListingRow[] = [];
  try {
    const parsed = await qwenJsonCompletion<ListingRow[]>(prompt);
    qwenRows = Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    stats.errors.push(`listing Qwen: ${err instanceof Error ? err.message : String(err)}`);
  }

  const htmlRows = parseListingRowsFromHtml(html);
  return mergeListingRows(qwenRows, htmlRows);
}

async function extractProviderDetail(
  html: string,
  name: string,
  stats: ScrapeStats,
): Promise<ProviderDetail> {
  const prompt = `Extract ALL information for training provider "${name}" from this HTML.
Return ONLY a JSON object:
{
  "name": "", "registrationNo": "", "status": "",
  "email": "", "phone": "", "fax": "",
  "website": "", "address": "", "state": "", "description": "",
  "courses": [{
    "title": "", "code": "", "scheme": "",
    "claimable": true/false,
    "duration": "", "fee": "", "mode": "", "category": ""
  }]
}
Rules: claimable=true if scheme contains SBL, SBL-KHAS, or HRD Corp Claimable.
Never use null — use "" for missing strings, [] for missing arrays.
HTML: ${truncateHtml(html)}`;

  stats.qwenCalls += 1;
  const parsed = await qwenJsonCompletion<ProviderDetail>(prompt);
  return normalizeDetail(parsed, name);
}

async function enrichContactFromWebsite(
  html: string,
  name: string,
  stats: ScrapeStats,
): Promise<ContactEnrichment> {
  const prompt = `Extract contact info for "${name}" from this HTML.
Return ONLY JSON:
{ "address": "", "phone": "", "email": "", "state": "" }
HTML: ${truncateHtml(html)}`;

  stats.qwenCalls += 1;
  const parsed = await qwenJsonCompletion<ContactEnrichment>(prompt);
  return {
    address: String(parsed.address ?? ""),
    phone: String(parsed.phone ?? ""),
    email: String(parsed.email ?? ""),
    state: String(parsed.state ?? ""),
  };
}

function needsContactEnrichment(detail: ProviderDetail): boolean {
  return !detail.address.trim() || !detail.phone.trim() || !detail.email.trim();
}

async function fetchWebsiteContactPages(
  website: string,
  name: string,
  stats: ScrapeStats,
): Promise<ContactEnrichment> {
  const base = normalizeWebsite(website);
  if (!base) return { address: "", phone: "", email: "", state: "" };

  const paths = ["", "/contact", "/contact-us", "/about", "/about-us"];
  const merged: ContactEnrichment = { address: "", phone: "", email: "", state: "" };

  for (const p of paths) {
    let url: string;
    try {
      url = new URL(p, base).toString();
    } catch {
      continue;
    }
    try {
      await sleep(FETCH_DELAY_MS);
      const html = await fetchHtml(url);
      stats.websitePagesFetched += 1;
      const chunk = await enrichContactFromWebsite(html, name, stats);
      if (!merged.address && chunk.address) merged.address = chunk.address;
      if (!merged.phone && chunk.phone) merged.phone = chunk.phone;
      if (!merged.email && chunk.email) merged.email = chunk.email;
      if (!merged.state && chunk.state) merged.state = chunk.state;
      if (merged.address && merged.phone && merged.email) break;
    } catch (err) {
      stats.errors.push(
        `website ${url}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  return merged;
}

function listingRowToProvider(row: ListingRow, detailUrl: string, scrapedAt: string): TrainingProvider {
  return {
    name: row.name,
    registrationNo: row.registrationNo,
    status: row.status,
    email: row.email ?? "",
    phone: row.phone ?? "",
    fax: "",
    website: "",
    address: row.address ?? "",
    state: "",
    description: "",
    courses: [],
    detailUrl,
    scrapedAt,
  };
}

export async function scrapeTrainingProviders(
  options: ScrapeOptions = {},
): Promise<{ count: number; stats: ScrapeStats; data: ProvidersData }> {
  const recordsPerPage = options.recordsPerPage ?? 100;
  const maxPages = options.maxPages ?? 0;
  const maxProviders = options.maxProviders ?? 0;
  const log = options.onProgress ?? (() => {});

  const scrapeStats: ScrapeStats = {
    listingPagesFetched: 0,
    providersListed: 0,
    detailPagesFetched: 0,
    websitePagesFetched: 0,
    qwenCalls: 0,
    errors: [],
  };

  log("Fetching first listing page…");
  const firstHtml = await fetchHtml(
    buildListingPageUrl(1, recordsPerPage),
  );
  scrapeStats.listingPagesFetched = 1;

  const totalPages = parseListingPageCount(firstHtml);
  const pagesToFetch =
    maxPages > 0 ? Math.min(maxPages, totalPages) : totalPages;

  const allRows: ListingRow[] = [];
  const firstRows = await extractListingRows(firstHtml, scrapeStats);
  allRows.push(...firstRows);
  log(`Page 1/${pagesToFetch}: ${firstRows.length} providers`);

  for (let page = 2; page <= pagesToFetch; page += 1) {
    if (maxProviders > 0 && allRows.length >= maxProviders) break;
    await sleep(FETCH_DELAY_MS);
    log(`Fetching listing page ${page}/${pagesToFetch}…`);
    const html = await fetchHtml(buildListingPageUrl(page, recordsPerPage));
    scrapeStats.listingPagesFetched += 1;
    const rows = await extractListingRows(html, scrapeStats);
    allRows.push(...rows);
    log(`Page ${page}/${pagesToFetch}: ${rows.length} providers`);
  }

  const uniqueRows: ListingRow[] = [];
  const seenNames = new Set<string>();
  for (const row of allRows) {
    if (!row.name.trim()) continue;
    const key = row.name.toLowerCase();
    if (seenNames.has(key)) continue;
    seenNames.add(key);
    uniqueRows.push(row);
    if (maxProviders > 0 && uniqueRows.length >= maxProviders) break;
  }

  scrapeStats.providersListed = uniqueRows.length;
  log(`Processing ${uniqueRows.length} providers…`);

  const scrapedAt = new Date().toISOString();
  const providers: TrainingProvider[] = [];

  for (let i = 0; i < uniqueRows.length; i += 1) {
    const row = uniqueRows[i]!;
    log(`Provider ${i + 1}/${uniqueRows.length}: ${row.name}`);

    const detailUrl = row.detailHref
      ? resolveEtrisUrl(row.detailHref, listingStartUrl())
      : "";

    let provider = listingRowToProvider(row, detailUrl, scrapedAt);

    if (detailUrl) {
      try {
        await sleep(FETCH_DELAY_MS);
        const detailHtml = await fetchHtml(detailUrl);
        scrapeStats.detailPagesFetched += 1;
        const detail = await extractProviderDetail(detailHtml, row.name, scrapeStats);
        provider = {
          ...provider,
          name: detail.name || provider.name,
          registrationNo: detail.registrationNo || provider.registrationNo,
          status: detail.status || provider.status,
          email: detail.email || provider.email,
          phone: detail.phone || provider.phone,
          fax: detail.fax,
          website: detail.website,
          address: detail.address || provider.address,
          state: detail.state,
          description: detail.description,
          courses: detail.courses,
          detailUrl,
          scrapedAt,
        };
      } catch (err) {
        scrapeStats.errors.push(
          `detail ${row.name}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    if (needsContactEnrichment(provider) && provider.website.trim()) {
      try {
        const enriched = await fetchWebsiteContactPages(
          provider.website,
          provider.name,
          scrapeStats,
        );
        provider = {
          ...provider,
          address: provider.address || enriched.address,
          phone: provider.phone || enriched.phone,
          email: provider.email || enriched.email,
          state: provider.state || enriched.state,
        };
      } catch (err) {
        scrapeStats.errors.push(
          `enrich ${row.name}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    providers.push(provider);
  }

  const data: ProvidersData = {
    scrapedAt,
    model: qwenModel(),
    stats: computeProvidersStats(providers),
    providers,
  };

  await saveTrainingProviders(data);

  return {
    count: providers.length,
    stats: scrapeStats,
    data,
  };
}
