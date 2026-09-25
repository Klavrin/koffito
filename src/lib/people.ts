import type { ProfileViewData } from "@/components/profile/profile-view";
import type { User } from "@/types/koffito";

/** Maps a user to the shape `ProfileView` renders. */
export const toProfileView = (user: User): ProfileViewData => ({
  name: user.name,
  avatar: user.emoji,
  gender: user.gender,
  age: user.age ? String(user.age) : undefined,
  occupation: user.occupation,
  favoriteCoffee: user.favoriteCoffee,
  survey: user.survey ?? {},
});

/** Maps users to the shape `AvatarGroup` expects. */
export const toAvatarPeople = (people: User[]) => people.map((person) => ({ name: person.name, emoji: person.emoji }));
