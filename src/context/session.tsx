import type { AuthError, Session } from "@supabase/supabase-js";
import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { profileFromUser } from "@/lib/auth-profile";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types/koffito";

type AuthResult = { error: AuthError | null };
type SignUpResult = AuthResult & { needsEmailConfirmation: boolean };

type SessionContextValue = {
  session: Session | null;
  isLoading: boolean;
  profile: Profile;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string, firstName: string) => Promise<SignUpResult>;
  signOut: () => Promise<AuthResult>;
  updateProfile: (changes: Partial<Profile>) => void;
};

const emptyProfile: Profile = { firstName: "", survey: {}, onboarded: false };

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const activeUserId = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const applySession = (nextSession: Session | null) => {
      if (!mounted) return;

      setSession(nextSession);

      const nextUserId = nextSession?.user.id ?? null;
      if (nextSession && nextUserId !== activeUserId.current) {
        setProfile(profileFromUser(nextSession.user));
      } else if (!nextSession) {
        setProfile(emptyProfile);
      }
      activeUserId.current = nextUserId;
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
  }, []);

  return (
    <SessionContext.Provider
      value={{
        session,
        isLoading,
        profile,
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
        updateProfile: (changes) =>
          setProfile((current) => ({ ...current, ...changes })),
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
