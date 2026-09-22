import type { Session } from "@supabase/supabase-js";
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useState } from "react";

import { fetchProfile, register, type Registration, saveProfile, signInWithPassword, signOut as signOutRequest } from "@/api";
import { useResource } from "@/hooks/use-resource";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types/koffito";

type SessionContextValue = {
  session: Session | null;
  /** The signed-in user's profile; `null` while signed out or when it failed to load. */
  profile: Profile | null;
  /** True once the stored session was restored and, if signed in, the profile finished loading. */
  ready: boolean;
  profileError?: unknown;
  signIn: (email: string, password: string) => Promise<void>;
  /** Resolves to `true` when the user must confirm their email before logging in. */
  signUp: (details: Registration) => Promise<boolean>;
  signOut: () => Promise<void>;
  updateProfile: (changes: Partial<Profile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

/** Tracks the Supabase Auth session and keeps the signed-in user's profile loaded. */
export function SessionProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setSessionReady(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => listener.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id;
  const email = session?.user.email;

  const loadProfile = useCallback(() => fetchProfile(userId ?? "", email), [userId, email]);
  const profileState = useResource(loadProfile, !!userId);
  const profile = profileState.data ?? null;
  const { setData: setProfile } = profileState;

  const updateProfile = useCallback(
    async (changes: Partial<Profile>) => {
      if (!profile) throw new Error("not_authenticated");
      await saveProfile(profile, changes);
      setProfile((current) => ({ ...(current ?? profile), ...changes }));
    },
    [profile, setProfile],
  );

  return (
    <SessionContext.Provider
      value={{
        session,
        profile,
        ready: sessionReady && (!userId || !!profile || !!profileState.error),
        profileError: profileState.error,
        signIn: signInWithPassword,
        signUp: register,
        signOut: signOutRequest,
        updateProfile,
        refreshProfile: profileState.refresh,
      }}>
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

/** The signed-in user's profile. Only for screens behind the auth guard, where it is always loaded. */
export function useProfile() {
  const { profile } = useSession();

  if (!profile) {
    throw new Error("useProfile needs a signed-in user with a loaded profile");
  }

  return profile;
}
