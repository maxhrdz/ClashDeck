import { loadCardCatalog, cardImageUrl } from "./api.js";
import { analyzeDeck, DECK_SIZE, hasRole } from "./analyzer.js";
import { createShareUrl, restoreDeck, saveDeck } from "./deck-storage.js";
import { loadProDecks, resolveDeckKeys } from "./pro-decks.js";
import { compareDeckToMeta } from "./meta-analysis.js";
import { loadNews } from "./news.js";

const state = {
  cards: [],
  selectedKeys: [],
  query: "",
  type: "all",
  source: "loading",
  proDecks: [],
  news: [],
  newsFilter: "all"
};

const elements = {
  cardGrid: document.querySelector("#card-grid"),
  cardSearch: document.querySelector("#card-search"),
  typeFilter: document.querySelector("#type-filter"),
  refreshData: document.querySelector("#refresh-data"),
  catalogCount: document.querySelector("#catalog-count"),
  selectedSummary: document.querySelector("#selected-summary"),
  dataStatus: document.querySelector("#data-status"),
  deckSlots: document.querySelector("#deck-slots"),
  deckCount: document.querySelector("#deck-count"),
  clearDeck: document.querySelector("#clear-deck"),
  smartDeck: document.querySelector("#smart-deck"),
  shareDeck: document.querySelector("#share-deck"),
  installApp: document.querySelector("#install-app"),
  deckGrade: document.querySelector("#deck-grade"),
  analysisEmpty: document.querySelector("#analysis-empty"),
  analysisContent: document.querySelector("#analysis-content"),
  balanceScore: document.querySelector("#balance-score"),
  scoreMeterFill: document.querySelector("#score-meter-fill"),
  averageElixir: document.querySelector("#average-elixir"),
  airDefenseCount: document.querySelector("#air-defense-count"),
  winConditionCount: document.querySelector("#win-condition-count"),
  spellCount: document.querySelector("#spell-count"),
  archetypeName: document.querySelector("#archetype-name"),
  archetypeDescription: document.querySelector("#archetype-description"),
  airCheck: document.querySelector("#air-check"),
  winCheck: document.querySelector("#win-check"),
  cycleCheck: document.querySelector("#cycle-check"),
  recommendationList: document.querySelector("#recommendation-list"),
  metaMatch: document.querySelector("#meta-match"),
  metaSimilarity: document.querySelector("#meta-similarity"),
  metaDeckName: document.querySelector("#meta-deck-name"),
  metaExplanation: document.querySelector("#meta-explanation"),
  proDeckGrid: document.querySelector("#pro-deck-grid"),
  proStatus: document.querySelector("#pro-status"),
  newsGrid: document.querySelector("#news-grid"),
  newsStatus: document.querySelector("#news-status"),
  newsFilters: [...document.querySelectorAll("[data-news-filter]")],
  toast: document.querySelector("#toast")
};

let toastTimer;
let installPrompt;

async function loadCards(forceRefresh = false) {
  setLoadingState();
  const result = await loadCardCatalog(forceRefresh);
  state.cards = result.cards;
  state.source = result.source;
  setDataStatus(`${result.label} · ${result.cards.length} cards`, result.source === "fallback" ? "fallback" : "live");

  const availableKeys = new Set(state.cards.map((card) => card.key));
  state.selectedKeys = restoreDeck(availableKeys);
  render();
  elements.cardGrid.setAttribute("aria-busy", "false");

  if (result.source === "fallback") {
    showToast("Live data is unavailable, so the offline catalog is being used.");
  }

  await loadDeckExamples();
  await loadNewsFeed();
}

async function loadNewsFeed() {
  const result = await loadNews();
  state.news = result.items;
  setNewsStatus(result.label, result.source);
  renderNews();
}

function setNewsStatus(message, source) {
  elements.newsStatus.className = `data-status data-status--${source === "live" ? "live" : "fallback"}`;
  elements.newsStatus.replaceChildren();
  const dot = document.createElement("span");
  dot.className = "data-status__dot";
  elements.newsStatus.append(dot, document.createTextNode(message));
}

function renderNews() {
  const items = state.news.filter((item) => state.newsFilter === "all" || item.category === state.newsFilter);
  elements.newsGrid.replaceChildren();
  elements.newsGrid.setAttribute("aria-busy", "false");
  items.slice(0, 6).forEach((item) => elements.newsGrid.append(createNewsCard(item)));
}

