import type { User } from "@/types/koffito";

export const users: User[] = [
  {
    id: "u1",
    name: "Maya Lopez",
    emoji: "🦊",
    age: 27,
    bio: "Flat white fan, amateur film photographer and weekend hiker.",
    interests: ["coffee", "photography", "hiking"],
    location: "Old Town",
    isOnline: true,
  },
  {
    id: "u2",
    name: "Sam Carter",
    emoji: "🐻",
    age: 31,
    bio: "Board games, bad puns and very good espresso.",
    interests: ["gaming", "coffee", "music"],
    location: "Riverside",
  },
  {
    id: "u3",
    name: "Ana Popescu",
    emoji: "🐱",
    age: 24,
    bio: "Learning my fourth language, one cappuccino at a time.",
    interests: ["languages", "books", "travel"],
    location: "City Center",
    isOnline: true,
  },
  {
    id: "u4",
    name: "Leo Martin",
    emoji: "🦉",
    age: 29,
    bio: "Home cook looking for people to taste-test with.",
    interests: ["cooking", "movies", "pets"],
    location: "Botanica",
  },
  {
    id: "u5",
    name: "Iris Chen",
    emoji: "🐼",
    age: 26,
    bio: "Designer by day, ceramics by night.",
    interests: ["art", "tech", "coffee"],
    location: "Old Town",
  },
  {
    id: "u6",
    name: "Tom Becker",
    emoji: "🐸",
    age: 34,
    bio: "Runs slowly, talks a lot.",
    interests: ["fitness", "travel", "music"],
    location: "Riverside",
  },
];

/** Maps users to the shape `AvatarGroup` expects. */
export const toAvatarPeople = (people: User[]) => people.map((person) => ({ name: person.name, emoji: person.emoji }));
