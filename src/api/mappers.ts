/**
 * Converts rows and JSON cards from the database into the app's domain types (and back).
 * Keeping every conversion here means screens never see snake_case or enum values.
 */
import type { Interest } from "@/constants/interests";
import type { Database, Json, Tables, TablesUpdate } from "@/types/database";
import type {
  Cafe,
  CoffeeEvent,
  MeetupStatusType,
  Profile,
  ProfileStats,
  Report,
  Settings,
  SurveyAnswers,
  User,
} from "@/types/koffito";

type Gender = Database["public"]["Enums"]["gender"];
type MyEventRow = Database["public"]["Functions"]["get_my_events"]["Returns"][number];
type OpenEventRow = Database["public"]["Functions"]["get_open_events"]["Returns"][number];

/** Shape produced by the `profile_card()` database function. */
export type ProfileCard = {
  id: string;
  name: string;
  emoji: string | null;
  gender: Gender | null;
  age: number | null;
  languages: string[];
  occupation: string | null;
  favoriteCoffee: string | null;
  survey: SurveyAnswers;
};

/** `get_public_profile()` adds the person's coffee talk stats to their card. */
export type PublicProfile = ProfileCard & { stats?: Partial<ProfileStats> };

/** Shape produced by the `venue_card()` database function. */
export type VenueCard = {
  id: string;
  name: string;
  description: string;
  photo: string | null;
  address: string;
  website: string | null;
  phone: string | null;
  mapsUrl: string | null;
  rating: number | null;
  popularTimes: number[];
};

const genderLabels: Record<Gender, string> = {
  female: "Female",
  male: "Male",
  non_binary: "Non-binary",
  prefer_not_to_say: "Prefer not to say",
};

/** Survey hobbies that have a matching interest chip. */
const hobbyInterests: Record<string, Interest> = {
  sports: "fitness",
  movies: "movies",
  cooking: "cooking",
  reading: "books",
  hiking: "hiking",
  travel: "travel",
  arts: "art",
};

export const toGender = (label?: string) =>
  (Object.keys(genderLabels) as Gender[]).find((key) => genderLabels[key] === label) ?? null;

const isAnswers = (value: unknown): value is SurveyAnswers =>
  !!value && typeof value === "object" && !Array.isArray(value);

/** Age in whole years for a `YYYY-MM-DD` date of birth. */
export function ageFromBirthDate(dateOfBirth: string | null) {
  if (!dateOfBirth) return undefined;

  const [year, month, day] = dateOfBirth.split("-").map(Number);
  const today = new Date();
  let years = today.getFullYear() - year;
  if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)) years--;

  return String(Math.max(years, 0));
}

/** The app only asks for an age, so store a birthday exactly that many years ago. */
export function birthDateFromAge(age?: string) {
  const years = Number(age);
  if (!age || !Number.isInteger(years)) return null;

  const today = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${today.getFullYear() - years}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
}

export function toUser(card: ProfileCard): User {
  const survey = isAnswers(card.survey) ? card.survey : {};
  const hobbies = survey.hobbies ?? [];

  return {
    id: card.id,
    name: card.name || "Coffee lover",
    age: card.age ?? undefined,
    bio: card.occupation ?? undefined,
    emoji: card.emoji ?? undefined,
    gender: card.gender ? genderLabels[card.gender] : undefined,
    occupation: card.occupation ?? undefined,
    favoriteCoffee: card.favoriteCoffee ?? undefined,
    survey,
    interests: hobbies.map((hobby) => hobbyInterests[hobby]).filter((interest): interest is Interest => !!interest),
  };
}

export function toStats(stats?: Partial<ProfileStats> | null): ProfileStats {
  return { coffeeTalks: stats?.coffeeTalks ?? 0, cafesVisited: stats?.cafesVisited ?? 0, peopleMet: stats?.peopleMet ?? 0 };
}

export function toCafe(card: VenueCard): Cafe {
  return {
    id: card.id,
    name: card.name,
    description: card.description,
    photo: card.photo,
    address: card.address,
    website: card.website ?? undefined,
    phone: card.phone ?? undefined,
    mapsUrl: card.mapsUrl ?? undefined,
    rating: card.rating ?? 0,
    popularTimes: card.popularTimes ?? [],
  };
}

