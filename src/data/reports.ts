import type { ReportReason } from "@/types/koffito";

export const reportReasons: { key: ReportReason; emoji: string; label: string }[] = [
  { key: "no-show", emoji: "👻", label: "Didn't show up" },
  { key: "rude", emoji: "😠", label: "Rude or disrespectful" },
  { key: "unsafe", emoji: "🚩", label: "Made me feel unsafe" },
  { key: "fake", emoji: "🎭", label: "Fake profile" },
  { key: "other", emoji: "💬", label: "Something else" },
];

export const reportReasonLabel = (reason: ReportReason) =>
  reportReasons.find((option) => option.key === reason)?.label ?? reason;
