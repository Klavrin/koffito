/**
 * HTTP client for the Koffito API. Pure (no React Native, no path aliases) so it can be unit
 * tested in Node; `src/lib/api.ts` wires it to the Supabase session.
 *
 * Every request carries the Supabase access token. A `401` refreshes the session once and
 * retries; if the refreshed token is rejected too, the session is dead and `onSessionDead` runs.
 */

export type ApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/** An error response from the API. `code` is stable and what the UI should switch on. */
export class ApiError extends Error {
  override readonly name = "ApiError";
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;
  /** Seconds to wait, from the `Retry-After` header on `429`. */
  readonly retryAfter?: number;

  constructor(status: number, code: string, message: string, details?: unknown, retryAfter?: number) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    this.retryAfter = retryAfter;
  }
}

/** Duck-typed so it also matches an `ApiError` that crossed a bundle boundary. */
export const isApiError = (error: unknown): error is ApiError =>
  error instanceof ApiError ||
  (!!error && typeof error === "object" && (error as { name?: unknown }).name === "ApiError");

export type ApiClientOptions = {
  /** Base URL of the API, with or without a trailing slash. */
  baseUrl: string;
  /** The current access token; `forceRefresh` asks for a freshly refreshed session. */
  getAccessToken: (forceRefresh: boolean) => Promise<string | null>;
  /** Called once when even a refreshed token is rejected (or the refresh fails). */
  onSessionDead?: () => void | Promise<void>;
  /** Injectable for tests. */
  fetch?: typeof fetch;
};

export type ApiClient = {
  request<T>(method: ApiMethod, path: string, body?: unknown): Promise<T>;
  get<T>(path: string): Promise<T>;
  post<T = void>(path: string, body?: unknown): Promise<T>;
  put<T>(path: string, body: unknown): Promise<T>;
  patch<T>(path: string, body: unknown): Promise<T>;
  delete<T = void>(path: string): Promise<T>;
};

type ErrorEnvelope = { error?: { code?: unknown; message?: unknown; details?: unknown } };

export function createApiClient(options: ApiClientOptions): ApiClient {
  const baseUrl = options.baseUrl.replace(/\/+$/, "");
  const doFetch = options.fetch ?? ((input, init) => fetch(input, init));

  const sessionDead = async () => {
    await options.onSessionDead?.();
  };

  async function attempt<T>(method: ApiMethod, path: string, body: unknown, retried: boolean): Promise<T> {
    const token = await options.getAccessToken(retried);
    if (!token) {
      if (retried) await sessionDead();
      throw new ApiError(401, "missing_token", "Not signed in");
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    };
    if (body !== undefined) headers["Content-Type"] = "application/json";

    let response: Response;
    try {
      response = await doFetch(`${baseUrl}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new ApiError(0, "network_error", message);
    }

    if (response.status === 204) return undefined as T;

    if (response.status === 401 && !retried) {
      return attempt<T>(method, path, body, true);
    }
    if (response.status === 401) await sessionDead();

    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      const envelope = (payload as ErrorEnvelope | null)?.error ?? {};
      const code = typeof envelope.code === "string" ? envelope.code : "http_error";
      const message =
        typeof envelope.message === "string" ? envelope.message : response.statusText || `HTTP ${response.status}`;
      const retryAfter = Number(response.headers.get("Retry-After")) || undefined;
      throw new ApiError(response.status, code, message, envelope.details, retryAfter);
    }

    return payload as T;
  }

  const request = <T>(method: ApiMethod, path: string, body?: unknown) => attempt<T>(method, path, body, false);

  return {
    request,
    get: (path) => request("GET", path),
    post: (path, body) => request("POST", path, body),
    put: (path, body) => request("PUT", path, body),
    patch: (path, body) => request("PATCH", path, body),
    delete: (path) => request("DELETE", path),
  };
}
