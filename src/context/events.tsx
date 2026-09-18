import { createContext, type PropsWithChildren, useContext, useState } from "react";

import { events as initialEvents } from "@/data/events";
import type { Cafe, CoffeeEvent } from "@/types/koffito";

type NewEvent = { cafe: Cafe; date: Date; maxParticipants: number; locationHidden?: boolean };

type EventsContextValue = {
  events: CoffeeEvent[];
  getEvent: (id?: string) => CoffeeEvent | undefined;
  createEvent: (event: NewEvent) => CoffeeEvent;
  joinEvent: (id: string) => void;
  cancelEvent: (id: string) => void;
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
          const event: CoffeeEvent = { id: `e${Date.now()}`, participants: [], status: "confirmed", joined: true, ...details };
          setEvents((current) => [event, ...current]);
          return event;
        },
        joinEvent: (id) =>
          setEvents((current) => current.map((event) => (event.id === id ? { ...event, joined: true } : event))),
        cancelEvent: (id) =>
          setEvents((current) => current.map((event) => (event.id === id ? { ...event, status: "cancelled" } : event))),
      }}>
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
