import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { useSession } from "@/context/session";
import { errorMessage } from "@/lib/api-client";
import { type ApiEvent, type ApiEventCreate, koffitoApi } from "@/lib/koffito-api";
import { toCafe, toCoffeeEvent } from "@/lib/mappers";
import type { Cafe, CoffeeEvent } from "@/types/koffito";

export type EventsStatus = "idle" | "loading" | "ready" | "error";

type EventsContextValue = {
  /** Coffee talks the signed-in user is (or was) part of. */
  events: CoffeeEvent[];
  /** Coffee talks anyone can still join. */
  openEvents: CoffeeEvent[];
  /** Cafés the user has already had a coffee talk at. */
  visitedCafes: Cafe[];
  status: EventsStatus;
  error?: string;
  refresh: () => Promise<void>;
  getEvent: (id?: string) => CoffeeEvent | undefined;
  /** Admins only: schedules a new coffee talk. */
  createEvent: (event: ApiEventCreate) => Promise<string>;
  joinEvent: (id: string) => Promise<CoffeeEvent>;
  leaveEvent: (id: string) => Promise<CoffeeEvent>;
  /** Confirms you're coming, 24h or 3h before the meetup. */
  confirmEvent: (id: string, stage: "24h" | "3h") => Promise<CoffeeEvent>;
  /** Opens a café whose reveal time has passed. */
  revealEvent: (id: string) => Promise<CoffeeEvent>;
  /** Records whether a past coffee talk happened, with an optional note when it didn't. */
  confirmAttendance: (id: string, happened: boolean, note?: string) => Promise<CoffeeEvent>;
  /** Stores the user's review of a coffee talk that happened. */
  reviewEvent: (id: string, review: { rating: number; comment: string }) => Promise<CoffeeEvent>;
};

const EventsContext = createContext<EventsContextValue | null>(null);

/**
 * Coffee talks, loaded from the Koffito API and shared across screens.
 * Mount it with `key={userId}` so a new sign-in starts from empty state.
 */
export function EventsProvider({ children }: PropsWithChildren) {
  const { session, profile } = useSession();
  const [events, setEvents] = useState<CoffeeEvent[]>([]);
  const [openEvents, setOpenEvents] = useState<CoffeeEvent[]>([]);
  const [visitedCafes, setVisitedCafes] = useState<Cafe[]>([]);
  const [status, setStatus] = useState<EventsStatus>(session ? "loading" : "idle");
  const [error, setError] = useState<string>();
  const signedIn = !!session;

  const load = useCallback(
    () =>
      Promise.all([koffitoApi.myEvents(), koffitoApi.openEvents(), koffitoApi.visitedVenues()])
        .then(([mine, open, visited]) => {
          setEvents(mine.map(toCoffeeEvent));
          setOpenEvents(open.map(toCoffeeEvent));
          setVisitedCafes(visited.map(toCafe));
          setError(undefined);
          setStatus("ready");
        })
        .catch((caught: unknown) => {
          setError(errorMessage(caught, "We couldn't load your coffee talks."));
          setStatus("error");
        }),
    [],
  );

  /** Reload with a visible loading state (retry buttons). */
  const refresh = useCallback(async () => {
    if (!signedIn) return;
    setStatus((current) => (current === "ready" ? current : "loading"));
    await load();
  }, [load, signedIn]);

  // Load on sign-in and again once the survey is done (joining needs it).
  useEffect(() => {
    if (signedIn) void load();
  }, [signedIn, profile.onboarded, load]);

  /** Puts the API's version of a coffee talk into both lists, then refreshes quietly. */
  const applyEvent = useCallback(
    (apiEvent: ApiEvent) => {
      const event = toCoffeeEvent(apiEvent);
      setEvents((current) => {
        const exists = current.some((item) => item.id === event.id);
        if (exists) return current.map((item) => (item.id === event.id ? event : item));
        return event.joined ? [...current, event] : current;
      });
      setOpenEvents((current) =>
        current.map((item) =>
          item.id === event.id
            ? { ...item, joined: event.joined, spotsLeft: event.spotsLeft ?? item.spotsLeft }
            : item,
        ),
      );
      void load();
      return event;
    },
    [load],
  );

  const getEvent = useCallback(
    (id?: string) =>
      events.find((event) => event.id === id) ?? openEvents.find((event) => event.id === id),
    [events, openEvents],
  );

  return (
    <EventsContext.Provider
      value={{
        events,
        openEvents,
        visitedCafes,
        status,
        error,
        refresh,
        getEvent,
        createEvent: async (event) => {
          const { id } = await koffitoApi.admin.createEvent(event);
          await refresh();
          return id;
        },
        joinEvent: async (id) => applyEvent(await koffitoApi.joinEvent(id)),
        leaveEvent: async (id) => applyEvent(await koffitoApi.leaveEvent(id)),
        confirmEvent: async (id, stage) => applyEvent(await koffitoApi.confirmEvent(id, stage)),
        revealEvent: async (id) => applyEvent(await koffitoApi.revealEvent(id)),
        confirmAttendance: async (id, happened, note) =>
          applyEvent(await koffitoApi.reportAttendance(id, happened, note)),
        reviewEvent: async (id, review) =>
          applyEvent(await koffitoApi.rateEvent(id, review.rating, review.comment)),
      }}
    >
      {children}
    </EventsContext.Provider>
  );
}

export function useEvents() {
  const value = useContext(EventsContext);

  if (!value) {
    throw new Error("useEvents must be used within an EventsProvider");
  }

  return value;
}
