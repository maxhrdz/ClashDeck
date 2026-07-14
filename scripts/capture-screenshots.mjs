import { chromium } from "@playwright/test";

const baseUrl = process.env.APP_URL || "http://127.0.0.1:8080";
const deck = [
  "giant", "bats", "minion-horde", "earthquake",
  "clone", "terry", "inferno-dragon", "battle-healer"
].join(",");

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  serviceWorkers: "block"
});
const page = await context.newPage();

try {
  await page.goto(`${baseUrl}/?deck=${encodeURIComponent(deck)}`, { waitUntil: "networkidle" });
  await page.locator("#deck-count").waitFor({ state: "visible" });
  await page.locator(".news-card").first().waitFor({ state: "visible" });

  await page.locator(".site-header").screenshot({ path: "assets/screenshots/royale-lab-hero.png" });
  await page.locator(".analysis-panel").screenshot({ path: "assets/screenshots/deck-analysis.png" });
  await page.locator("#news").screenshot({ path: "assets/screenshots/royale-news.png" });
} finally {
  await browser.close();
}
