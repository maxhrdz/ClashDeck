import { ClashApiError, createClashClient } from "./_clash-client.js";

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ message: "Method not allowed" });
  }

  const token = process.env.CLASH_ROYALE_API_TOKEN;
  if (!token) {
    return response.status(503).json({
      message: "Official card data is not configured. The client will use its fallback source."
    });
  }

  try {
    const requestOfficial = createClashClient({ token });
    const data = await requestOfficial("/cards");
    response.setHeader(
      "Cache-Control",
      "s-maxage=3600, stale-while-revalidate=86400"
    );
    return response.status(200).json(data);
  } catch (error) {
    console.error("Unable to reach the Clash Royale API.", error);
    const status = error instanceof ClashApiError ? error.status : 502;
    return response.status(status).json({ message: "Unable to load official card data." });
  }
}