function createNewsCard(item) {
  const article = document.createElement("article");
  article.className = `news-card news-card--${item.category}`;

  const visual = document.createElement("div");
  visual.className = "news-card__visual";
  if (item.imageUrl) {
    const image = document.createElement("img");
    image.src = item.imageUrl;
    image.alt = "";
    image.loading = "lazy";
    image.addEventListener("error", () => visual.classList.add("has-error"), { once: true });
    visual.append(image);
  }
  const icon = document.createElement("span");
  icon.className = "news-card__icon";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = item.category === "competitive" ? "⚔" : "✦";
  visual.append(icon);

  const content = document.createElement("div");
  content.className = "news-card__content";
  const meta = document.createElement("div");
  meta.className = "news-card__meta";
  const tag = document.createElement("span");
  tag.textContent = item.tag;
  const date = document.createElement("time");
  date.dateTime = item.date;
  date.textContent = formatNewsDate(item.date);
  meta.append(tag, date);

  const title = document.createElement("h3");
  title.textContent = item.title;
  const source = document.createElement("p");
  source.textContent = item.source;
  const link = document.createElement("a");
  link.href = item.url;
  link.target = "_blank";
  link.rel = "noreferrer";
  link.textContent = "Read official story →";
  link.setAttribute("aria-label", `Read ${item.title} from ${item.source}`);
  content.append(meta, title, source, link);
  article.append(visual, content);
  return article;
}

function formatNewsDate(value) {
  if (!value) return "Date unavailable";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })
    .format(new Date(`${value}T00:00:00Z`));
}

async function loadDeckExamples() {
  const result = await loadProDecks();
  state.proDecks = result.decks;
  setProStatus(result.label, result.source);
  renderProDecks();
}

function setProStatus(message, source) {
  elements.proStatus.className = `data-status data-status--${source === "live" ? "live" : "fallback"}`;
  elements.proStatus.replaceChildren();
  const dot = document.createElement("span");
  dot.className = "data-status__dot";
  elements.proStatus.append(dot, document.createTextNode(message));
}

function renderProDecks() {
  elements.proDeckGrid.replaceChildren();
  elements.proDeckGrid.setAttribute("aria-busy", "false");
  state.proDecks.forEach((deck) => elements.proDeckGrid.append(createProDeckCard(deck)));
  renderAnalysis();
}

function createProDeckCard(deck) {
  const keys = resolveDeckKeys(deck, state.cards);
  const article = document.createElement("article");
  article.className = "pro-deck-card";

  const heading = document.createElement("div");
  heading.className = "pro-deck-card__heading";
  const copy = document.createElement("div");
  const title = document.createElement("h3");
  title.textContent = deck.title;
  const subtitle = document.createElement("p");
  subtitle.textContent = deck.trophies ? `${deck.subtitle} · ${deck.trophies.toLocaleString()} trophies` : deck.subtitle;
  copy.append(title, subtitle);
  const crown = document.createElement("span");
  crown.className = "pro-deck-card__crown";
  crown.setAttribute("aria-hidden", "true");
  crown.textContent = "♛";
  heading.append(copy, crown);

  const cards = document.createElement("div");
  cards.className = "pro-deck-card__cards";
  keys.forEach((key) => {
    const card = state.cards.find((item) => item.key === key);
    const image = document.createElement("img");
    image.src = cardImageUrl(card);
    image.alt = card.name;
    image.loading = "lazy";
    cards.append(image);
  });

  const button = document.createElement("button");
  button.type = "button";
  button.className = "button button--battle";
  button.textContent = keys.length === DECK_SIZE ? "USE DECK" : "UNAVAILABLE OFFLINE";
  button.disabled = keys.length !== DECK_SIZE;
  button.addEventListener("click", () => useProDeck(keys, deck.title));
  article.append(heading, cards, button);
  return article;
}

function useProDeck(keys, title) {
  state.selectedKeys = [...keys];
  saveDeck(state.selectedKeys);
  render();
  document.querySelector("#deck-title").scrollIntoView({ behavior: "smooth", block: "start" });
  showToast(`${title} loaded. Review its analysis and try one substitution.`);
}

