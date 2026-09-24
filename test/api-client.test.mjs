import assert from "node:assert/strict";
import test from "node:test";

import { ApiError, createApiClient, isApiError } from "../src/lib/api-client.ts";

const json = (status, body, headers = {}) =>
  new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });

/** Builds a client whose fetch answers from a queue and records every call. */
function harness({ responses = [], tokens = ["token-1", "token-2"], onSessionDead } = {}) {
  const calls = [];
  const tokenCalls = [];
  const queue = [...responses];
  const client = createApiClient({
    baseUrl: "http://api.test/",
    getAccessToken: async (forceRefresh) => {
      tokenCalls.push(forceRefresh);
      return tokens[tokenCalls.length - 1] ?? null;
    },
    onSessionDead,
    fetch: async (url, init) => {
      calls.push({ url, init });
      const next = queue.shift();
      if (!next) throw new Error("no response queued");
      if (next instanceof Error) throw next;
      return next;
    },
  });
  return { client, calls, tokenCalls };
}

test("sends the bearer token and JSON body, and parses the response", async () => {
  const { client, calls } = harness({ responses: [json(200, { id: "1" })] });

  const result = await client.post("/reports", { reason: "rude" });

  assert.deepEqual(result, { id: "1" });
  assert.equal(calls[0].url, "http://api.test/reports");
  assert.equal(calls[0].init.method, "POST");
  assert.equal(calls[0].init.headers.Authorization, "Bearer token-1");
  assert.equal(calls[0].init.headers["Content-Type"], "application/json");
  assert.equal(calls[0].init.body, JSON.stringify({ reason: "rude" }));
});

test("GET requests carry no body and no content-type", async () => {
  const { client, calls } = harness({ responses: [json(200, [])] });

  await client.get("/events");

  assert.equal(calls[0].init.method, "GET");
  assert.equal(calls[0].init.body, undefined);
  assert.equal("Content-Type" in calls[0].init.headers, false);
});

test("204 resolves to undefined without reading a body", async () => {
  const { client } = harness({ responses: [new Response(null, { status: 204 })] });

  assert.equal(await client.post("/events/1/join"), undefined);
});

test("refreshes the session once and retries after a 401", async () => {
  const { client, calls, tokenCalls } = harness({
    responses: [json(401, { error: { code: "token_expired", message: "expired" } }), json(200, { ok: true })],
  });

  const result = await client.get("/me");

  assert.deepEqual(result, { ok: true });
  assert.deepEqual(tokenCalls, [false, true]);
  assert.equal(calls.length, 2);
  assert.equal(calls[1].init.headers.Authorization, "Bearer token-2");
});

test("a second 401 ends the session and throws", async () => {
  let dead = 0;
  const { client, calls } = harness({
    responses: [
      json(401, { error: { code: "token_expired", message: "expired" } }),
      json(401, { error: { code: "invalid_token", message: "nope" } }),
    ],
    onSessionDead: () => {
      dead++;
    },
  });

  await assert.rejects(client.get("/me"), (error) => {
    assert.ok(isApiError(error));
    assert.equal(error.status, 401);
    assert.equal(error.code, "invalid_token");
    return true;
  });
  assert.equal(dead, 1);
  assert.equal(calls.length, 2);
});

test("without a token nothing is fetched", async () => {
  const { client, calls } = harness({ tokens: [null] });

  await assert.rejects(client.get("/me"), (error) => error.code === "missing_token" && error.status === 401);
  assert.equal(calls.length, 0);
});

test("a failed refresh ends the session", async () => {
  let dead = 0;
  const { client } = harness({
    responses: [json(401, { error: { code: "token_expired", message: "expired" } })],
    tokens: ["token-1", null],
    onSessionDead: () => {
      dead++;
    },
  });

  await assert.rejects(client.get("/me"), (error) => error.code === "missing_token");
  assert.equal(dead, 1);
});

test("maps the error envelope, with details missing", async () => {
  const { client } = harness({ responses: [json(409, { error: { code: "event_full", message: "event full" } })] });

  await assert.rejects(client.post("/events/1/join"), (error) => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.status, 409);
    assert.equal(error.code, "event_full");
    assert.equal(error.message, "event full");
    assert.equal(error.details, undefined);
    assert.equal(error.retryAfter, undefined);
    return true;
  });
});

test("keeps validation details and the Retry-After header", async () => {
  const details = [{ loc: ["body", "rating"], msg: "too big", type: "less_than_equal" }];
  const { client } = harness({
    responses: [
      json(422, { error: { code: "validation_error", message: "invalid", details } }),
      json(429, { error: { code: "rate_limited", message: "slow down" } }, { "Retry-After": "30" }),
    ],
  });

  await assert.rejects(client.put("/events/1/rating", { rating: 9 }), (error) => {
    assert.deepEqual(error.details, details);
    return true;
  });
  await assert.rejects(client.post("/reports", {}), (error) => error.retryAfter === 30);
});

test("falls back when the error body is not JSON", async () => {
  const { client } = harness({
    responses: [new Response("<html>bad gateway</html>", { status: 502, statusText: "Bad Gateway" })],
  });

  await assert.rejects(client.get("/me"), (error) => {
    assert.equal(error.status, 502);
    assert.equal(error.code, "http_error");
    assert.equal(error.message, "Bad Gateway");
    return true;
  });
});

test("network failures become a network_error with the original message", async () => {
  const { client } = harness({ responses: [new TypeError("Network request failed")] });

  await assert.rejects(client.get("/me"), (error) => {
    assert.ok(isApiError(error));
    assert.equal(error.status, 0);
    assert.equal(error.code, "network_error");
    assert.equal(error.message, "Network request failed");
    return true;
  });
});

test("isApiError recognises duck-typed errors", () => {
  assert.ok(isApiError({ name: "ApiError", status: 409, code: "event_full", message: "" }));
  assert.equal(isApiError(new Error("nope")), false);
  assert.equal(isApiError(null), false);
});
