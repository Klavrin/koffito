import type { ProfileViewData } from "@/components/profile/profile-view";
import type {
  ApiCafe,
  ApiEvent,
  ApiPerson,
  ApiProfile,
  ApiPublicProfile,
  ApiReport,
} from "@/lib/koffito-api";
import type { Cafe, CoffeeEvent, Profile, Report, User } from "@/types/koffito";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/** Stand-in café for coffee talks whose location is still a secret (the picture is blurred anyway). */
export const mysteryCafe: Cafe = {
  id: "mystery",
  name: "Mystery café",
  description: "The café will be revealed a day before the meet up.",
  photo: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80&fit=crop",
  address: "Somewhere cosy",
  rating: 0,
  popularTimes: [],
};

export function toCafe(cafe: ApiCafe): Cafe {
  return {
    id: cafe.id,
    name: cafe.name,
    description: cafe.description ?? "",
    photo: cafe.photo ?? mysteryCafe.photo,
    address: cafe.address ?? "",
    website: cafe.website ?? undefined,
    phone: cafe.phone ?? undefined,
    mapsUrl: cafe.mapsUrl ?? undefined,
    rating: Number(cafe.rating ?? 0),
    popularTimes: cafe.popularTimes ?? [],
  };
}

export function toUser(person: ApiPerson): User {
  return {
    id: person.id,
    name: person.name,
    emoji: person.emoji ?? undefined,
    age: person.age ?? undefined,
    gender: person.gender ?? undefined,
    occupation: person.occupation ?? undefined,
    favoriteCoffee: person.favoriteCoffee ?? undefined,
    languages: person.languages ?? [],
    survey: person.survey ?? {},
    interests: [],
  };
}

export function toCoffeeEvent(event: ApiEvent): CoffeeEvent {
  const date = new Date(event.eventAt);
  const revealAt = event.revealAt ? new Date(event.revealAt) : new Date(date.getTime() - DAY);
  const review =
    event.myRating != null
      ? { rating: event.myRating, comment: event.myComment ?? "" }
      : event.attended === false && event.attendanceNote
        ? { rating: 0, comment: event.attendanceNote }
        : undefined;

  return {
    id: event.id,
    cafe: event.cafe ? toCafe(event.cafe) : mysteryCafe,
    date,
    revealAt,
    participants: (event.participants ?? []).map(toUser),
    maxParticipants: event.maxParticipants,
    spotsLeft: event.spotsLeft ?? undefined,
    status: event.status,
    participantStatus: (event.participantStatus as CoffeeEvent["participantStatus"]) ?? undefined,
    joined: event.joined,
    locationHidden: event.blind,
    revealOpened: event.revealOpened,
    attendance: event.attended === true ? "happened" : event.attended === false ? "missed" : undefined,
    review,
  };
}

export function toProfile(profile: ApiProfile): Profile {
  return {
    id: profile.id,
    firstName: profile.firstName,
    email: profile.email ?? undefined,
    avatar: profile.avatar ?? undefined,
    gender: profile.gender ?? undefined,
    age: profile.age != null ? String(profile.age) : undefined,
    occupation: profile.occupation ?? undefined,
    favoriteCoffee: profile.favoriteCoffee ?? undefined,
    languages: profile.languages ?? [],
    survey: profile.survey ?? {},
    onboarded: profile.onboarded,
    isAdmin: profile.isAdmin,
    stats: profile.stats,
    settings: profile.settings,
  };
}

export function toProfileView(person: ApiPublicProfile | User): ProfileViewData {
  const avatar = "avatar" in person ? (person.avatar ?? undefined) : person.emoji;
  return {
    name: person.name,
    avatar,
    gender: person.gender ?? undefined,
    age: person.age != null ? String(person.age) : undefined,
    occupation: person.occupation ?? undefined,
    favoriteCoffee: person.favoriteCoffee ?? undefined,
    survey: person.survey ?? {},
  };
}

export function toReport(report: ApiReport): Report {
  return {
    id: report.id,
    reason: report.reasonLabel,
    details: report.details,
    reportedBy: report.reportedBy,
    date: new Date(report.createdAt),
    status: report.status,
  };
}

/** Short, friendly id for "Report #…" labels. */
export const shortId = (id: string) => id.replace(/-/g, "").slice(0, 6).toUpperCase();