function setLoadingState() {
  elements.cardGrid.setAttribute("aria-busy", "true");
  elements.cardGrid.replaceChildren(createLoadingState());
  elements.refreshData.disabled = true;
  setDataStatus("Loading card data…", "loading");
}

function createLoadingState() {
  const wrapper = document.createElement("div");
  wrapper.className = "loading-state";
  const loader = document.createElement("span");
  loader.className = "loader";
  loader.setAttribute("aria-hidden", "true");
  const message = document.createElement("p");
  message.textContent = "Opening the card collection…";
  wrapper.append(loader, message);
  return wrapper;
}

function setDataStatus(message, variant) {
  elements.dataStatus.className = `data-status data-status--${variant}`;
  elements.dataStatus.replaceChildren();
  const dot = document.createElement("span");
  dot.className = "data-status__dot";
  elements.dataStatus.append(dot, document.createTextNode(message));
}

function render() {
  renderCatalog();
  renderDeck();
  renderAnalysis();
  elements.refreshData.disabled = false;
}

function filteredCards() {
  const normalizedQuery = state.query.toLocaleLowerCase();
  return state.cards.filter((card) => {
    const matchesQuery = card.name.toLocaleLowerCase().includes(normalizedQuery);
    const matchesType = state.type === "all" || card.type === state.type;
    return matchesQuery && matchesType;
  });
}

function renderCatalog() {
  const cards = filteredCards();
  elements.cardGrid.replaceChildren();

  if (!cards.length) {
    const empty = document.createElement("div");
    empty.className = "empty-results";
    const title = document.createElement("strong");
    title.textContent = "No cards found";
    const hint = document.createElement("span");
    hint.textContent = "Try another name or type.";
    empty.append(title, hint);
    elements.cardGrid.append(empty);
  } else {
    const fragment = document.createDocumentFragment();
    cards.forEach((card) => fragment.append(createCardButton(card)));
    elements.cardGrid.append(fragment);
  }

  elements.catalogCount.textContent = `${cards.length} ${cards.length === 1 ? "card" : "cards"} shown`;
  elements.selectedSummary.textContent = `${state.selectedKeys.length} of ${DECK_SIZE} selected`;
}

function createCardButton(card) {
  const isSelected = state.selectedKeys.includes(card.key);
  const button = document.createElement("button");
  button.type = "button";
  button.className = `card-button${isSelected ? " is-selected" : ""}`;
  button.dataset.cardKey = card.key;
  button.setAttribute("aria-pressed", String(isSelected));
  button.setAttribute(
    "aria-label",
    `${isSelected ? "Remove" : "Add"} ${card.name}, ${card.elixir} elixir, ${card.type}`
  );

  const art = document.createElement("span");
  art.className = "card-art";
  const image = document.createElement("img");
  image.src = cardImageUrl(card);
  image.alt = "";
  image.loading = "lazy";
  image.addEventListener("error", () => art.classList.add("has-error"), { once: true });
  const fallback = document.createElement("span");
  fallback.className = "card-art__fallback";
  fallback.textContent = card.name.charAt(0);
  art.append(image, fallback);

  const elixir = document.createElement("span");
  elixir.className = "elixir-badge";
  elixir.textContent = card.elixir;

  const info = document.createElement("span");
  info.className = "card-info";
  const name = document.createElement("strong");
  name.textContent = card.name;
  const meta = document.createElement("span");
  meta.textContent = `${card.rarity} · ${card.type}`;
  info.append(name, meta);
  button.append(art, elixir, info);
  button.addEventListener("click", () => toggleCard(card.key));
  return button;
}

function toggleCard(key) {
  if (state.selectedKeys.includes(key)) {
    state.selectedKeys = state.selectedKeys.filter((selectedKey) => selectedKey !== key);
  } else if (state.selectedKeys.length < DECK_SIZE) {
    state.selectedKeys.push(key);
  } else {
    showToast("Your deck already has 8 cards. Remove one before adding another.");
    return;
  }

  saveDeck(state.selectedKeys);
  render();
}

function selectedCards() {
  return state.selectedKeys
    .map((key) => state.cards.find((card) => card.key === key))
    .filter(Boolean);
}

