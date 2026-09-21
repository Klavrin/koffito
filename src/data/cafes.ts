import type { Cafe } from "@/types/koffito";

/** Placeholder until the real café sites are wired up. */
const website = (slug: string) => `https://example.com/${slug}`;

const photo = (id: string) => `https://images.unsplash.com/${id}?w=800&q=80&fit=crop`;

export const popularTimeLabels = ["8", "10", "12", "14", "16", "18", "20"];

export const cafes: Cafe[] = [
  {
    id: "c1",
    name: "Naringi",
    description: "Light, plant-filled room just off the centre. Good for a slow morning and an even slower second cup.",
    photo: photo("photo-1554118811-1e0d58224f24"),
    address: "Strada Alexandr Pușkin 26, Chișinău",
    website: website("naringi"),
    rating: 4.7,
    popularTimes: [35, 70, 90, 60, 45, 80, 40],
  },
  {
    id: "c2",
    name: "Coffee Varka",
    description: "Small counter, quick service and a steady queue of regulars who know exactly what they want.",
    photo: photo("photo-1501339847302-ac426a4a7cbb"),
    address: "Strada Columna 50, Chișinău",
    website: website("coffee-varka"),
    rating: 4.5,
    popularTimes: [60, 85, 65, 40, 55, 75, 30],
  },
  {
    id: "c3",
    name: "Pasio Coffee",
    description: "A compact specialty bar where the baristas take pour-over as seriously as espresso.",
    photo: photo("photo-1445116572660-236099ec97a0"),
    address: "Strada Vasile Alecsandri 115, Chișinău",
    website: website("pasio-coffee"),
    rating: 4.8,
    popularTimes: [20, 45, 75, 95, 70, 50, 25],
  },
  {
    id: "c4",
    name: "Two Guys Coffee",
    description: "Friendly neighbourhood spot in Centru. Nothing fussy, just consistently good coffee.",
    photo: photo("photo-1453614512568-c4024d13c247"),
    address: "Strada Vasile Alecsandri 66, Chișinău",
    website: website("two-guys-coffee"),
    rating: 4.6,
    popularTimes: [40, 80, 55, 35, 50, 65, 45],
  },
  {
    id: "c5",
    name: "BRUN Coffee Project",
    description: "Roasters first, café second. Ask what came off the drum this week.",
    photo: photo("photo-1554118811-1e0d58224f24"),
    address: "Strada Alexei Mateevici 87, Chișinău",
    website: website("brun-coffee"),
    rating: 4.8,
    popularTimes: [30, 65, 85, 70, 50, 60, 35],
  },
  {
    id: "c6",
    name: "Poetry Coffeeshop",
    description: "Right on the main boulevard, with enough corners to still feel private.",
    photo: photo("photo-1501339847302-ac426a4a7cbb"),
    address: "Bulevardul Ștefan cel Mare și Sfânt, Chișinău",
    website: website("poetry-coffeeshop"),
    rating: 4.4,
    popularTimes: [55, 75, 70, 60, 65, 85, 50],
  },
  {
    id: "c7",
    name: "Holly Nest Coffee & Events",
    description: "Half café, half event space. Quiet on weekday mornings, busy when something is on.",
    photo: photo("photo-1445116572660-236099ec97a0"),
    address: "Chișinău",
    website: website("holly-nest"),
    rating: 4.5,
    popularTimes: [25, 50, 70, 80, 60, 70, 55],
  },
  {
    id: "c8",
    name: "Tucano Coffee",
    description: "Laptop-friendly and open late. The armchairs at the back are the ones to aim for.",
    photo: photo("photo-1453614512568-c4024d13c247"),
    address: "Strada Alexandr Pușkin 15, Chișinău",
    website: website("tucano-coffee"),
    rating: 4.3,
    popularTimes: [45, 70, 60, 55, 60, 80, 65],
  },
  {
    id: "c9",
    name: "Bonjour Cafe Maison",
    description: "Pastries in the window, a proper flat white at the counter. Easy place to meet someone new.",
    photo: photo("photo-1554118811-1e0d58224f24"),
    address: "Strada Columna, Chișinău",
    website: website("bonjour-cafe"),
    rating: 4.6,
    popularTimes: [50, 80, 75, 50, 45, 70, 40],
  },
  {
    id: "c10",
    name: "Red Rabbit Specialty Coffee",
    description: "Out towards Râșcani and worth the trip. Single origins on rotation, no rush to leave.",
    photo: photo("photo-1501339847302-ac426a4a7cbb"),
    address: "Strada Nicolae Dimo 21/1, Chișinău",
    website: website("red-rabbit"),
    rating: 4.7,
    popularTimes: [30, 55, 65, 45, 50, 75, 60],
  },
];

export const getCafe = (id?: string) => cafes.find((cafe) => cafe.id === id);

/** Cafés the signed-in user has already had a coffee talk at. */
export const visitedCafes = [cafes[0], cafes[2], cafes[7]];
