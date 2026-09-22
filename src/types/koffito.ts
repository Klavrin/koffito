import type { ImageSource } from "expo-image";

import type { Interest } from "@/constants/interests";

export type { Interest };

export type User = {
  id: string;
  name: string;
  age?: number;
  bio?: string;
  /** Emoji avatar; Koffito shows emojis rather than real photos of people. */
  emoji?: string;
  photo?: ImageSource | string | null;
  /** The same details the profile setup collects, so a profile renders in full. */
  gender?: string;
  occupation?: string;
  favoriteCoffee?: string;
  survey?: SurveyAnswers;
  interests: Interest[];
  location?: string;
  isOnline?: boolean;
};

export type Match = {
  id: string;
  user: User;
  sharedInterests: Interest[];
  /** e.g. "1.2 km away" */
  distance?: string;
};

export type MeetupStatusType = "pending" | "confirmed" | "completed" | "cancelled";

export type Meetup = {
  id: string;
  title?: string;
  participants: User[];
  place: string;
  address?: string;
  date: Date;
  status: MeetupStatusType;
};

export type Cafe = {
  id: string;
  name: string;
  description: string;
  /** Venues can be listed before they have a picture. */
  photo: string | null;
  address: string;
  website?: string;
  phone?: string;
  mapsUrl?: string;
  rating: number;
  /** Relative busyness (0-100) for each slot in `popularTimeLabels`. */
  popularTimes: number[];
};

export type CoffeeEvent = {
  id: string;
  /** Missing while the café is still a secret: the API only sends it once the reveal time has passed. */
  cafe?: Cafe;
  date: Date;
  /** When the café and the other guests get revealed. Unknown for talks the user hasn't joined. */
  revealAt?: Date;
  /** Other guests in the user's group; empty until the reveal. */
  participants: User[];
  maxParticipants: number;
  /** Seats still free, reported by the API for open coffee talks. */
  spotsLeft?: number;
  status: MeetupStatusType;
  /** Whether the signed-in user is part of this coffee talk. */
  joined: boolean;
  /** Blind coffee talks keep the café secret until shortly before the meetup. */
  locationHidden?: boolean;
  /** Set once the user taps to open a café whose reveal time has passed. */
  revealOpened?: boolean;
  /** Set once the user confirms whether a past coffee talk actually happened. */
  attendance?: "happened" | "missed";
  /** The user's own review; only for coffee talks that happened. */
  review?: { rating: number; comment: string };
};

export type ReportStatus = "open" | "reviewing" | "resolved";

export type ReportReason = "no-show" | "rude" | "unsafe" | "fake" | "other";

export type Report = {
  id: string;
  reason: ReportReason;
  details: string;
  reportedBy: string;
  date: Date;
  status: ReportStatus;
};

export type SurveyAnswers = Record<string, string[]>;

export type Profile = {
  /** Auth user id; missing only for the placeholder built before the profile row is loaded. */
  id?: string;
  firstName: string;
  lastName?: string;
  email?: string;
  /** Emoji avatar picked during onboarding. */
  avatar?: string;
  gender?: string;
  age?: string;
  occupation?: string;
  favoriteCoffee?: string;
  survey: SurveyAnswers;
  onboarded: boolean;
  isAdmin?: boolean;
};

export type ProfileStats = {
  coffeeTalks: number;
  cafesVisited: number;
  peopleMet: number;
};

export type Settings = {
  notifications: boolean;
  reminders: boolean;
};
