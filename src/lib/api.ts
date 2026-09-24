import { createApiClient } from "./api-client";
import { supabase } from "./supabase";

export { ApiError, isApiError } from "./api-client";

const apiUrl = process.env.EXPO_PUBLIC_API_URL;

if (!apiUrl) {
  throw new Error("Missing EXPO_PUBLIC_API_URL in the environment.");
}

/**
 * The Koffito API, authenticated with the Supabase session. Every data request goes through
 * here; on a 401 the session is refreshed once and the request retried, and if that fails too
 * the user is signed out.
 */
export const api = createApiClient({
  baseUrl: apiUrl,
  getAccessToken: async (forceRefresh) => {
    if (forceRefresh) {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) return null;
      return data.session?.access_token ?? null;
    }

    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  },
  onSessionDead: async () => {
    await supabase.auth.signOut();
  },
});
