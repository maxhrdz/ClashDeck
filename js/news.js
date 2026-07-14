export const FALLBACK_NEWS = Object.freeze([
  {
    id: "ranked-trophy-requirements-2026",
    title: "Update to Ranked Trophy Requirements",
    date: "2026-07-14",
    category: "competitive",
    tag: "Ranked",
    source: "Clash Royale",
    url: "https://supercell.com/en/games/clashroyale/blog/news/update-to-ranked-trophy-requirements/",
    imageUrl: ""
  },
  {
    id: "july-balance-changes-2026",
    title: "July Balance Changes",
    date: "2026-07-06",
    category: "updates",
    tag: "Balance",
    source: "Clash Royale",
    url: "https://supercell.com/en/games/clashroyale/blog/release-notes/july-balance-changes-2026/",
    imageUrl: ""
  },
  {
    id: "new-season-honor-exile-2026",
    title: "New Season: Honor & Exile",
    date: "2026-07-06",
    category: "updates",
    tag: "New season",
    source: "Clash Royale",
    url: "https://supercell.com/en/games/clashroyale/blog/release-notes/new-season-honor-and-exile/",
    imageUrl: ""
  },
  {
    id: "crl-world-finals-2025",
    title: "Watch World Finals, Earn Rewards!",
    date: "2025-10-30",
    category: "competitive",
    tag: "Clash Royale League",
    source: "Clash Royale Esports",
    url: "https://esports.clashroyale.com/news/watch-world-finals-earn-rewards",
    imageUrl: ""
  },
  {
    id: "crl-finalists-2025",
    title: "12 Finalists. One Crown.",
    date: "2025-09-23",
    category: "competitive",
    tag: "World Finals",
    source: "Clash Royale Esports",
    url: "https://esports.clashroyale.com/news/12-finalists-one-crown",
    imageUrl: ""
  }
]);

export function normalizeNews(payload) {
  const items = Array.isArray(payload?.items) ? payload.items : [];
  return items
    .filter((item) => item && item.title && item.url && ["updates", "competitive"].includes(item.category))
    .map((item) => ({
      id: String(item.id || item.url),
      title: String(item.title),
      date: String(item.date || ""),
      category: item.category,
      tag: String(item.tag || (item.category === "competitive" ? "Competitive" : "Update")),
      source: String(item.source || "Official source"),
      url: String(item.url),
      imageUrl: String(item.imageUrl || "")
    }));
}

export async function loadNews() {
  try {
    const response = await fetch("/api/news", { cache: "no-store" });
    if (!response.ok) throw new Error(`News request failed with status ${response.status}`);
    const items = normalizeNews(await response.json());
    if (!items.length) throw new Error("No valid news items were returned");
    return { items, source: "live", label: "Official news · refreshed hourly" };
  } catch (error) {
    console.info("Live news unavailable. Using the verified news snapshot.");
    return { items: FALLBACK_NEWS.map((item) => ({ ...item })), source: "fallback", label: "Verified news snapshot" };
  }
}
