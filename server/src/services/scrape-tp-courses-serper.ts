import {
  computeProvidersStats,
  type ProvidersData,
  type TrainingCourse,
  type TrainingProvider,
} from "../lib/training-providers.js";
import {
  mergeTrainingProviderLists,
  trainingProviderMergeKey,
} from "../lib/training-providers-merge.js";
import {
  getTrainingProviders,
  upsertTrainingProviders,
} from "../lib/training-providers-store.js";
import { dashScopeApiKey } from "../config/dashscope.js";
import { serperConfigured } from "../config/serper.js";
import { serperScrapeWithDelay, serperSearch } from "./serper-client.js";
import { qwenJsonCompletion } from "./qwen-json.js";

const MAX_MARKDOWN_CHARS = 90_000;
const SERPER_DELAY_MS = 900;
const COURSE_PATHS = ["", "/courses", "/training", "/programs", "/our-courses", "/course"];

export type SerperCourseScrapeStats = {
  providersProcessed: number;
  pagesScraped: number;
  searchQueries: number;
  coursesFound: number;
  qwenCalls: number;
  errors: string[];
};

function envInt(name: string, fallback: number): number {
  const n = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeWebsite(url: string): string {
  const t = url.trim();
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) return t.replace(/\/$/, "");
  return `https://${t.replace(/^\/+/, "")}`;
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return "";
  }
}

function sameSite(url: string, baseHost: string): boolean {
  const h = hostnameOf(url);
  return h === baseHost || h.endsWith(`.${baseHost}`);
}

function dedupeCourses(courses: TrainingCourse[]): TrainingCourse[] {
  const seen = new Set<string>();
  const out: TrainingCourse[] = [];
  for (const c of courses) {
    const title = c.title.trim();
    if (!title) continue;
    const key = title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      title,
      code: c.code?.trim() ?? "",
      scheme: c.scheme?.trim() ?? "",
      claimable: Boolean(c.claimable),
      duration: c.duration?.trim() ?? "",
      fee: c.fee?.trim() ?? "",
      mode: c.mode?.trim() ?? "",
      category: c.category?.trim() ?? "",
    });
  }
  return out;
}

async function extractCoursesFromMarkdown(
  providerName: string,
  markdown: string,
  stats: SerperCourseScrapeStats,
): Promise<TrainingCourse[]> {
  if (!markdown.trim()) return [];
  const prompt = `Extract ALL training courses or programs offered by "${providerName}" from this website content.
Return ONLY a JSON array:
[{
  "title": "", "code": "", "scheme": "",
  "claimable": true,
  "duration": "", "fee": "", "mode": "", "category": ""
}]
Rules:
- claimable=true if scheme mentions SBL, SBL-KHAS, or HRD Corp Claimable
- Never use null — use "" for missing strings
- Return [] if no courses are found
Content:
${markdown.slice(0, MAX_MARKDOWN_CHARS)}`;

  stats.qwenCalls += 1;
  try {
    const parsed = await qwenJsonCompletion<TrainingCourse[]>(prompt);
    return dedupeCourses(Array.isArray(parsed) ? parsed : []);
  } catch (err) {
    stats.errors.push(
      `courses Qwen (${providerName}): ${err instanceof Error ? err.message : String(err)}`,
    );
    return [];
  }
}

