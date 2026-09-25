/**
 * Converts the API's responses into the app's domain types (and edits back into request
 * bodies). Keeping every conversion here means screens never see snake_case or enum values.
 *
 * Type-only imports keep this module runnable in Node for the unit tests.
 */
import type { Interest } from "@/constants/interests";
import type {
  AdminReport,
  AdminVenue,
  Gender,
  GroupMemberCard,
  MeResponse,
  MeSettings,
  MyEventResponse,
  OpenEventResponse,
  ProfileCard,
  ProfilePatch,
  SettingsPatch,
  SettingsResponse,
  VenueCard,
} from "@/types/api";
import type {
  Cafe,
  CoffeeEvent,
  GroupMember,
  Me,
  Profile,
  ProfileStats,
  Report,
  Settings,
  SurveyAnswers,
  User,
} from "@/types/koffito";

export type { ProfileCard, VenueCard };

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

/** Admin endpoints return the raw venue columns rather than a card. */
export function venueRowToCafe(row: AdminVenue): Cafe {
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

export function toGroupMember(card: GroupMemberCard): GroupMember {
  return {
    id: card.id,
    name: card.name || "Coffee lover",
    emoji: card.emoji ?? undefined,
    status: card.status,
    sharedInterests: card.sharedInterests ?? [],
  };
}

export function toMyEvent(row: MyEventResponse): CoffeeEvent {
  return {
    id: row.id,
    date: new Date(row.event_at),
    registrationClosesAt: new Date(row.registration_closes_at),
    revealAt: new Date(row.reveal_at),
    completesAt: new Date(row.completes_at),
    status: row.event_status,
    joined: true,
    participantStatus: row.participant_status,
    cancelReason: row.cancel_reason ?? undefined,
    groupNumber: row.group_number ?? undefined,
    cafe: row.cafe ? toCafe(row.cafe) : undefined,
    members: (row.members ?? []).map(toGroupMember),
    review: row.my_rating ? { rating: row.my_rating, comment: row.my_comment ?? "" } : undefined,
  };
}

const HOUR_MS = 60 * 60 * 1000;

export function toOpenEvent(row: OpenEventResponse): CoffeeEvent {
  const date = new Date(row.event_at);
  return {
    id: row.id,
    date,
    registrationClosesAt: new Date(row.registration_closes_at),
    revealAt: new Date(row.reveal_at),
    completesAt: new Date(date.getTime() + 2 * HOUR_MS),
    status: "open",
    joined: row.joined,
    full: row.full,
    members: [],
  };
}

const splitName = (displayName: string) => {
  const [firstName = "", ...rest] = displayName.trim().split(/\s+/);
  return { firstName, lastName: rest.join(" ") || undefined };
};

/** The signed-in user's profile from `GET /me`; the email only lives in the auth session. */
export function toProfile(me: MeResponse, email?: string): Profile {
  return {
    id: me.id,
    ...splitName(me.name),
    email,
    avatar: me.emoji ?? undefined,
    gender: me.gender ? genderLabels[me.gender] : undefined,
    age: me.age != null ? String(me.age) : undefined,
    occupation: me.occupation ?? undefined,
    favoriteCoffee: me.favoriteCoffee ?? undefined,
    survey: isAnswers(me.survey) ? me.survey : {},
    onboarded: me.onboarded,
    isAdmin: me.isAdmin,
  };
}

export function toMe(me: MeResponse, email?: string): Me {
  return { profile: toProfile(me, email), stats: toStats(me.stats), settings: toSettings(me.settings) };
}

/** The profile columns as the API wants them, derived from the app's profile shape. */
const profileFields = (profile: Profile) => ({
  display_name: [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim(),
  avatar_emoji: profile.avatar ?? null,
  gender: toGender(profile.gender),
  date_of_birth: birthDateFromAge(profile.age),
  occupation: profile.occupation?.trim() || null,
  favorite_coffee: profile.favoriteCoffee ?? null,
});

/** Only the fields that actually change are sent, so partial saves never clear other fields. */
export function toProfileUpdate(changes: Partial<Profile>, current: Profile): ProfilePatch {
  const before = profileFields(current);
  const after = profileFields({ ...current, ...changes });
  const patch: ProfilePatch = {};

  for (const key of Object.keys(after) as (keyof typeof after)[]) {
    if (after[key] !== before[key]) (patch as Record<string, unknown>)[key] = after[key];
  }
  if (changes.onboarded && !current.onboarded) patch.onboarded = true;

  return patch;
}

export function toSettings(settings: MeSettings): Settings {
  return { notifications: settings.notificationsEnabled, reminders: settings.remindersEnabled };
}

export function settingsFromResponse(row: SettingsResponse): Settings {
  return { notifications: row.notifications_enabled, reminders: row.reminders_enabled };
}

export function toSettingsUpdate(changes: Partial<Settings>): SettingsPatch {
  const update: SettingsPatch = {};
  if ("notifications" in changes) update.notifications_enabled = changes.notifications;
  if ("reminders" in changes) update.reminders_enabled = changes.reminders;
  return update;
}

export function toReport(row: AdminReport): Report {
  return {
    id: row.id,
    reason: row.reason,
    details: row.details,
    reportedBy: row.reported_by || "Unknown",
    date: new Date(row.created_at),
    status: row.status,
  };
}
