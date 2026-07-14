import { test, expect } from "@playwright/test";

const cards = [
  ["hog-rider", "Hog Rider", 4, "Troop"], ["musketeer", "Musketeer", 4, "Troop"],
  ["valkyrie", "Valkyrie", 4, "Troop"], ["cannon", "Cannon", 3, "Building"],
  ["fireball", "Fireball", 4, "Spell"], ["the-log", "The Log", 2, "Spell"],
  ["ice-wizard", "Ice Wizard", 3, "Troop"], ["goblins", "Goblins", 2, "Troop"],
  ["giant", "Giant", 5, "Troop"], ["baby-dragon", "Baby Dragon", 4, "Troop"],
  ["inferno-dragon", "Inferno Dragon", 4, "Troop"], ["zap", "Zap", 2, "Spell"],
  ["arrows", "Arrows", 3, "Spell"], ["miner", "Miner", 3, "Troop"],
  ["balloon", "Balloon", 5, "Troop"], ["minions", "Minions", 3, "Troop"],
  ["tesla", "Tesla", 4, "Building"], ["poison", "Poison", 4, "Spell"],
  ["knight", "Knight", 3, "Troop"], ["archers", "Archers", 3, "Troop"]
].map(([key, name, elixir, type], index) => ({ key, name, elixir, type, rarity: "Common", id: 26000000 + index }));

test.beforeEach(async ({ page }) => {
  await page.route("**/api/cards*", (route) => route.fulfill({ status: 503, json: { message: "Test fallback" } }));
  await page.route("https://royaleapi.github.io/**", (route) => route.fulfill({ status: 200, json: cards }));
  await page.route("**/api/pro-decks*", (route) => route.fulfill({ status: 503, json: { message: "Test fallback" } }));
  await page.route("**/api/news*", (route) => route.fulfill({ status: 200, json: { items: [
    { id: "update", title: "New Card Update", date: "2026-07-14", category: "updates", tag: "New cards", source: "Clash Royale", url: "https://supercell.com/update" },
    { id: "crl", title: "CRL World Finals", date: "2026-07-13", category: "competitive", tag: "CRL", source: "Clash Royale Esports", url: "https://esports.clashroyale.com/news/finals" }
  ] } }));
});

test("filters official news without mixing update and competitive stories", async ({ page }) => {
  await page.goto("/#news");
  await expect(page.getByText("New Card Update", { exact: true })).toBeVisible();
  await expect(page.getByText("CRL World Finals", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Competitive", exact: true }).click();
  await expect(page.getByText("CRL World Finals", { exact: true })).toBeVisible();
  await expect(page.getByText("New Card Update", { exact: true })).toBeHidden();

  await page.getByRole("button", { name: "New cards & updates", exact: true }).click();
  await expect(page.getByText("New Card Update", { exact: true })).toBeVisible();
  await expect(page.getByText("CRL World Finals", { exact: true })).toBeHidden();
});

test("loads a featured deck and exposes a complete explainable report", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Featured archetypes", { exact: true })).toBeVisible();

  const hogCard = page.locator(".pro-deck-card").filter({ hasText: "Hog Control" });
  await hogCard.getByRole("button", { name: "USE DECK" }).click();

  await expect(page.locator("#deck-count")).toHaveText("8 / 8");
  await expect(page.locator("#analysis-empty")).toBeHidden();
  await expect(page.locator("#analysis-content")).toBeVisible();
  await expect(page.locator("#meta-match")).toBeVisible();
  await expect(page.locator("#meta-deck-name")).toHaveText("Hog Control");
  await expect(page.locator("#meta-similarity")).toHaveText("100%");
});

test("restores a shared deck without showing the incomplete-state message", async ({ page }) => {
  const deck = cards.slice(0, 8).map((card) => card.key).join(",");
  await page.goto(`/?deck=${encodeURIComponent(deck)}`);

  await expect(page.locator("#deck-count")).toHaveText("8 / 8");
  await expect(page.locator("#analysis-empty")).toBeHidden();
  await expect(page.locator("#analysis-content")).toBeVisible();
  await expect(page.locator("#deck-grade")).not.toHaveText("Pending");
});
