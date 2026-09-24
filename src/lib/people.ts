import type { User } from "@/types/koffito";

/** Maps users to the shape `AvatarGroup` expects. */
export const toAvatarPeople = (people: User[]) =>
  people.map((person) => ({ name: person.name, emoji: person.emoji }));
