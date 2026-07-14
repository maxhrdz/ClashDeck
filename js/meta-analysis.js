import { analyzeDeck, DECK_SIZE } from "./analyzer.js";

const METRIC_KEYS = ["offense", "defense", "cycle", "versatility"];

export function compareDeckToMeta(deckCards, references, catalog) {
  if (!Array.isArray(deckCards) || deckCards.length !== DECK_SIZE || !Array.isArray(references)) return null;

  const selectedAnalysis = analyzeDeck(deckCards);
  const selectedKeys = new Set(deckCards.map((card) => card.key));
  const candidates = references
    .map((reference) => buildComparison(reference, selectedAnalysis, selectedKeys, catalog))
    .filter(Boolean)
    .sort((first, second) => second.similarity - first.similarity || second.sharedCount - first.sharedCount);

  return candidates[0] || null;
}

function buildComparison(reference, selectedAnalysis, selectedKeys, catalog) {
  const referenceCards = reference.cards
    .map((key) => catalog.find((card) => card.key === key))
    .filter(Boolean);
  if (referenceCards.length !== DECK_SIZE) return null;

  const referenceAnalysis = analyzeDeck(referenceCards);
  const sharedCards = referenceCards.filter((card) => selectedKeys.has(card.key)).map((card) => card.name);
  const cardSimilarity = sharedCards.length / DECK_SIZE;
  const profileDifference = METRIC_KEYS.reduce(
    (total, metric) => total + Math.abs(selectedAnalysis.metrics[metric] - referenceAnalysis.metrics[metric]),
    0
  ) / METRIC_KEYS.length;
  const profileSimilarity = 1 - profileDifference / 100;
  const elixirSimilarity = 1 - Math.min(Math.abs(selectedAnalysis.averageElixir - referenceAnalysis.averageElixir) / 3, 1);
  const similarity = Math.round((cardSimilarity * 0.4 + profileSimilarity * 0.45 + elixirSimilarity * 0.15) * 100);

  return {
    title: reference.title,
    subtitle: reference.subtitle,
    similarity,
    sharedCount: sharedCards.length,
    sharedCards,
    profileSimilarity: Math.round(profileSimilarity * 100),
    elixirDelta: Number((selectedAnalysis.averageElixir - referenceAnalysis.averageElixir).toFixed(1))
  };
}
