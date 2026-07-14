import test from "node:test";
import assert from "node:assert/strict";
import { analyzeDeck, classifyArchetype } from "../js/analyzer.js";

const card = (key, elixir, type = "Troop") => ({ key, name: key, elixir, type });

test("rejects incomplete decks", () => {
  assert.throws(() => analyzeDeck([card("hog-rider", 4)]), /exactly 8 cards/);
});

test("scores and classifies a balanced cycle deck", () => {
  const deck = [
    card("hog-rider", 4),
    card("musketeer", 4),
    card("valkyrie", 4),
    card("cannon", 3, "Building"),
    card("fireball", 4, "Spell"),
    card("the-log", 2, "Spell"),
    card("skeletons", 1),
    card("ice-spirit", 1)
  ];

  const analysis = analyzeDeck(deck);
  assert.equal(analysis.archetype.name, "Cycle");
  assert.equal(analysis.counts.winConditions, 1);
  assert.equal(analysis.counts.spells, 2);
  assert.equal(analysis.averageElixir, 2.875);
  assert.equal(analysis.grade, "Good");
  assert.ok(analysis.metrics.cycle > analysis.metrics.offense);
});

test("detects beatdown decks", () => {
  const deck = [
    card("golem", 8),
    card("baby-dragon", 4),
    card("night-witch", 4),
    card("lumberjack", 4),
    card("tornado", 3, "Spell"),
    card("lightning", 6, "Spell"),
    card("mega-minion", 3),
    card("barbarian-barrel", 2, "Spell")
  ];

  assert.equal(analyzeDeck(deck).archetype.name, "Beatdown");
});

test("prioritizes siege and bait archetype signals", () => {
  assert.equal(
    classifyArchetype(3.1, {
      siege: 1,
      bait: 4,
      cycle: 3,
      heavyWinConditions: 0,
      buildings: 1
    }).name,
    "Siege"
  );

  assert.equal(
    classifyArchetype(3.4, {
      siege: 0,
      bait: 3,
      cycle: 1,
      heavyWinConditions: 0,
      buildings: 0
    }).name,
    "Spell Bait"
  );
});

test("recommends missing defensive roles", () => {
  const deck = [
    card("hog-rider", 4),
    card("knight", 3),
    card("bandit", 3),
    card("royal-ghost", 3),
    card("ice-golem", 2),
    card("goblins", 2),
    card("skeletons", 1),
    card("the-log", 2, "Spell")
  ];

  const notes = analyzeDeck(deck).recommendations.join(" ");
  assert.match(notes, /air answers/i);
  assert.match(notes, /splash damage/i);
  assert.match(notes, /high-damage defender/i);
});
