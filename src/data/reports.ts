import type { Report } from "@/types/koffito";

const DAY = 24 * 60 * 60 * 1000;

export const reportReasons = [
  { key: "no-show", emoji: "👻", label: "Didn't show up" },
  { key: "rude", emoji: "😠", label: "Rude or disrespectful" },
  { key: "unsafe", emoji: "🚩", label: "Made me feel unsafe" },
  { key: "fake", emoji: "🎭", label: "Fake profile" },
  { key: "other", emoji: "💬", label: "Something else" },
];

export const reports: Report[] = [
  {
    id: "001",
    reason: "Didn't show up",
    details: "Waited for 40 minutes at Bean There and nobody from the group came or replied.",
    reportedBy: "Maya Lopez",
    date: new Date(Date.now() - 1 * DAY),
    status: "open",
  },
  {
    id: "002",
    reason: "Rude or disrespectful",
    details: "One participant kept interrupting and made dismissive comments about others.",
    reportedBy: "Sam Carter",
    date: new Date(Date.now() - 3 * DAY),
    status: "reviewing",
  },
  {
    id: "003",
    reason: "Fake profile",
    details: "The person who came looked nothing like the profile and used a different name.",
    reportedBy: "Ana Popescu",
    date: new Date(Date.now() - 8 * DAY),
    status: "resolved",
  },
];
