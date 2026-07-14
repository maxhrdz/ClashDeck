import { ROLE_KEYS } from "./config.js";

export const DECK_SIZE = 8;

const roleSets = Object.fromEntries(
  Object.entries(ROLE_KEYS).map(([role, keys]) => [role, new Set(keys)])
);

export function hasRole(card, role) {
  return roleSets[role]?.has(card.key) || false;
}

export function analyzeDeck(cards) {
  if (!Array.isArray(cards) || cards.length !== DECK_SIZE) {
    throw new Error(`A complete deck must contain exactly ${DECK_SIZE} cards.`);
  }

  const averageElixir = cards.reduce((total, card) => total + card.elixir, 0) / DECK_SIZE;
  const counts = {
    airDefense: countRole(cards, "airDefense"),
    winConditions: countRole(cards, "winConditions"),
    splash: countRole(cards, "splash"),
    tankKillers: countRole(cards, "tankKillers"),
    cycle: countRole(cards, "cycle"),
    bait: countRole(cards, "bait"),
    siege: countRole(cards, "siege"),
    heavyWinConditions: countRole(cards, "heavyWinConditions"),
    spells: cards.filter((card) => card.type === "Spell").length,
    buildings: cards.filter((card) => card.type === "Building").length,
    troops: cards.filter((card) => card.type === "Troop").length
  };

  const score = calculateScore(averageElixir, counts);
  const grade = score >= 80 ? "Good" : score >= 55 ? "Regular" : "Weak";
  const archetype = classifyArchetype(averageElixir, counts);
  const metrics = calculateMetrics(averageElixir, counts, cards);

  return {
    averageElixir,
    counts,
    score,
    grade,
    archetype,
    metrics,
    recommendations: buildRecommendations({ averageElixir, counts, grade, archetype })
  };
}

export function classifyArchetype(averageElixir, counts) {
  if (counts.siege > 0) {
    return {
      name: "Siege",
      description: "Wins from your side of the arena with long-range building pressure."
    };
  }
  if (counts.bait >= 3) {
    return {
      name: "Spell Bait",
      description: "Overloads small-spell answers to create openings for chip damage."
    };
  }
  if (averageElixir <= 3.2 && counts.cycle >= 2) {
    return {
      name: "Cycle",
      description: "Uses cheap rotations to return to key cards faster than the opponent."
    };
  }
  if (counts.heavyWinConditions > 0 && averageElixir >= 3.8) {
    return {
      name: "Beatdown",
      description: "Builds high-value pushes behind a durable primary threat."
    };
  }
  if (counts.buildings >= 1 && averageElixir <= 3.9) {
    return {
      name: "Control",
      description: "Defends efficiently, then converts surviving units into counterpressure."
    };
  }
  return {
    name: "Hybrid",
    description: "Mixes pressure and defense without matching a single dominant archetype."
  };
}

function countRole(cards, role) {
  return cards.filter((card) => hasRole(card, role)).length;
}

function calculateScore(averageElixir, counts) {
  let score = 0;
  score += counts.winConditions >= 1 && counts.winConditions <= 2 ? 25 : counts.winConditions > 2 ? 12 : 0;
  score += counts.airDefense >= 2 ? 20 : counts.airDefense === 1 ? 10 : 0;
  score += counts.spells >= 1 && counts.spells <= 3 ? 15 : counts.spells === 4 ? 8 : 0;
  score += averageElixir >= 2.5 && averageElixir <= 4.5 ? 15 : 7;
  score += counts.splash >= 1 ? 8 : 0;
  score += counts.tankKillers >= 1 ? 7 : 0;
  score += counts.buildings <= 2 ? 10 : 4;
  return Math.min(100, score);
}

function calculateMetrics(averageElixir, counts, cards) {
  const uniqueTypes = new Set(cards.map((card) => card.type)).size;
  return {
    offense: clamp(35 + counts.winConditions * 22 + counts.spells * 6, 0, 100),
    defense: clamp(
      counts.airDefense * 12 + counts.splash * 10 + counts.tankKillers * 14 + counts.buildings * 9,
      0,
      100
    ),
    cycle: clamp(Math.round(145 - averageElixir * 22), 15, 100),
    versatility: clamp(uniqueTypes * 18 + counts.spells * 7 + counts.airDefense * 6, 0, 100)
  };
}

function buildRecommendations({ averageElixir, counts, archetype }) {
  const notes = [];

  if (counts.winConditions === 0) {
    notes.push("Add a clear win condition such as Hog Rider, Giant, Balloon, Miner, or Goblin Barrel.");
  } else if (counts.winConditions > 2) {
    notes.push("Focus on one or two win conditions and use the remaining slots for support and defense.");
  }
  if (counts.airDefense < 2) {
    notes.push("Carry at least two reliable air answers so one bad rotation does not leave you exposed.");
  }
  if (counts.spells === 0) {
    notes.push("Include a spell to clear swarms or finish a damaged tower.");
  } else if (counts.spells > 3) {
    notes.push("Replace a spell with a troop so the deck can defend and counterpush consistently.");
  }
  if (counts.splash === 0) {
    notes.push("Add splash damage to avoid being overwhelmed by swarm-based decks.");
  }
  if (counts.tankKillers === 0) {
    notes.push("Add a high-damage defender for Giants, Golems, and other tanks.");
  }
  if (averageElixir > 4.5) {
    notes.push("Lower the average elixir with cheap cycle cards to improve your rotations.");
  } else if (averageElixir < 2.5) {
    notes.push("The cycle is extremely light; verify that it has enough stopping power for heavy pushes.");
  }
  if (counts.buildings > 2) {
    notes.push("More than two buildings can make your offense too passive. Replace one with flexible support.");
  }

  if (!notes.length) {
    notes.push(`${archetype.name} fundamentals are covered. Test matchups and change one card at a time.`);
    notes.push("Track the card that most often feels awkward in hand; it is usually the best slot to refine.");
  }
  return notes;
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}
