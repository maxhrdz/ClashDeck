import test from "node:test";
import assert from "node:assert/strict";
import { classifyNews, parseOfficialNewsArchive } from "../api/news.js";
import { normalizeNews } from "../js/news.js";

const archiveHtml = `
  <div data-test-id="new-hero-card" data-test-class="archived-article">
    <img src="https://clashroyale.inbox.supercell.com/path/hero.jpg" alt="">
    <p data-test-id="publish-date-text">14 Jul 2026</p>
    <a class="archivedArticles_titleLink__abc" href="/en/games/clashroyale/blog/news/new-hero-card/">New Hero &amp; Card</a>
  </div>
  <div data-test-id="ranked-update" data-test-class="archived-article">
    <p data-test-id="publish-date-text">6 Jul 2026</p>
    <a class="archivedArticles_titleLink__abc" href="/en/games/clashroyale/blog/news/ranked-update/">Ranked Tournament Update</a>
  </div>`;

test("parses and categorizes the official Supercell archive", () => {
  const items = parseOfficialNewsArchive(archiveHtml);
  assert.equal(items.length, 2);
  assert.equal(items[0].title, "New Hero & Card");
  assert.equal(items[0].date, "2026-07-14");
  assert.equal(items[0].category, "updates");
  assert.equal(items[0].tag, "New cards");
  assert.match(items[0].url, /supercell\.com\/en\/games/);
  assert.equal(items[1].category, "competitive");
});

test("recognizes common competitive news titles", () => {
  assert.equal(classifyNews("CRL World Finals Qualifier"), "competitive");
  assert.equal(classifyNews("July Balance Changes"), "updates");
});

test("filters malformed browser news payloads", () => {
  const items = normalizeNews({ items: [
    { id: "ok", title: "Official update", url: "https://example.com", category: "updates" },
    { title: "Missing URL", category: "competitive" },
    { title: "Wrong category", url: "https://example.com", category: "rumor" }
  ] });
  assert.equal(items.length, 1);
  assert.equal(items[0].tag, "Update");
});