function renderDeck() {
  const cards = selectedCards();
  elements.deckSlots.replaceChildren();
  for (let index = 0; index < DECK_SIZE; index += 1) {
    const card = cards[index];
    elements.deckSlots.append(card ? createFilledSlot(card) : createEmptySlot(index));
  }
  elements.deckCount.textContent = `${cards.length} / ${DECK_SIZE}`;
  elements.clearDeck.disabled = cards.length === 0;
  elements.shareDeck.disabled = cards.length !== DECK_SIZE;
}

function createEmptySlot(index) {
  const slot = document.createElement("div");
  slot.className = "deck-slot";
  slot.setAttribute("aria-label", `Empty deck slot ${index + 1}`);
  slot.textContent = "+";
  return slot;
}

function createFilledSlot(card) {
  const slot = document.createElement("button");
  slot.type = "button";
  slot.className = "deck-slot";
  slot.setAttribute("aria-label", `Remove ${card.name} from deck`);
  const image = document.createElement("img");
  image.src = cardImageUrl(card);
  image.alt = card.name;
  image.addEventListener("error", () => image.remove(), { once: true });
  const elixir = document.createElement("span");
  elixir.className = "elixir-badge";
  elixir.textContent = card.elixir;
  const remove = document.createElement("span");
  remove.className = "deck-slot__remove";
  remove.setAttribute("aria-hidden", "true");
  remove.textContent = "×";
  slot.append(image, elixir, remove);
  slot.addEventListener("click", () => toggleCard(card.key));
  return slot;
}

function renderAnalysis() {
  const cards = selectedCards();
  const isComplete = cards.length === DECK_SIZE;
  elements.analysisEmpty.hidden = isComplete;
  elements.analysisContent.hidden = !isComplete;

  if (!isComplete) {
    elements.metaMatch.hidden = true;
    setGrade("Pending", "pending");
    const missing = DECK_SIZE - cards.length;
    elements.analysisEmpty.querySelector("strong").textContent =
      `Add ${missing} more ${missing === 1 ? "card" : "cards"} to unlock your report`;
    return;
  }

  const analysis = analyzeDeck(cards);
  setGrade(analysis.grade, analysis.grade.toLocaleLowerCase());
  elements.balanceScore.textContent = `${analysis.score}/100`;
  elements.scoreMeterFill.style.width = `${analysis.score}%`;
  elements.averageElixir.textContent = analysis.averageElixir.toFixed(1);
  elements.airDefenseCount.textContent = analysis.counts.airDefense;
  elements.winConditionCount.textContent = analysis.counts.winConditions;
  elements.spellCount.textContent = analysis.counts.spells;
  elements.archetypeName.textContent = analysis.archetype.name;
  elements.archetypeDescription.textContent = analysis.archetype.description;
  renderMetaMatch(cards);

  renderMetrics(analysis.metrics);
  setCheck(
    elements.airCheck,
    analysis.counts.airDefense >= 2 ? "positive" : analysis.counts.airDefense === 1 ? "warning" : "negative",
    analysis.counts.airDefense >= 2 ? "Reliable air coverage" : "Air coverage needs another reliable answer"
  );
  setCheck(
    elements.winCheck,
    analysis.counts.winConditions >= 1 && analysis.counts.winConditions <= 2 ? "positive" : "negative",
    analysis.counts.winConditions === 0
      ? "No clear win condition detected"
      : analysis.counts.winConditions > 2
        ? "Too many competing win conditions"
        : "Clear path to tower damage"
  );
  setCheck(
    elements.cycleCheck,
    analysis.averageElixir <= 4.5 ? "positive" : "warning",
    analysis.averageElixir <= 3.2
      ? "Fast cycle and flexible rotations"
      : analysis.averageElixir <= 4.5
        ? "Manageable elixir cost"
        : "Heavy deck — avoid overcommitting"
  );

  elements.recommendationList.replaceChildren();
  analysis.recommendations.forEach((recommendation) => {
    const item = document.createElement("li");
    item.textContent = recommendation;
    elements.recommendationList.append(item);
  });
}

function renderMetaMatch(cards) {
  const comparison = compareDeckToMeta(cards, state.proDecks, state.cards);
  elements.metaMatch.hidden = !comparison;
  if (!comparison) return;

  elements.metaSimilarity.textContent = `${comparison.similarity}%`;
  elements.metaDeckName.textContent = comparison.title;
  const shared = comparison.sharedCount
    ? `${comparison.sharedCount} shared ${comparison.sharedCount === 1 ? "card" : "cards"}: ${comparison.sharedCards.join(", ")}.`
    : "No exact cards are shared, but the deck profiles are strategically similar.";
  elements.metaExplanation.textContent = `${shared} Profile match: ${comparison.profileSimilarity}%.`;
}

