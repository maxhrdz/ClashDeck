import test from "node:test";
import assert from "node:assert/strict";
import { createShareUrl, parseDeckParam } from "../js/deck-storage.js";

test("parses, deduplicates, and limits shared deck keys", () => {
  const keys = parseDeckParam(
    "?deck=hog-rider,musketeer,hog-rider,cannon,fireball,the-log,skeletons,ice-spirit,knight,valkyrie"
  );

  assert.deepEqual(keys, [
    "hog-rider",
    "musketeer",
    "cannon",
    "fireball",
    "the-log",
    "skeletons",
    "ice-spirit",
    "knight"
  ]);
});

test("creates a portable deck URL", () => {
  const url = createShareUrl(
    ["hog-rider", "musketeer", "fireball"],
    "https://example.com/analyzer?source=cv#old"
  );

  const parsed = new URL(url);
  assert.equal(parsed.searchParams.get("source"), "cv");
  assert.equal(parsed.searchParams.get("deck"), "hog-rider,musketeer,fireball");
  assert.equal(parsed.hash, "#main-content");
});
