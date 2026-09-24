import type { AuthError, Session } from "@supabase/supabase-js";
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { errorMessage } from "@/lib/api-client";
import { profileFromUser } from "@/lib/auth-profile";
import { type ApiProfileUpdate, koffitoApi } from "@/lib/koffito-api";
import { toProfile } from "@/lib/mappers";
import { supabase } from "@/lib/supabase";
import type { Profile, UserSettings } from "@/types/koffito";

type AuthResult = { error: AuthError | null };
type SignUpResult = AuthResult & { needsEmailConfirmation: boolean };

export type ProfileStatus = "idle" | "loading" | "ready" | "error";

type SessionContextValue = {
  /** Supabase session: the app only uses it for auth; data comes from the Koffito API. */
  session: Session | null;
  /** True until the stored session has been restored. */
  isLoading: boolean;
  profile: Profile;
  profileStatus: ProfileStatus;
  profileError?: string;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string, firstName: string) => Promise<SignUpResult>;
  signOut: () => Promise<AuthResult>;
  /** Re-fetches the profile from the API. */
  reloadProfile: () => Promise<void>;
  /** Saves profile details and/or survey answers through the API. */
  updateProfile: (changes: Partial<Profile>) => Promise<Profile>;
  updateSettings: (changes: Partial<UserSettings>) => Promise<void>;
};

const emptyProfile: Profile = { firstName: "", survey: {}, onboarded: false };

const SessionContext = createContext<SessionContextValue | null>(null);

const profileFields = ["firstName", "avatar", "gender", "age", "occupation", "favoriteCoffee", "languages"] as const;

/** Splits a profile change into what `/me` takes; `survey` goes to `/me/survey`. */
export function toProfileUpdate(changes: Partial<Profile>): ApiProfileUpdate {
  const update: ApiProfileUpdate = {};
  for (const field of profileFields) {
    const value = changes[field];
    if (value === undefined) continue;
    if (field === "age") {
      const age = Number(value);
      if (Number.isInteger(age)) update.age = age;
    } else if (field === "languages") {
      update.languages = value as string[];
    } else if (typeof value === "string" && value.trim()) {
      update[field] = value.trim();
    }
  }
  return update;
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [profileStatus, setProfileStatus] = useState<ProfileStatus>("idle");
  const [profileError, setProfileError] = useState<string>();
  const activeUserId = useRef<string | null>(null);

  const loadProfile = useCallback(async (userId: string) => {
    setProfileStatus("loading");
    setProfileError(undefined);
    try {
      const me = await koffitoApi.me();
      if (activeUserId.current !== userId) return;
      setProfile(toProfile(me));
      setProfileStatus("ready");
    } catch (error) {
      if (activeUserId.current !== userId) return;
      setProfileError(errorMessage(error, "We couldn't load your profile."));
      setProfileStatus("error");
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const applySession = (nextSession: Session | null) => {
      if (!mounted) return;

      setSession(nextSession);

      const nextUserId = nextSession?.user.id ?? null;
      if (nextSession && nextUserId !== activeUserId.current) {
        // Name and email from the token while the real profile loads from the API.
        setProfile(profileFromUser(nextSession.user));
        activeUserId.current = nextUserId;
        void loadProfile(nextUserId!);
      } else if (!nextSession) {
        setProfile(emptyProfile);
        setProfileStatus("idle");
        setProfileError(undefined);
        activeUserId.current = null;
      }
      setIsLoading(false);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      applySession(nextSession);
    });

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) console.error("Unable to restore the Supabase session", error);
      applySession(data.session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const reloadProfile = useCallback(async () => {
    if (activeUserId.current) await loadProfile(activeUserId.current);
  }, [loadProfile]);

  const updateProfile = useCallback(async (changes: Partial<Profile>) => {
    const update = toProfileUpdate(changes);
    let latest: Profile | undefined;
    if (Object.keys(update).length > 0) {
      latest = toProfile(await koffitoApi.updateMe(update));
    }
    if (changes.survey) {
      latest = toProfile(await koffitoApi.saveSurvey(changes.survey));
    }
    if (latest) {
      setProfile(latest);
      setProfileStatus("ready");
      return latest;
    }
    return profile;
  }, [profile]);

  const updateSettings = useCallback(async (changes: Partial<UserSettings>) => {
    const latest = toProfile(await koffitoApi.updateSettings(changes));
    setProfile(latest);
  }, []);

  return (
    <SessionContext.Provider
      value={{
        session,
        isLoading,
        profile,
        profileStatus,
        profileError,
        signIn: async (email, password) => {
          const { error } = await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password,
          });
          return { error };
        },
        signUp: async (email, password, firstName) => {
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
        reloadProfile,
        updateProfile,
        updateSettings,
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
