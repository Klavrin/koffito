import type { User } from "@/types/koffito";

const photo = (id: string) => `https://images.unsplash.com/${id}?w=400&q=80&fit=crop`;

export const users: User[] = [
  {
    id: "u1",
    name: "Maya Lopez",
    age: 27,
    bio: "Flat white fan, amateur film photographer and weekend hiker.",
    photo: photo("photo-1494790108377-be9c29b29330"),
    interests: ["coffee", "photography", "hiking"],
    location: "Old Town",
    isOnline: true,
  },
  {
    id: "u2",
    name: "Sam Carter",
    age: 31,
    bio: "Board games, bad puns and very good espresso.",
    photo: photo("photo-1500648767791-00dcc994a43e"),
    interests: ["gaming", "coffee", "music"],
    location: "Riverside",
  },
  {
    id: "u3",
    name: "Ana Popescu",
    age: 24,
    bio: "Learning my fourth language, one cappuccino at a time.",
    photo: photo("photo-1438761681033-6461ffad8d80"),
    interests: ["languages", "books", "travel"],
    location: "City Center",
    isOnline: true,
  },
  {
    id: "u4",
    name: "Leo Martin",
    age: 29,
    bio: "Home cook looking for people to taste-test with.",
    interests: ["cooking", "movies", "pets"],
    location: "Botanica",
  },
  {
    id: "u5",
    name: "Iris Chen",
    age: 26,
    bio: "Designer by day, ceramics by night.",
    photo: photo("photo-1544005313-94ddf0286df2"),
    interests: ["art", "tech", "coffee"],
    location: "Old Town",
  },
  {
    id: "u6",
    name: "Tom Becker",
    age: 34,
    bio: "Runs slowly, talks a lot.",
    interests: ["fitness", "travel", "music"],
    location: "Riverside",
  },
];
