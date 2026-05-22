import { serperApiKey } from "../config/serper.js";

const SCRAPE_URL = "https://scrape.serper.dev";
const SEARCH_URL = "https://google.serper.dev/search";

const DEFAULT_TIMEOUT_MS = 45_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type SerperScrapeResult = {
  markdown: string;
  title: string;
};

type SerperOrganic = { title?: string; link?: string; snippet?: string };

export async function serperScrapePage(url: string): Promise<SerperScrapeResult> {
  const key = serperApiKey();
  const ac = new AbortController();
  const timeout = setTimeout(() => ac.abort(), DEFAULT_TIMEOUT_MS);
  try {
    const resp = await fetch(SCRAPE_URL, {
      method: "POST",
      headers: {
        "X-API-KEY": key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url, includeMarkdown: true }),
      signal: ac.signal,
    });
    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      throw new Error(`Serper scrape ${resp.status}: ${text || resp.statusText}`);
    }
    const raw = (await resp.json()) as {
      markdown?: string;
      text?: string;
      metadata?: { title?: string; ogTitle?: string };
    };
    const markdown = String(raw.markdown ?? raw.text ?? "").trim();
    const title = String(raw.metadata?.title ?? raw.metadata?.ogTitle ?? "").trim();
    return { markdown, title };
  } finally {
    clearTimeout(timeout);
  }
}

export async function serperSearch(query: string, num = 5): Promise<SerperOrganic[]> {
  const key = serperApiKey();
  const ac = new AbortController();
  const timeout = setTimeout(() => ac.abort(), DEFAULT_TIMEOUT_MS);
  try {
    const resp = await fetch(SEARCH_URL, {
      method: "POST",
      headers: {
        "X-API-KEY": key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ q: query, num }),
      signal: ac.signal,
    });
    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      throw new Error(`Serper search ${resp.status}: ${text || resp.statusText}`);
    }
    const raw = (await resp.json()) as { organic?: SerperOrganic[] };
    return Array.isArray(raw.organic) ? raw.organic : [];
  } finally {
    clearTimeout(timeout);
  }
}

export async function serperScrapeWithDelay(url: string, delayMs: number): Promise<SerperScrapeResult> {
  await sleep(delayMs);
  return serperScrapePage(url);
}
