import type { AuthError, Session } from "@supabase/supabase-js";
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useState } from "react";

import { fetchProfile, saveProfile } from "@/api";
import { useResource } from "@/hooks/use-resource";
import { profileFromUser } from "@/lib/auth-profile";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types/koffito";

type AuthResult = { error: AuthError | null };
type SignUpResult = AuthResult & { needsEmailConfirmation: boolean };

type SessionContextValue = {
  session: Session | null;
  /** True while the stored session is restored and, once signed in, the profile row is loading. */
  isLoading: boolean;
  /** The signed-in user's profile from the database; a placeholder while signed out. */
  profile: Profile;
  /** Set when the profile row could not be loaded; `refreshProfile` retries. */
  profileError?: unknown;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string, firstName: string) => Promise<SignUpResult>;
  signOut: () => Promise<AuthResult>;
  /** Saves the changes to the database before applying them locally; throws on failure. */
  updateProfile: (changes: Partial<Profile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const emptyProfile: Profile = { firstName: "", survey: {}, onboarded: false };

const SessionContext = createContext<SessionContextValue | null>(null);

/** Tracks the Supabase Auth session and keeps the signed-in user's profile row loaded. */
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

  const loadProfile = useCallback(() => fetchProfile(userId ?? "", email), [userId, email]);
  const profileState = useResource(loadProfile, !!userId);
  const { setData: setProfile, refresh: refreshProfile } = profileState;

  // Until the row arrives, show what the auth user already tells us (name and email).
  const profile = profileState.data ?? (user ? { ...profileFromUser(user), id: user.id } : emptyProfile);

  const updateProfile = useCallback(
    async (changes: Partial<Profile>) => {
      const current = profileState.data;
      if (!current?.id) throw new Error("not_authenticated");

      await saveProfile({ ...current, id: current.id }, changes);
      setProfile((latest) => ({ ...(latest ?? current), ...changes }));
    },
    [profileState.data, setProfile],
  );

  return (
    <SessionContext.Provider
      value={{
        session,
        isLoading: !sessionReady || (!!userId && !profileState.data && !profileState.error),
        profile,
        profileError: profileState.error,
        signIn: async (email, password) => {
          const { error } = await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password,
          });
          return { error };
        },
        signUp: async (email, password, firstName) => {
          // A database trigger turns the metadata into the profile and settings rows.
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
        refreshProfile,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const value = useContext(SessionContext);

  if (!value) {
    throw new Error("useSession must be used within a SessionProvider");
  }

  return value;
}
