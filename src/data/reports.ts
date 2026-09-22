import type { Report } from "@/types/koffito";

const DAY = 24 * 60 * 60 * 1000;

export const reportReasons = [
  { key: "no-show", label: "Didn't show up" },
  { key: "rude", label: "Rude or disrespectful" },
  { key: "unsafe", label: "Made me feel unsafe" },
  { key: "other", label: "Something else" },
];

export const reports: Report[] = [
  {
    id: "001",
    reason: "Didn't show up",
    details:
      "Waited for 40 minutes at Naringi and nobody from the group came or replied.",
    reportedBy: "Maya",
    date: new Date(Date.now() - 1 * DAY),
    status: "open",
  },
  {
    id: "002",
    reason: "Rude or disrespectful",
    details:
      "One participant kept interrupting and made dismissive comments about others.",
    reportedBy: "Sam",
    date: new Date(Date.now() - 3 * DAY),
    status: "reviewing",
  },
];
