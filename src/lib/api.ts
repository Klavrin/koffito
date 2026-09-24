import { createApiClient } from "./api-client";
import { supabase } from "./supabase";

const apiUrl = process.env.EXPO_PUBLIC_API_URL;

if (!apiUrl) {
  throw new Error("Missing EXPO_PUBLIC_API_URL in the environment.");
}

/**
 * The Koffito API client. Supabase only provides the session; every data
 * request goes through FastAPI with the user's access token.
 */
export const api = createApiClient({
  baseUrl: apiUrl,
  allowInsecure: __DEV__,
  getAccessToken: async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  },
  refreshSession: async () => {
    const { data, error } = await supabase.auth.refreshSession();
    if (error || !data.session) {
      // The refresh token is gone or revoked: drop the local session so the app returns to login.
      await supabase.auth.signOut({ scope: "local" });
      return null;
    }
    return data.session.access_token;
  },
});
