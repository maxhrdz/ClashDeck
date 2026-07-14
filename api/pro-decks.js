import { ClashApiError, createClashClient } from "./_clash-client.js";

const TOP_PLAYER_LIMIT = 8;
const DECK_LIMIT = 4;

function deckFromBattle(player, battle) {
  const participant = [...(battle.team || []), ...(battle.opponent || [])]
    .find((member) => member.tag === player.tag);
  if (!participant || !Array.isArray(participant.cards) || participant.cards.length !== 8) return null;

  return {
    playerName: player.name,
    playerTag: player.tag,
    rank: player.rank,
    trophies: player.trophies,
    cards: participant.cards.map((card) => ({
      id: card.id,
      name: card.name,
      elixirCost: card.elixirCost,
      iconUrls: card.iconUrls
    }))
  };
}

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ message: "Method not allowed" });
  }

  const token = process.env.CLASH_ROYALE_API_TOKEN;
  if (!token) {
    return response.status(503).json({ message: "Top ladder data is not configured." });
  }

  try {
    const requestOfficial = createClashClient({ token });
    const ranking = await requestOfficial(`/locations/global/rankings/players?limit=${TOP_PLAYER_LIMIT}`);
    const players = Array.isArray(ranking.items) ? ranking.items : [];
    const results = await Promise.allSettled(
      players.map(async (player) => {
        const tag = encodeURIComponent(player.tag);
        const battles = await requestOfficial(`/players/${tag}/battlelog`);
        const battle = Array.isArray(battles)
          ? battles.find((entry) => [...(entry.team || []), ...(entry.opponent || [])]
            .some((member) => member.tag === player.tag && member.cards?.length === 8))
          : null;
        return battle ? deckFromBattle(player, battle) : null;
      })
    );

    const seen = new Set();
    const items = results
      .filter((result) => result.status === "fulfilled" && result.value)
      .map((result) => result.value)
      .filter((deck) => {
        const signature = deck.cards.map((card) => card.id).sort().join("-");
        if (seen.has(signature)) return false;
        seen.add(signature);
        return true;
      })
      .slice(0, DECK_LIMIT);

    if (!items.length) return response.status(502).json({ message: "No complete top ladder decks were available." });
    response.setHeader("Cache-Control", "s-maxage=1800, stale-while-revalidate=21600");
    return response.status(200).json({ items, updatedAt: new Date().toISOString() });
  } catch (error) {
    console.error("Unable to load top ladder decks.", error);
    const status = error instanceof ClashApiError ? error.status : 502;
    return response.status(status).json({ message: "Unable to load top ladder decks." });
  }
}
