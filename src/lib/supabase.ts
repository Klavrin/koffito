import "react-native-url-polyfill/auto";
import "react-native-get-random-values";

import { createClient } from "@supabase/supabase-js";
import { AppState, Platform } from "react-native";

import { LargeSecureStore } from "./secure-session-storage";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    "Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY in the environment.",
  );
}

/**
 * The app's only Supabase client, used for authentication alone: sign up, sign in, sign out
 * and token refresh. Data lives behind the Koffito API (`src/lib/api.ts`); direct Data API
 * access is refused by the server.
 */
export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    // Native keeps the session encrypted on the device; the web build falls back to localStorage.
    ...(Platform.OS !== "web" ? { storage: new LargeSecureStore() } : {}),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Keep refreshing the token only while the app is in the foreground.
if (Platform.OS !== "web") {
  AppState.addEventListener("change", (state) => {
    if (state === "active") {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
