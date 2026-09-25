import type { AuthError, Session } from "@supabase/supabase-js";
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useState } from "react";

import { fetchMe, saveProfile, saveSettings } from "@/api";
import { useResource } from "@/hooks/use-resource";
import { profileFromUser } from "@/lib/auth-profile";
import { supabase } from "@/lib/supabase";
import type { Me, Profile, ProfileStats, Settings } from "@/types/koffito";

type AuthResult = { error: AuthError | null };
type SignUpResult = AuthResult & { needsEmailConfirmation: boolean };

type SessionContextValue = {
  session: Session | null;
  /** True while the stored session is restored and, once signed in, `GET /me` is loading. */
  isLoading: boolean;
  /** The signed-in user's profile from the API; a placeholder while signed out. */
  profile: Profile;
  stats: ProfileStats;
  settings: Settings;
  /** Set when `GET /me` failed; `refreshProfile` retries. */
  profileError?: unknown;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string, firstName: string) => Promise<SignUpResult>;
  signOut: () => Promise<AuthResult>;
  /** Saves the changes through the API before applying them locally; throws on failure. */
  updateProfile: (changes: Partial<Profile>) => Promise<void>;
  /** Applies the change right away and rolls it back if the API refuses; throws on failure. */
  updateSettings: (changes: Partial<Settings>) => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const emptyProfile: Profile = { firstName: "", survey: {}, onboarded: false };
const emptyStats: ProfileStats = { coffeeTalks: 0, cafesVisited: 0, peopleMet: 0 };
const defaultSettings: Settings = { notifications: true, reminders: true };

const SessionContext = createContext<SessionContextValue | null>(null);

/**
 * Tracks the Supabase Auth session (the app's only use of Supabase) and keeps the signed-in
 * user's `GET /me` response loaded: profile, stats and settings.
 */
export function SessionProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (mounted) setSession(nextSession);
    });

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) console.error("Unable to restore the Supabase session", error);
      if (!mounted) return;
      setSession(data.session);
      setSessionReady(true);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const user = session?.user;
  const userId = user?.id;
  const email = user?.email;

  const loadMe = useCallback(() => fetchMe(email), [email]);
  const meState = useResource(loadMe, !!userId);
  const { data: me, setData: setMe, refresh: refreshProfile } = meState;

  // Until `/me` arrives, show what the auth user already tells us (name and email).
  const profile = me?.profile ?? (user ? { ...profileFromUser(user), id: user.id } : emptyProfile);
  const stats = me?.stats ?? emptyStats;
  const settings = me?.settings ?? defaultSettings;

  const updateProfile = useCallback(
    async (changes: Partial<Profile>) => {
      const current = me?.profile;
      if (!current?.id) throw new Error("not_authenticated");

      try {
        await saveProfile(current, changes);
      } catch (error) {
        // A partial save (survey stored, profile not) must not leave stale local state behind.
        refreshProfile().catch(() => undefined);
        throw error;
      }
      setMe((latest) => withProfile(latest, { ...(latest?.profile ?? current), ...changes }));
    },
    [me?.profile, refreshProfile, setMe],
  );

  const updateSettings = useCallback(
    async (changes: Partial<Settings>) => {
      const previous = me?.settings ?? defaultSettings;
      setMe((latest) => withSettings(latest, { ...(latest?.settings ?? previous), ...changes }));

      try {
        const saved = await saveSettings(changes);
        setMe((latest) => withSettings(latest, saved));
      } catch (error) {
        setMe((latest) => withSettings(latest, previous));
        throw error;
      }
    },
    [me?.settings, setMe],
  );

  return (
    <SessionContext.Provider
      value={{
        session,
        isLoading: !sessionReady || (!!userId && !me && !meState.error),
        profile,
        stats,
        settings,
        profileError: meState.error,
        signIn: async (email, password) => {
          const { error } = await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password,
          });
          return { error };
        },
        signUp: async (email, password, firstName) => {
          // The server turns the metadata into the profile and settings rows.
          const { data, error } = await supabase.auth.signUp({
            email: email.trim().toLowerCase(),
            password,
            options: { data: { first_name: firstName.trim() } },
          });
          return { error, needsEmailConfirmation: !error && !data.session };
        },
        signOut: async () => {
          const { error } = await supabase.auth.signOut();
          return { error };
        },
        updateProfile,
        updateSettings,
        refreshProfile,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

const withProfile = (me: Me | undefined, profile: Profile): Me => ({
  profile,
  stats: me?.stats ?? emptyStats,
  settings: me?.settings ?? defaultSettings,
});

const withSettings = (me: Me | undefined, settings: Settings): Me => ({
  profile: me?.profile ?? emptyProfile,
  stats: me?.stats ?? emptyStats,
  settings,
});

export function useSession() {
  const value = useContext(SessionContext);

  if (!value) {
    throw new Error("useSession must be used within a SessionProvider");
  }

  return value;
}
