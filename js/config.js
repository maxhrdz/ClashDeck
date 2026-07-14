export const DATA_CONFIG = Object.freeze({
  officialApiProxyUrl: "/api/cards",
  communityDataUrl: "https://royaleapi.github.io/cr-api-data/json/cards.json",
  imageBaseUrl: "https://cdn.royaleapi.com/static/img/cards-150"
});

export const ROLE_KEYS = Object.freeze({
  winConditions: [
    "balloon", "battle-ram", "electro-giant", "elixir-golem", "giant",
    "goblin-barrel", "goblin-drill", "goblin-giant", "golem", "graveyard",
    "hog-rider", "lava-hound", "miner", "mortar", "ram-rider", "royal-giant",
    "royal-hogs", "skeleton-barrel", "three-musketeers", "wall-breakers", "x-bow"
  ],
  airDefense: [
    "archer-queen", "archers", "arrows", "baby-dragon", "bats", "dart-goblin",
    "electro-dragon", "electro-wizard", "executioner", "fireball", "firecracker",
    "flying-machine", "freeze", "giant-snowball", "goblin-gang", "goblin-hut",
    "hunter", "ice-wizard", "inferno-dragon", "inferno-tower", "lightning",
    "little-prince", "magic-archer", "mega-minion", "minion-horde", "minions",
    "mother-witch", "musketeer", "phoenix", "poison", "princess", "rocket",
    "royal-delivery", "skeleton-dragons", "spear-goblins", "tesla",
    "three-musketeers", "tornado", "witch", "wizard", "zap", "zappies"
  ],
  splash: [
    "arrows", "baby-dragon", "bomber", "bomb-tower", "bowler", "dark-prince",
    "executioner", "fireball", "firecracker", "giant-snowball", "mega-knight",
    "poison", "princess", "rocket", "royal-delivery", "tornado", "valkyrie",
    "witch", "wizard"
  ],
  tankKillers: [
    "hunter", "inferno-dragon", "inferno-tower", "lumberjack", "mighty-miner",
    "mini-pekka", "pekka", "prince", "sparky"
  ],
  cycle: [
    "bats", "electro-spirit", "fire-spirit", "goblins", "heal-spirit",
    "ice-golem", "ice-spirit", "skeletons", "spear-goblins"
  ],
  bait: [
    "dart-goblin", "goblin-barrel", "goblin-gang", "princess",
    "skeleton-barrel", "wall-breakers"
  ],
  siege: ["mortar", "x-bow"],
  heavyWinConditions: [
    "electro-giant", "giant", "goblin-giant", "golem", "lava-hound", "royal-giant"
  ]
});

export const FALLBACK_CARDS = [
  { key: "knight", name: "Knight", elixir: 3, type: "Troop", rarity: "Common" },
  { key: "archers", name: "Archers", elixir: 3, type: "Troop", rarity: "Common" },
  { key: "goblins", name: "Goblins", elixir: 2, type: "Troop", rarity: "Common" },
  { key: "giant", name: "Giant", elixir: 5, type: "Troop", rarity: "Rare" },
  { key: "pekka", name: "P.E.K.K.A", elixir: 7, type: "Troop", rarity: "Epic" },
  { key: "minions", name: "Minions", elixir: 3, type: "Troop", rarity: "Common" },
  { key: "balloon", name: "Balloon", elixir: 5, type: "Troop", rarity: "Epic" },
  { key: "valkyrie", name: "Valkyrie", elixir: 4, type: "Troop", rarity: "Rare" },
  { key: "musketeer", name: "Musketeer", elixir: 4, type: "Troop", rarity: "Rare" },
  { key: "baby-dragon", name: "Baby Dragon", elixir: 4, type: "Troop", rarity: "Epic" },
  { key: "wizard", name: "Wizard", elixir: 5, type: "Troop", rarity: "Rare" },
  { key: "hog-rider", name: "Hog Rider", elixir: 4, type: "Troop", rarity: "Rare" },
  { key: "ice-wizard", name: "Ice Wizard", elixir: 3, type: "Troop", rarity: "Legendary" },
  { key: "royal-giant", name: "Royal Giant", elixir: 6, type: "Troop", rarity: "Common" },
  { key: "princess", name: "Princess", elixir: 3, type: "Troop", rarity: "Legendary" },
  { key: "miner", name: "Miner", elixir: 3, type: "Troop", rarity: "Legendary" },
  { key: "inferno-dragon", name: "Inferno Dragon", elixir: 4, type: "Troop", rarity: "Legendary" },
  { key: "electro-wizard", name: "Electro Wizard", elixir: 4, type: "Troop", rarity: "Legendary" },
  { key: "firecracker", name: "Firecracker", elixir: 3, type: "Troop", rarity: "Common" },
  { key: "cannon", name: "Cannon", elixir: 3, type: "Building", rarity: "Common" },
  { key: "tesla", name: "Tesla", elixir: 4, type: "Building", rarity: "Common" },
  { key: "inferno-tower", name: "Inferno Tower", elixir: 5, type: "Building", rarity: "Rare" },
  { key: "fireball", name: "Fireball", elixir: 4, type: "Spell", rarity: "Rare" },
  { key: "arrows", name: "Arrows", elixir: 3, type: "Spell", rarity: "Common" },
  { key: "zap", name: "Zap", elixir: 2, type: "Spell", rarity: "Common" },
  { key: "poison", name: "Poison", elixir: 4, type: "Spell", rarity: "Epic" },
  { key: "the-log", name: "The Log", elixir: 2, type: "Spell", rarity: "Legendary" },
  { key: "tornado", name: "Tornado", elixir: 3, type: "Spell", rarity: "Epic" }
];
