import type { Cafe } from "@/types/koffito";

const photo = (id: string) => `https://images.unsplash.com/${id}?w=800&q=80&fit=crop`;

export const popularTimeLabels = ["8", "10", "12", "14", "16", "18", "20"];

export const cafes: Cafe[] = [
  {
    id: "c1",
    name: "Bean There",
    description:
      "A sunny corner café with house-roasted beans, mismatched armchairs and the friendliest baristas in town.",
    photo: photo("photo-1554118811-1e0d58224f24"),
    address: "12 Market Street, Old Town",
    website: "https://beanthere.example.com",
    phone: "+40 712 345 678",
    rating: 4.8,
    popularTimes: [35, 70, 90, 60, 45, 80, 40],
  },
  {
    id: "c2",
    name: "The Daily Grind",
    description: "Specialty pour-overs, long communal tables and a quiet garden out back. Great for long chats.",
    photo: photo("photo-1501339847302-ac426a4a7cbb"),
    address: "48 River Walk, Riverside",
    website: "https://dailygrind.example.com",
    phone: "+40 723 456 789",
    rating: 4.6,
    popularTimes: [50, 85, 65, 40, 55, 75, 30],
  },
  {
    id: "c3",
    name: "Mocha & Co.",
    description: "Cozy book-lined nook known for cardamom buns and the best mocha this side of the river.",
    photo: photo("photo-1445116572660-236099ec97a0"),
    address: "5 Library Lane, City Center",
    website: "https://mochaco.example.com",
    phone: "+40 734 567 890",
    rating: 4.7,
    popularTimes: [20, 45, 75, 95, 70, 50, 25],
  },
  {
    id: "c4",
    name: "Steam Room",
    description: "Industrial-chic roastery with weekend cuppings and plenty of room for groups.",
    photo: photo("photo-1453614512568-c4024d13c247"),
    address: "101 Factory Road, Botanica",
    rating: 4.5,
    popularTimes: [60, 80, 55, 35, 40, 65, 45],
  },
];

export const getCafe = (id?: string) => cafes.find((cafe) => cafe.id === id);

/** Cafés the signed-in user has already had a coffee talk at. */
export const visitedCafes = [cafes[0], cafes[2]];