function renderMetrics(metrics) {
  Object.entries(metrics).forEach(([name, value]) => {
    const valueElement = document.querySelector(`[data-metric-value="${name}"]`);
    const barElement = document.querySelector(`[data-metric-bar="${name}"]`);
    if (valueElement) valueElement.textContent = value;
    if (barElement) barElement.style.width = `${value}%`;
  });
}

function setGrade(label, variant) {
  elements.deckGrade.className = `grade grade--${variant}`;
  elements.deckGrade.textContent = label;
}

function setCheck(element, variant, message) {
  element.className = `check-row is-${variant}`;
  element.textContent = message;
}

function buildSampleDeck() {
  if (!state.cards.length) return;
  const winConditions = shuffle(state.cards.filter((card) => hasRole(card, "winConditions")));
  const airAnswers = shuffle(
    state.cards.filter((card) => hasRole(card, "airDefense") && card.type !== "Spell")
  );
  const spells = shuffle(state.cards.filter((card) => card.type === "Spell"));
  const affordableCards = shuffle(state.cards.filter((card) => card.elixir <= 4 && card.type !== "Spell"));
  const allCards = shuffle(state.cards.filter((card) => card.type !== "Spell"));
  const sample = [];

  addUnique(sample, winConditions[0]);
  airAnswers.forEach((card) => {
    if (sample.filter((item) => hasRole(item, "airDefense")).length < 2) addUnique(sample, card);
  });
  addUnique(sample, spells[0]);
  addUnique(sample, spells.find((card) => card.key !== spells[0]?.key));
  [...affordableCards, ...allCards].forEach((card) => {
    if (sample.length < DECK_SIZE) addUnique(sample, card);
  });

  state.selectedKeys = sample.slice(0, DECK_SIZE).map((card) => card.key);
  saveDeck(state.selectedKeys);
  render();
  showToast("A balanced sample deck was generated. Try changing one card at a time.");
}

function addUnique(collection, card) {
  if (card && !collection.some((item) => item.key === card.key)) collection.push(card);
}

function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy;
}

async function copyDeckLink() {
  const shareUrl = createShareUrl(state.selectedKeys);
  window.history.replaceState({}, "", shareUrl);
  try {
    await navigator.clipboard.writeText(shareUrl);
    showToast("Shareable deck link copied to your clipboard.");
  } catch (error) {
    console.warn("Clipboard access was unavailable.", error);
    showToast("The deck is now encoded in the page URL. Copy it from the address bar.");
  }
}

function showToast(message) {
  clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");
  toastTimer = setTimeout(() => elements.toast.classList.remove("is-visible"), 3200);
}

function configureInstallExperience() {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPrompt = event;
    elements.installApp.hidden = false;
  });

  elements.installApp.addEventListener("click", async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    installPrompt = null;
    elements.installApp.hidden = true;
  });

  window.addEventListener("appinstalled", () => showToast("Royale Deck Analyzer was installed."));
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./service-worker.js").catch((error) => {
        console.warn("Service worker registration failed.", error);
      });
    });
  }
}

elements.cardSearch.addEventListener("input", (event) => {
  state.query = event.target.value.trim();
  renderCatalog();
});
elements.typeFilter.addEventListener("change", (event) => {
  state.type = event.target.value;
  renderCatalog();
});
elements.refreshData.addEventListener("click", () => loadCards(true));
elements.smartDeck.addEventListener("click", buildSampleDeck);
elements.shareDeck.addEventListener("click", copyDeckLink);
elements.clearDeck.addEventListener("click", () => {
  state.selectedKeys = [];
  saveDeck(state.selectedKeys);
  render();
  showToast("Deck cleared.");
});
elements.newsFilters.forEach((button) => {
  button.addEventListener("click", () => {
    state.newsFilter = button.dataset.newsFilter;
    elements.newsFilters.forEach((item) => {
      const active = item === button;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    renderNews();
  });
});

configureInstallExperience();
loadCards();