export function venueRowToCafe(row: Tables<"venues">): Cafe {
  return toCafe({
    id: row.id,
    name: row.name,
    description: row.description,
    photo: row.photo_url,
    address: row.address,
    website: row.website,
    phone: row.phone,
    mapsUrl: row.maps_url,
    rating: row.rating,
    popularTimes: row.popular_times ?? [],
  });
}

const meetupStatuses: MeetupStatusType[] = ["pending", "confirmed", "completed", "cancelled"];

export function toMyEvent(row: MyEventRow): CoffeeEvent {
  const status = meetupStatuses.find((value) => value === row.status) ?? "pending";
  const participants = Array.isArray(row.participants) ? (row.participants as unknown as ProfileCard[]) : [];

  return {
    id: row.id,
    cafe: row.cafe ? toCafe(row.cafe as unknown as VenueCard) : undefined,
    date: new Date(row.event_at),
    revealAt: new Date(row.reveal_at),
    participants: participants.map(toUser),
    maxParticipants: row.max_participants,
    status,
    joined: row.joined,
    locationHidden: row.location_hidden,
    // The database keeps the rating; the comment is only known locally after it was sent.
    review: row.my_rating ? { rating: row.my_rating, comment: "" } : undefined,
    attendance: row.my_rating ? "happened" : undefined,
  };
}

export function toOpenEvent(row: OpenEventRow): CoffeeEvent {
  return {
    id: row.id,
    date: new Date(row.event_at),
    participants: [],
    maxParticipants: row.max_participants,
    spotsLeft: row.spots_left,
    status: "pending",
    joined: row.joined,
    locationHidden: true,
  };
}

const splitName = (displayName: string) => {
  const [firstName = "", ...rest] = displayName.trim().split(/\s+/);
  return { firstName, lastName: rest.join(" ") || undefined };
};

export function toProfile(row: Tables<"profiles">, survey: Json | null, email?: string): Profile {
  return {
    id: row.id,
    ...splitName(row.display_name),
    email,
    avatar: row.avatar_emoji ?? undefined,
    gender: row.gender ? genderLabels[row.gender] : undefined,
    age: ageFromBirthDate(row.date_of_birth),
    occupation: row.occupation ?? undefined,
    favoriteCoffee: row.favorite_coffee ?? undefined,
    survey: isAnswers(survey) ? survey : {},
    onboarded: !!row.onboarded_at,
    isAdmin: row.is_admin,
  };
}

/** Only the columns present in `changes` are sent, so partial saves don't clear other fields. */
export function toProfileUpdate(changes: Partial<Profile>, current: Profile): TablesUpdate<"profiles"> {
  const update: TablesUpdate<"profiles"> = {};

  if ("firstName" in changes || "lastName" in changes) {
    const firstName = changes.firstName ?? current.firstName;
    const lastName = "lastName" in changes ? changes.lastName : current.lastName;
    update.display_name = [firstName, lastName].filter(Boolean).join(" ").trim();
  }
  if ("avatar" in changes) update.avatar_emoji = changes.avatar ?? null;
  if ("gender" in changes) update.gender = toGender(changes.gender);
  if ("age" in changes) update.date_of_birth = birthDateFromAge(changes.age);
  if ("occupation" in changes) update.occupation = changes.occupation?.trim() || null;
  if ("favoriteCoffee" in changes) update.favorite_coffee = changes.favoriteCoffee ?? null;
  if (changes.onboarded && !current.onboarded) update.onboarded_at = new Date().toISOString();

  return update;
}

export function toSettings(row: Tables<"user_settings">): Settings {
  return { notifications: row.notifications_enabled, reminders: row.reminders_enabled };
}

export function toSettingsUpdate(changes: Partial<Settings>): TablesUpdate<"user_settings"> {
  const update: TablesUpdate<"user_settings"> = {};
  if ("notifications" in changes) update.notifications_enabled = changes.notifications;
  if ("reminders" in changes) update.reminders_enabled = changes.reminders;
  return update;
}

export function toReport(row: Tables<"admin_reports">): Report | null {
  if (!row.id || !row.reason || !row.status || !row.created_at) return null;

  return {
    id: row.id,
    reason: row.reason,
    details: row.details ?? "",
    reportedBy: row.reported_by ?? "Unknown",
    date: new Date(row.created_at),
    status: row.status,
  };
}
