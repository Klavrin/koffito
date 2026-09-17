import type { CoffeeEvent } from "@/types/koffito";

import { cafes } from "./cafes";
import { users } from "./users";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/** Dates are relative to "now" so the mock data always has upcoming and past events. */
const fromNow = (ms: number) => new Date(Date.now() + ms);

export const events: CoffeeEvent[] = [
  {
    id: "e1",
    cafe: cafes[0],
    date: fromNow(2 * DAY),
    participants: [users[0], users[1], users[2]],
    maxParticipants: 4,
    status: "confirmed",
    joined: true,
  },
  {
    id: "e2",
    cafe: cafes[1],
    date: fromNow(22 * HOUR + 4 * 60 * 1000),
    participants: [users[3], users[4]],
    maxParticipants: 3,
    status: "confirmed",
    joined: true,
    locationHidden: true,
  },
  {
    id: "e3",
    cafe: cafes[2],
    date: fromNow(6 * DAY),
    participants: [users[5]],
    maxParticipants: 5,
    status: "pending",
    joined: true,
  },
  {
    id: "e4",
    cafe: cafes[3],
    date: fromNow(-5 * DAY),
    participants: [users[0], users[4], users[5], users[1]],
    maxParticipants: 4,
    status: "completed",
    joined: true,
  },
  {
    id: "e5",
    cafe: cafes[2],
    date: fromNow(1 * DAY + 3 * HOUR),
    participants: [users[2], users[3]],
    maxParticipants: 4,
    status: "confirmed",
    joined: false,
  },
  {
    id: "e6",
    cafe: cafes[3],
    date: fromNow(3 * DAY),
    participants: [users[1]],
    maxParticipants: 3,
    status: "confirmed",
    joined: false,
  },
  {
    id: "e7",
    cafe: cafes[0],
    date: fromNow(4 * DAY + 2 * HOUR),
    participants: [users[4], users[5], users[0]],
    maxParticipants: 5,
    status: "confirmed",
    joined: false,
  },
];

export const isUpcoming = (event: CoffeeEvent) =>
  event.date.getTime() > Date.now() && event.status !== "cancelled" && event.status !== "completed";
