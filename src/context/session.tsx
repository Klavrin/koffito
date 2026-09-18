import { createContext, type PropsWithChildren, useContext, useState } from "react";

import type { Profile } from "@/types/koffito";

type SessionContextValue = {
  session: string | null;
  profile: Profile;
  /** Pass profile details when they are known (e.g. right after registering). */
  signIn: (profile?: Partial<Profile>) => void;
  signOut: () => void;
  updateProfile: (changes: Partial<Profile>) => void;
};

/** Stand-in for a returning user until a real backend exists. */
const returningProfile: Profile = {
  firstName: "George",
  email: "george@koffito.app",
  avatar: "🦊",
  gender: "Male",
  age: "28",
  occupation: "Product designer",
  favoriteCoffee: "Flat white",
  survey: {
    motivation: ["friends", "places"],
    hobbies: ["hiking", "movies", "cooking"],
    topics: ["traveling", "stories"],
    meetup: ["long"],
    personality: ["ambivert"],
  },
  onboarded: true,
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile>(returningProfile);

  return (
    <SessionContext.Provider
      value={{
        session,
        profile,
        signIn: (details) => {
          setProfile(details ? { firstName: "", survey: {}, onboarded: false, ...details } : returningProfile);
          setSession("temporary-session");
        },
        signOut: () => setSession(null),
        updateProfile: (changes) => setProfile((current) => ({ ...current, ...changes })),
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