async function collectCourseMarkdown(
  provider: TrainingProvider,
  stats: SerperCourseScrapeStats,
): Promise<string> {
  const base = normalizeWebsite(provider.website);
  if (!base) return "";

  const host = hostnameOf(base);
  const chunks: string[] = [];
  const scrapedUrls = new Set<string>();

  for (const p of COURSE_PATHS) {
    let url: string;
    try {
      url = new URL(p || "/", `${base}/`).toString();
    } catch {
      continue;
    }
    if (scrapedUrls.has(url)) continue;
    scrapedUrls.add(url);
    try {
      const page = await serperScrapeWithDelay(url, SERPER_DELAY_MS);
      stats.pagesScraped += 1;
      if (page.markdown.trim()) {
        chunks.push(`\n--- URL: ${url} ---\n${page.markdown}`);
      }
    } catch (err) {
      stats.errors.push(
        `scrape ${url}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  const maxSearchPages = envInt("SERPER_MAX_SEARCH_PAGES", 2);
  if (chunks.join("").length < 2000 && host && maxSearchPages > 0) {
    const query = `site:${host} courses OR training OR programs`;
    try {
      stats.searchQueries += 1;
      const organic = await serperSearch(query, 8);
      await sleep(SERPER_DELAY_MS);
      let added = 0;
      for (const hit of organic) {
        const link = hit.link?.trim();
        if (!link || !sameSite(link, host) || scrapedUrls.has(link)) continue;
        scrapedUrls.add(link);
        try {
          const page = await serperScrapeWithDelay(link, SERPER_DELAY_MS);
          stats.pagesScraped += 1;
          if (page.markdown.trim()) {
            chunks.push(`\n--- URL: ${link} ---\n${page.markdown}`);
          }
          added += 1;
          if (added >= maxSearchPages) break;
        } catch (err) {
          stats.errors.push(
            `scrape ${link}: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }
    } catch (err) {
      stats.errors.push(
        `search ${provider.name}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  return chunks.join("\n").slice(0, MAX_MARKDOWN_CHARS);
}

export async function scrapeCoursesForProvider(
  provider: TrainingProvider,
  stats: SerperCourseScrapeStats,
): Promise<TrainingProvider> {
  const markdown = await collectCourseMarkdown(provider, stats);
  const courses = await extractCoursesFromMarkdown(provider.name, markdown, stats);
  stats.coursesFound += courses.length;
  return { ...provider, courses, scrapedAt: new Date().toISOString() };
}

export type ScrapeTpCoursesOptions = {
  maxProviders?: number;
  /** Only providers that have a website URL. Default true. */
  onlyWithWebsite?: boolean;
  onProgress?: (message: string) => void;
};

export async function scrapeTpCoursesWithSerper(
  providers: TrainingProvider[],
  options: ScrapeTpCoursesOptions = {},
): Promise<{ providers: TrainingProvider[]; stats: SerperCourseScrapeStats }> {
  if (!serperConfigured()) {
    throw new Error("SERPER_API_KEY is not configured");
  }
  dashScopeApiKey();

  const maxProviders = options.maxProviders ?? envInt("TP_COURSE_SCRAPE_MAX_PROVIDERS", 0);
  const onlyWithWebsite = options.onlyWithWebsite !== false;

  let targets = providers;
  if (onlyWithWebsite) {
    targets = targets.filter((p) => normalizeWebsite(p.website));
  }
  if (maxProviders > 0) {
    targets = targets.slice(0, maxProviders);
  }

  const stats: SerperCourseScrapeStats = {
    providersProcessed: 0,
    pagesScraped: 0,
    searchQueries: 0,
    coursesFound: 0,
    qwenCalls: 0,
    errors: [],
  };

  const updated: TrainingProvider[] = [];
  for (let i = 0; i < targets.length; i += 1) {
    const p = targets[i]!;
    options.onProgress?.(`Scraping courses (${i + 1}/${targets.length}): ${p.name}`);
    const enriched = await scrapeCoursesForProvider(p, stats);
    updated.push(enriched);
    stats.providersProcessed += 1;
  }

  return { providers: updated, stats };
}

export async function importCsvProvidersAndMaybeScrape(options: {
  providers: TrainingProvider[];
  scrapeCourses: boolean;
  maxScrapeProviders?: number;
  onProgress?: (message: string) => void;
}): Promise<{
  merge: { inserted: number; updated: number; total: number };
  scrape?: SerperCourseScrapeStats;
  providers: TrainingProvider[];
}> {
  let toSave = options.providers;
  let scrapeStats: SerperCourseScrapeStats | undefined;

  if (options.scrapeCourses && toSave.length > 0) {
    const max = options.maxScrapeProviders ?? envInt("TP_COURSE_SCRAPE_MAX_PROVIDERS", 0);
    const limited = max > 0 ? toSave.slice(0, max) : toSave;
    const { providers: scraped, stats } = await scrapeTpCoursesWithSerper(limited, {
      onProgress: options.onProgress,
    });
    scrapeStats = stats;
    const scrapedByKey = new Map(scraped.map((p) => [trainingProviderMergeKey(p), p]));
    toSave = toSave.map((p) => scrapedByKey.get(trainingProviderMergeKey(p)) ?? p);
  }

  const existing = (await getTrainingProviders()) ?? {
    scrapedAt: new Date().toISOString(),
    model: "csv-import",
    stats: computeProvidersStats([]),
    providers: [],
  };

  const { providers, inserted, updated } = mergeTrainingProviderLists(
    existing.providers,
    toSave,
  );

  const scrapedAt = new Date().toISOString();
  const model = options.scrapeCourses ? "csv-import + serper" : "csv-import";
  const keysToUpsert = new Set(toSave.map((p) => trainingProviderMergeKey(p)));
  const rowsToUpsert = providers.filter((p) => keysToUpsert.has(trainingProviderMergeKey(p)));

  options.onProgress?.(`Saving ${rowsToUpsert.length} provider(s) to database…`);
  await upsertTrainingProviders(rowsToUpsert, { model, scrapedAt });

  return {
    merge: { inserted, updated, total: providers.length },
    scrape: scrapeStats,
    providers,
  };
}

export async function scrapeAllDirectoryCourses(
  options: ScrapeTpCoursesOptions = {},
): Promise<{
  stats: SerperCourseScrapeStats;
  merge: { inserted: number; updated: number; total: number };
}> {
  const existing = await getTrainingProviders();
  if (!existing?.providers.length) {
    throw new Error("No training providers in database. Import a CSV first.");
  }

  const max = options.maxProviders ?? envInt("TP_COURSE_SCRAPE_MAX_PROVIDERS", 50);
  const { providers: scraped, stats } = await scrapeTpCoursesWithSerper(existing.providers, {
    ...options,
    maxProviders: max > 0 ? max : undefined,
  });

  const { providers, inserted, updated } = mergeTrainingProviderLists(
    existing.providers,
    scraped,
  );

  const scrapedAt = new Date().toISOString();
  const model =
    existing.model?.includes("serper") ? existing.model : `${existing.model || "directory"} + serper`;
  await upsertTrainingProviders(scraped, { model, scrapedAt });

  return {
    stats,
    merge: { inserted, updated, total: providers.length },
  };
}
