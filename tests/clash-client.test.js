import test from "node:test";
import assert from "node:assert/strict";
import { ClashApiError, createClashClient } from "../api/_clash-client.js";

test("server client sends the private token only in the authorization header", async () => {
  let request;
  const fetchImpl = async (url, options) => {
    request = { url, options };
    return { ok: true, status: 200, json: async () => ({ items: [] }) };
  };

  const client = createClashClient({ token: "private-token", fetchImpl });
  assert.deepEqual(await client("/cards"), { items: [] });
  assert.equal(request.url, "https://proxy.royaleapi.dev/v1/cards");
  assert.equal(request.options.headers.Authorization, "Bearer private-token");
  assert.equal(request.url.includes("private-token"), false);
  assert.ok(request.options.signal instanceof AbortSignal);
});

test("server client maps upstream failures to safe typed errors", async () => {
  const fetchImpl = async () => ({ ok: false, status: 429 });
  const client = createClashClient({ token: "token", fetchImpl });
  await assert.rejects(client("/cards"), (error) => error instanceof ClashApiError && error.status === 429);
});

test("server client rejects missing configuration before making a request", () => {
  assert.throws(() => createClashClient({ token: "" }), (error) => error instanceof ClashApiError && error.status === 503);
});
