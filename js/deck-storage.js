const STORAGE_KEY = "royale-deck-analyzer:selected-cards";

export function parseDeckParam(search) {
  const value = new URLSearchParams(search).get("deck");
  if (!value) return [];
  return [...new Set(value.split(",").map((key) => key.trim()).filter(Boolean))].slice(0, 8);
}

export function restoreDeck(availableKeys, search = window.location.search) {
  const sharedKeys = parseDeckParam(search).filter((key) => availableKeys.has(key));
  if (sharedKeys.length) return sharedKeys;

  try {
    const savedKeys = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(savedKeys)
      ? [...new Set(savedKeys)].filter((key) => availableKeys.has(key)).slice(0, 8)
      : [];
  } catch (error) {
    console.warn("Could not restore the saved deck.", error);
    return [];
  }
}

export function saveDeck(keys) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
  } catch (error) {
    console.warn("Could not save the deck locally.", error);
  }
}

export function createShareUrl(keys, currentUrl = window.location.href) {
  const url = new URL(currentUrl);
  url.searchParams.set("deck", keys.join(","));
  url.hash = "main-content";
  return url.toString();
}
