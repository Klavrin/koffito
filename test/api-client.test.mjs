import assert from "node:assert/strict";
import test from "node:test";

import { ApiError, createApiClient, errorMessage } from "../src/lib/api-client.ts";

const jsonResponse = (status, body) =>
  new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

function fakeFetch(handler) {
  const calls = [];
  const impl = async (url, init) => {
    calls.push({ url, init });
    return handler(url, init, calls.length);
  };
  return { impl, calls };
}

test("every request carries the bearer token and hits the HTTPS base URL", async () => {
  const { impl, calls } = fakeFetch(() => jsonResponse(200, { ok: true }));
  const client = createApiClient({
    baseUrl: "https://api.koffito.test/",
    getAccessToken: async () => "token-1",
    refreshSession: async () => null,
    fetch: impl,
  });

  const result = await client.post("/events/e1/join", { hello: "world" });

  assert.deepEqual(result, { ok: true });
  assert.equal(calls[0].url, "https://api.koffito.test/events/e1/join");
  assert.equal(calls[0].init.headers.Authorization, "Bearer token-1");
  assert.equal(calls[0].init.headers["Content-Type"], "application/json");
  assert.equal(calls[0].init.body, JSON.stringify({ hello: "world" }));
});

test("a 401 refreshes the session once and retries with the new token", async () => {
  const { impl, calls } = fakeFetch((_url, init) =>
    init.headers.Authorization === "Bearer fresh" ? jsonResponse(200, { me: true }) : jsonResponse(401, { detail: "expired" }),
  );
  let token = "stale";
  let refreshes = 0;
  const client = createApiClient({
    baseUrl: "https://api.koffito.test",
    getAccessToken: async () => token,
    refreshSession: async () => {
      refreshes += 1;
      token = "fresh";
      return token;
    },
    fetch: impl,
  });

  const result = await client.get("/me");

  assert.deepEqual(result, { me: true });
  assert.equal(refreshes, 1);
  assert.equal(calls.length, 2);
  assert.equal(calls[1].init.headers.Authorization, "Bearer fresh");
});

test("a 401 after a failed refresh is surfaced, not retried forever", async () => {
  const { impl, calls } = fakeFetch(() => jsonResponse(401, { detail: "nope" }));
  const client = createApiClient({
    baseUrl: "https://api.koffito.test",
    getAccessToken: async () => "stale",
    refreshSession: async () => null,
    fetch: impl,
  });

  await assert.rejects(client.get("/me"), (error) => error instanceof ApiError && error.status === 401);
  assert.equal(calls.length, 1);
});

test("concurrent 401s share a single refresh", async () => {
  let refreshes = 0;
  let token = "stale";
  const { impl } = fakeFetch((_url, init) =>
    init.headers.Authorization === "Bearer fresh" ? jsonResponse(200, []) : jsonResponse(401),
  );
  const client = createApiClient({
    baseUrl: "https://api.koffito.test",
    getAccessToken: async () => token,
    refreshSession: async () => {
      refreshes += 1;
      await new Promise((resolve) => setTimeout(resolve, 5));
      token = "fresh";
      return token;
    },
    fetch: impl,
  });

  await Promise.all([client.get("/events"), client.get("/events/open"), client.get("/venues/visited")]);
  assert.equal(refreshes, 1);
});

test("server errors become friendly ApiErrors", async () => {
  const { impl } = fakeFetch(() => jsonResponse(409, { detail: "This coffee talk is full." }));
  const client = createApiClient({
    baseUrl: "https://api.koffito.test",
    getAccessToken: async () => "token",
    refreshSession: async () => null,
    fetch: impl,
  });

  await assert.rejects(client.post("/events/e1/join"), (error) => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.status, 409);
    assert.equal(errorMessage(error), "This coffee talk is full.");
    return true;
  });
});

test("plain HTTP is refused unless explicitly allowed for dev builds", () => {
  const options = {
    baseUrl: "http://localhost:8000",
    getAccessToken: async () => "t",
    refreshSession: async () => null,
  };
  assert.throws(() => createApiClient(options), /HTTPS/);
  assert.ok(createApiClient({ ...options, allowInsecure: true }));
});

test("signed-out requests fail before touching the network", async () => {
  const { impl, calls } = fakeFetch(() => jsonResponse(200, {}));
  const client = createApiClient({
    baseUrl: "https://api.koffito.test",
    getAccessToken: async () => null,
    refreshSession: async () => null,
    fetch: impl,
  });
  await assert.rejects(client.get("/me"), (error) => error instanceof ApiError && error.status === 401);
  assert.equal(calls.length, 0);
});
