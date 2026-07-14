const OFFICIAL_NEWS_URL = "https://supercell.com/en/games/clashroyale/blog/";
const SUPERCELL_ROOT = "https://supercell.com";
const REQUEST_TIMEOUT_MS = 7000;

export const COMPETITIVE_FALLBACK = Object.freeze([
  {
    id: "crl-world-finals-rewards-2025",
    title: "Watch World Finals, Earn Rewards!",
    date: "2025-10-30",
    category: "competitive",
    tag: "Clash Royale League",
    source: "Clash Royale Esports",
    url: "https://esports.clashroyale.com/news/watch-world-finals-earn-rewards",
    imageUrl: ""
  },
  {
    id: "crl-12-finalists-2025",
    title: "12 Finalists. One Crown.",
    date: "2025-09-23",
    category: "competitive",
    tag: "World Finals",
    source: "Clash Royale Esports",
    url: "https://esports.clashroyale.com/news/12-finalists-one-crown",
    imageUrl: ""
  },
  {
    id: "crl-last-chance-qualifier-2025",
    title: "CRL25 Last Chance Qualifier",
    date: "2025-09-15",
    category: "competitive",
    tag: "Qualifier",
    source: "Clash Royale Esports",
    url: "https://esports.clashroyale.com/news/crl25-last-chance-qualifier",
    imageUrl: ""
  }
]);

export function parseOfficialNewsArchive(html) {
  if (typeof html !== "string") return [];
  return html
    .split(/(?=<div data-test-id="[^"]+" data-test-class="archived-article")/g)
    .filter((segment) => segment.includes('data-test-class="archived-article"'))
    .map(parseArticleSegment)
    .filter(Boolean)
    .slice(0, 8);
}

function parseArticleSegment(segment) {
  const id = segment.match(/data-test-id="([^"]+)"/)?.[1];
  const dateText = segment.match(/data-test-id="publish-date-text">([^<]+)</)?.[1];
  const linkMatch = segment.match(/archivedArticles_titleLink__[^"]*" href="([^"]+)">([\s\S]*?)<\/a>/);
  if (!id || !dateText || !linkMatch) return null;

  const title = decodeHtml(stripTags(linkMatch[2])).trim();
  const imageUrl = decodeHtml(segment.match(/<img[^>]+src="(https:\/\/clashroyale\.inbox\.supercell\.com\/[^"]+)"/)?.[1] || "");
  const category = classifyNews(title);
  return {
    id,
    title,
    date: toIsoDate(dateText),
    category,
    tag: category === "competitive" ? "Competitive" : inferUpdateTag(title),
    source: "Clash Royale",
    url: new URL(decodeHtml(linkMatch[1]), SUPERCELL_ROOT).href,
    imageUrl
  };
}

export function classifyNews(title) {
  const value = title.toLocaleLowerCase();
  return /(ranked|competitive|tournament|championship|league|world finals|crl|qualifier)/.test(value)
    ? "competitive"
    : "updates";
}

function inferUpdateTag(title) {
  const value = title.toLocaleLowerCase();
  if (/(new card|new hero|hero|evolution)/.test(value)) return "New cards";
  if (/balance/.test(value)) return "Balance";
  if (/season/.test(value)) return "New season";
  return "Game update";
}

function toIsoDate(value) {
  const parsed = new Date(`${value.trim()} 00:00:00 UTC`);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}

function stripTags(value) {
  return value.replace(/<[^>]+>/g, " ");
}

function decodeHtml(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#x27;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ message: "Method not allowed" });
  }

  try {
    const upstream = await fetch(OFFICIAL_NEWS_URL, {
      headers: { Accept: "text/html", "User-Agent": "RoyaleDeckAnalyzer/1.0" },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });
    if (!upstream.ok) throw new Error(`News source returned ${upstream.status}`);

    const updates = parseOfficialNewsArchive(await upstream.text());
    if (!updates.length) throw new Error("Official news format was not recognized");

    const existingUrls = new Set(updates.map((item) => item.url));
    const items = [...updates, ...COMPETITIVE_FALLBACK.filter((item) => !existingUrls.has(item.url))];
    response.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=21600");
    return response.status(200).json({ items, updatedAt: new Date().toISOString(), source: "official" });
  } catch (error) {
    console.error("Unable to refresh official Clash Royale news.", error);
    return response.status(502).json({ message: "Unable to refresh official Clash Royale news." });
  }
}
