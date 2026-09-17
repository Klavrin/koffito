export const interests = {
  coffee: { emoji: "☕", label: "Coffee" },
  music: { emoji: "🎵", label: "Music" },
  gaming: { emoji: "🎮", label: "Gaming" },
  photography: { emoji: "📷", label: "Photography" },
  books: { emoji: "📚", label: "Books" },
  travel: { emoji: "✈️", label: "Travel" },
  hiking: { emoji: "🥾", label: "Hiking" },
  art: { emoji: "🎨", label: "Art" },
  cooking: { emoji: "🍳", label: "Cooking" },
  movies: { emoji: "🎬", label: "Movies" },
  fitness: { emoji: "🏃", label: "Fitness" },
  pets: { emoji: "🐶", label: "Pets" },
  tech: { emoji: "💻", label: "Tech" },
  languages: { emoji: "🗣️", label: "Languages" },
} as const;

export type Interest = keyof typeof interests;
