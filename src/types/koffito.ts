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
  languages?: string[];
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
  photo: string;
  address: string;
  website?: string;
  phone?: string;
  mapsUrl?: string;
  rating: number;
  /** Relative busyness (0-100) for each slot in `popularTimeLabels`. */
  popularTimes: number[];
};

/** The participant's own row on a coffee talk, as stored by the backend. */
export type ParticipantStatus =
  | "joined"
  | "matched"
  | "confirmed_24h"
  | "confirmed_3h"
  | "declined"
  | "cancelled"
  | "no_show";

export type CoffeeEvent = {
  id: string;
  cafe: Cafe;
  date: Date;
  /** When a blind coffee talk reveals its café. */
  revealAt: Date;
  participants: User[];
  maxParticipants: number;
  /** Seats left on a joinable coffee talk; unknown for ones you're already part of. */
  spotsLeft?: number;
  status: MeetupStatusType;
  participantStatus?: ParticipantStatus;
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

export type Report = {
  id: string;
  reason: string;
  details: string;
  reportedBy: string;
  date: Date;
  status: ReportStatus;
};

export type SurveyAnswers = Record<string, string[]>;

export type ProfileStats = {
  coffeeTalks: number;
  cafesVisited: number;
  peopleMet: number;
};

export type UserSettings = {
  notificationsEnabled: boolean;
  remindersEnabled: boolean;
};

export type Profile = {
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
  languages?: string[];
  survey: SurveyAnswers;
  onboarded: boolean;
  isAdmin?: boolean;
  stats?: ProfileStats;
  settings?: UserSettings;
};
