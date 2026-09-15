import { createContext, type PropsWithChildren, useContext, useState } from "react";

type SessionContextValue = {
  session: string | null;
  signIn: () => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<string | null>(null);

  return (
    <SessionContext.Provider
      value={{
        session,
        signIn: () => setSession("temporary-session"),
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
