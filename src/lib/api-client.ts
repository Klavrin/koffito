/**
 * Minimal JSON client for the Koffito API.
 *
 * - every request carries `Authorization: Bearer <access_token>`;
 * - the base URL must be HTTPS (plain HTTP is only tolerated in dev builds);
 * - on a 401 the session is refreshed once and the request retried.
 *
 * Kept free of app imports so it can be unit tested in Node.
 */

export type ApiClientOptions = {
  baseUrl: string;
  /** Current Supabase access token, or null when signed out. */
  getAccessToken: () => Promise<string | null>;
  /** Refreshes the Supabase session; resolves to the new access token or null. */
  refreshSession: () => Promise<string | null>;
  fetch?: typeof fetch;
  /** Dev builds may point at http://localhost; production must be HTTPS. */
  allowInsecure?: boolean;
};

export type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
};

export class ApiError extends Error {
  readonly status: number;
  readonly detail: unknown;

  constructor(status: number, message: string, detail?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

const friendlyMessages: Record<number, string> = {
  401: "Please log in again.",
  403: "You can't do that.",
  404: "We couldn't find that.",
  429: "Slow down a little and try again.",
};

async function toApiError(response: Response) {
  let detail: unknown;
  try {
    detail = await response.json();
  } catch {
    detail = undefined;
  }
  const message =
    (typeof detail === "object" && detail && typeof (detail as { detail?: unknown }).detail === "string"
      ? (detail as { detail: string }).detail
      : undefined) ??
    friendlyMessages[response.status] ??
    "Something went wrong. Let's try that again.";
  return new ApiError(response.status, message, detail);
}

export function isSecureBaseUrl(baseUrl: string) {
  return /^https:\/\//i.test(baseUrl);
}

export function createApiClient(options: ApiClientOptions) {
  const baseUrl = options.baseUrl.replace(/\/+$/, "");
  const fetchImpl = options.fetch ?? fetch;

  if (!isSecureBaseUrl(baseUrl) && !options.allowInsecure) {
    throw new Error(`The Koffito API must be reached over HTTPS, got "${baseUrl}".`);
  }

  // Several requests can hit a 401 at once; refresh only once for all of them.
  let refreshing: Promise<string | null> | null = null;
  const refreshOnce = () => {
    refreshing ??= options.refreshSession().finally(() => {
      refreshing = null;
    });
    return refreshing;
  };

  async function request<T>(path: string, init: RequestOptions = {}, retried = false): Promise<T> {
    const token = await options.getAccessToken();
    if (!token) throw new ApiError(401, friendlyMessages[401]);

    const headers: Record<string, string> = {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    };
    if (init.body !== undefined) headers["Content-Type"] = "application/json";

    const response = await fetchImpl(`${baseUrl}${path}`, {
      method: init.method ?? "GET",
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal: init.signal,
    });

    if (response.status === 401 && !retried) {
      const fresh = await refreshOnce();
      if (fresh) return request<T>(path, init, true);
    }
    if (!response.ok) throw await toApiError(response);
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  }

  return {
    get: <T>(path: string, signal?: AbortSignal) => request<T>(path, { signal }),
    post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body }),
    put: <T>(path: string, body?: unknown) => request<T>(path, { method: "PUT", body }),
    patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body }),
    delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;

/** Message to show in a toast for any thrown value. */
export function errorMessage(error: unknown, fallback = "Something went wrong. Let's try that again.") {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
