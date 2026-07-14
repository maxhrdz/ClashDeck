import test from "node:test";
import assert from "node:assert/strict";
import { inferCardType, normalizeCard, slugify } from "../js/api.js";

test("normalizes official API card fields", () => {
  const normalized = normalizeCard({
    id: 28000000,
    name: "Fireball",
    elixirCost: 4,
    rarity: "rare",
    iconUrls: { medium: "https://example.com/fireball.png" }
  });

  assert.equal(normalized.key, "fireball");
  assert.equal(normalized.type, "Spell");
  assert.equal(normalized.elixir, 4);
  assert.equal(normalized.imageUrl, "https://example.com/fireball.png");
});

test("creates stable slugs and infers card types", () => {
  assert.equal(slugify("P.E.K.K.A"), "p-e-k-k-a");
  assert.equal(inferCardType(27000000), "Building");
  assert.equal(inferCardType(26000000), "Troop");
});
