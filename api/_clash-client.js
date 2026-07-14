const API_ROOT = "https://proxy.royaleapi.dev/v1";

export class ClashApiError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.name = "ClashApiError";
    this.status = status;
  }
}

export function createClashClient({ token, fetchImpl = fetch, timeoutMs = 7000 }) {
  if (!token) throw new ClashApiError("Clash Royale API token is not configured.", 503);

  return async function request(path) {
    let upstreamResponse;
    try {
      upstreamResponse = await fetchImpl(`${API_ROOT}${path}`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`
        },
        signal: AbortSignal.timeout(timeoutMs)
      });
    } catch (error) {
      throw new ClashApiError(error?.name === "TimeoutError" ? "Official API request timed out." : "Official API is unreachable.");
    }

    if (!upstreamResponse.ok) {
      const safeStatus = upstreamResponse.status >= 400 && upstreamResponse.status < 600
        ? upstreamResponse.status
        : 502;
      throw new ClashApiError("Official API request failed.", safeStatus);
    }

    try {
      return await upstreamResponse.json();
    } catch (error) {
      throw new ClashApiError("Official API returned invalid JSON.");
    }
  };
}
