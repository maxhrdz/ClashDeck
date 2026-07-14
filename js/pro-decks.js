import { slugify } from "./api.js";

export const FEATURED_DECKS = Object.freeze([
  {
    title: "Hog Control",
    subtitle: "Featured archetype",
    cards: ["hog-rider", "musketeer", "valkyrie", "cannon", "fireball", "the-log", "ice-wizard", "goblins"]
  },
  {
    title: "Giant Double Dragon",
    subtitle: "Featured archetype",
    cards: ["giant", "baby-dragon", "inferno-dragon", "musketeer", "valkyrie", "fireball", "zap", "arrows"]
  },
  {
    title: "Miner Balloon",
    subtitle: "Featured archetype",
    cards: ["miner", "balloon", "inferno-dragon", "minions", "ice-wizard", "tesla", "poison", "zap"]
  }
]);

export function normalizeProDecks(payload) {
  const decks = Array.isArray(payload?.items) ? payload.items : [];
  return decks
    .map((deck) => ({
      title: String(deck.playerName || deck.title || "Top ladder player"),
      subtitle: Number.isFinite(Number(deck.rank)) ? `Global rank #${Number(deck.rank)}` : "Top ladder deck",
      trophies: Number(deck.trophies) || null,
      cards: (Array.isArray(deck.cards) ? deck.cards : [])
        .map((card) => String(card.key || slugify(card.name || "")))
        .filter(Boolean)
    }))
    .filter((deck) => deck.cards.length === 8);
}

export async function loadProDecks() {
  try {
    const response = await fetch("/api/pro-decks", { cache: "no-store" });
    if (!response.ok) throw new Error(`Pro deck request failed with status ${response.status}`);
    const decks = normalizeProDecks(await response.json());
    if (!decks.length) throw new Error("No complete top ladder decks were returned");
    return { decks, source: "live", label: "Live top ladder decks" };
  } catch (error) {
    console.info("Live top ladder decks unavailable. Using featured archetypes.");
    return { decks: FEATURED_DECKS.map((deck) => ({ ...deck })), source: "fallback", label: "Featured archetypes" };
  }
}

export function resolveDeckKeys(deck, catalog) {
  const available = new Set(catalog.map((card) => card.key));
  return deck.cards.filter((key) => available.has(key)).slice(0, 8);
}
