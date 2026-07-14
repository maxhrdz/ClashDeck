import test from "node:test";
import assert from "node:assert/strict";
import { normalizeProDecks, resolveDeckKeys } from "../js/pro-decks.js";

test("normalizes complete live decks and ignores incomplete ones", () => {
  const result = normalizeProDecks({
    items: [
      {
        playerName: "Arena Pro",
        rank: 4,
        trophies: 3000,
        cards: ["A", "B", "C", "D", "E", "F", "G", "H"].map((name) => ({ name }))
      },
      { playerName: "Incomplete", cards: [{ name: "Knight" }] }
    ]
  });

  assert.equal(result.length, 1);
  assert.equal(result[0].title, "Arena Pro");
  assert.equal(result[0].subtitle, "Global rank #4");
  assert.deepEqual(result[0].cards, ["a", "b", "c", "d", "e", "f", "g", "h"]);
});

test("resolves only cards available in the current catalog", () => {
  const deck = { cards: ["knight", "archers", "missing"] };
  const catalog = [{ key: "knight" }, { key: "archers" }];
  assert.deepEqual(resolveDeckKeys(deck, catalog), ["knight", "archers"]);
});
