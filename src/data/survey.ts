export type SurveyOption = { key: string; emoji: string; label: string };

export type SurveyQuestion = {
  key: string;
  /** Small label above the question, matching the wireframe section. */
  section: string;
  question: string;
  /** Maximum number of answers; 1 makes the question single-choice. */
  max: number;
  options: SurveyOption[];
};

export const motivationQuestion: SurveyQuestion = {
  key: "motivation",
  section: "Interests",
  question: "Why do you want to use Koffito?",
  max: 5,
  options: [
    { key: "socialize", emoji: "💬", label: "Socialize" },
    { key: "friends", emoji: "🤝", label: "Make friends" },
    { key: "boredom", emoji: "🥱", label: "Boredom" },
    { key: "places", emoji: "☕", label: "Try out new coffee places" },
    { key: "comfort-zone", emoji: "🚀", label: "Get out of my comfort zone" },
  ],
};

export const interestQuestions: SurveyQuestion[] = [
  {
    key: "hobbies",
    section: "Interests",
    question: "What are your hobbies?",
    max: 5,
    options: [
      { key: "sports", emoji: "⚽", label: "Sports" },
      { key: "movies", emoji: "🎬", label: "Movies" },
      { key: "cooking", emoji: "🍳", label: "Cooking" },
      { key: "reading", emoji: "📚", label: "Reading" },
      { key: "hiking", emoji: "🥾", label: "Hiking" },
      { key: "travel", emoji: "✈️", label: "Travel" },
      { key: "arts", emoji: "🎨", label: "Arts" },
      { key: "other", emoji: "✨", label: "Other" },
    ],
  },
  {
    key: "topics",
    section: "Interests",
    question: "What do you enjoy talking about?",
    max: 3,
    options: [
      { key: "hobbies", emoji: "🎯", label: "Hobbies & interests" },
      { key: "occupation", emoji: "💼", label: "Occupation" },
      { key: "traveling", emoji: "🌍", label: "Traveling" },
      { key: "music", emoji: "🎵", label: "Music" },
      { key: "stories", emoji: "😂", label: "Random / funny stories" },
      { key: "other", emoji: "✨", label: "Other" },
    ],
  },
  {
    key: "meetup",
    section: "Interests",
    question: "What is your ideal coffee meetup?",
    max: 1,
    options: [
      { key: "quick", emoji: "⚡", label: "Quick coffee (30 - 60 min)" },
      { key: "long", emoji: "🛋️", label: "Long coffee (forget about time limits)" },
      { key: "active", emoji: "🎳", label: "Active coffee (coffee and a fun activity)" },
    ],
  },
  {
    key: "personality",
    section: "Interests",
    question: "What is your personality type?",
    max: 1,
    options: [
      { key: "introvert", emoji: "🌙", label: "Introvert" },
      { key: "extrovert", emoji: "☀️", label: "Extrovert" },
      { key: "ambivert", emoji: "🌗", label: "Ambivert (somewhere in between)" },
    ],
  },
];

export const surveyQuestions = [motivationQuestion, ...interestQuestions];

export const avatarOptions = ["☕", "🦊", "🐻", "🐱", "🦉", "🐼", "🌻", "🍩", "🥐", "🎧", "📚", "🌈"];

export const genderOptions = ["Woman", "Man", "Non-binary", "Prefer not to say"];

export const coffeeOptions = ["Espresso", "Flat white", "Cappuccino", "Latte", "Filter", "Iced coffee", "Tea, actually"];

/** Looks up the display option for a stored survey answer. */
export function findSurveyOption(questionKey: string, optionKey: string) {
  return surveyQuestions.find((q) => q.key === questionKey)?.options.find((o) => o.key === optionKey);
}
