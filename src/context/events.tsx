import {
  createContext,
  type PropsWithChildren,
  useContext,
  useState,
} from "react";

import { events as initialEvents } from "@/data/events";
import type { Cafe, CoffeeEvent } from "@/types/koffito";

type NewEvent = {
  cafe: Cafe;
  date: Date;
  maxParticipants: number;
  locationHidden?: boolean;
};

type EventsContextValue = {
  events: CoffeeEvent[];
  getEvent: (id?: string) => CoffeeEvent | undefined;
  createEvent: (event: NewEvent) => CoffeeEvent;
  joinEvent: (id: string) => void;
  leaveEvent: (id: string) => void;
  cancelEvent: (id: string) => void;
  /** Records whether a past coffee talk happened. */
  confirmAttendance: (id: string, happened: boolean) => void;
  /** Stores the user's review, or their note about a coffee talk that fell through. */
  reviewEvent: (id: string, review: { rating: number; comment: string }) => void;
};

const EventsContext = createContext<EventsContextValue | null>(null);

/** In-memory event store so created / cancelled coffee talks show up across screens. */
export function EventsProvider({ children }: PropsWithChildren) {
  const [events, setEvents] = useState<CoffeeEvent[]>(initialEvents);

  return (
    <EventsContext.Provider
      value={{
        events,
        getEvent: (id) => events.find((event) => event.id === id),
        createEvent: (details) => {
          const event: CoffeeEvent = {
            id: `e${Date.now()}`,
            participants: [],
            status: "confirmed",
            joined: true,
            ...details,
          };
          setEvents((current) => [event, ...current]);
          return event;
        },
        joinEvent: (id) =>
          setEvents((current) =>
            current.map((event) =>
              event.id === id ? { ...event, joined: true } : event,
            ),
          ),
        leaveEvent: (id) =>
          setEvents((current) =>
            current.map((event) =>
              event.id === id ? { ...event, joined: false } : event,
            ),
          ),
        cancelEvent: (id) =>
          setEvents((current) =>
            current.map((event) =>
              event.id === id ? { ...event, status: "cancelled" } : event,
            ),
          ),
        confirmAttendance: (id, happened) =>
          setEvents((current) =>
            current.map((event) =>
              event.id === id
                ? { ...event, attendance: happened ? "happened" : "missed" }
                : event,
            ),
          ),
        reviewEvent: (id, review) =>
          setEvents((current) =>
            current.map((event) => (event.id === id ? { ...event, review } : event)),
          ),
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
