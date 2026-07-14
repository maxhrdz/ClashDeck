import test from "node:test";
import assert from "node:assert/strict";
import { compareDeckToMeta } from "../js/meta-analysis.js";

const card = (key, elixir, type = "Troop") => ({ key, name: key, elixir, type });
const catalog = [
  card("hog-rider", 4), card("musketeer", 4), card("valkyrie", 4), card("cannon", 3, "Building"),
  card("fireball", 4, "Spell"), card("the-log", 2, "Spell"), card("skeletons", 1), card("ice-spirit", 1),
  card("giant", 5), card("baby-dragon", 4), card("inferno-dragon", 4), card("zap", 2, "Spell"),
  card("arrows", 3, "Spell"), card("goblins", 2), card("archers", 3)
];

test("finds the closest reference using cards and strategic profile", () => {
  const selected = catalog.slice(0, 8);
  const references = [
    { title: "Giant", subtitle: "Reference", cards: ["giant", "baby-dragon", "inferno-dragon", "musketeer", "valkyrie", "zap", "arrows", "goblins"] },
    { title: "Hog Cycle", subtitle: "Reference", cards: selected.map((item) => item.key) }
  ];

  const match = compareDeckToMeta(selected, references, catalog);
  assert.equal(match.title, "Hog Cycle");
  assert.equal(match.similarity, 100);
  assert.equal(match.sharedCount, 8);
  assert.equal(match.profileSimilarity, 100);
});

test("ignores references that cannot be resolved against the catalog", () => {
  const selected = catalog.slice(0, 8);
  const match = compareDeckToMeta(selected, [{ title: "Unknown", cards: ["missing"] }], catalog);
  assert.equal(match, null);
});
