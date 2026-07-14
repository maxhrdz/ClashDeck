import { DATA_CONFIG, FALLBACK_CARDS } from "./config.js";

export function slugify(value) {
  return value
    .toLocaleLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function inferCardType(id) {
  const prefix = String(id || "").slice(0, 2);
  if (prefix === "27") return "Building";
  if (prefix === "28") return "Spell";
  return "Troop";
}

export function normalizeCard(card) {
  const name = String(card.name || card.key || "Unknown card").trim();
  return {
    key: String(card.key || slugify(name)).trim(),
    name,
    elixir: Number(card.elixir ?? card.elixirCost),
    type: card.type || inferCardType(card.id),
    rarity: card.rarity || "Unknown",
    description: card.description || "",
    id: card.id || null,
    imageUrl: card.imageUrl || card.iconUrls?.medium || ""
  };
}

export function cardImageUrl(card) {
  return card.imageUrl || `${DATA_CONFIG.imageBaseUrl}/${encodeURIComponent(card.key)}.png`;
}

export async function loadCardCatalog(forceRefresh = false) {
  try {
    const officialCards = await requestCardCatalog(DATA_CONFIG.officialApiProxyUrl, forceRefresh);
    return buildCatalogResult(officialCards, "official", "Official API");
  } catch (officialError) {
    try {
      const communityCards = await requestCardCatalog(DATA_CONFIG.communityDataUrl, forceRefresh);
      return buildCatalogResult(communityCards, "community", "Community catalog");
    } catch (communityError) {
      console.warn("Remote card data unavailable. Using the local fallback.", communityError);
      return buildCatalogResult(FALLBACK_CARDS, "fallback", "Offline catalog");
    }
  }
}

async function requestCardCatalog(baseUrl, forceRefresh) {
  const separator = baseUrl.includes("?") ? "&" : "?";
  const url = forceRefresh ? `${baseUrl}${separator}refresh=${Date.now()}` : baseUrl;
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Card request failed with status ${response.status}`);
  }

  const payload = await response.json();
  const cards = Array.isArray(payload) ? payload : payload.items;
  if (!Array.isArray(cards) || cards.length < 20) {
    throw new Error("Card data had an unexpected format");
  }

  return cards;
}

function buildCatalogResult(rawCards, source, label) {
  const cards = rawCards
    .map(normalizeCard)
    .filter((card) => card.key && Number.isFinite(card.elixir) && card.elixir > 0)
    .sort((first, second) => first.elixir - second.elixir || first.name.localeCompare(second.name));

  return { cards, source, label };
}
