import type { ReportReason } from "@/types/koffito";

/** Reasons a user can pick; the keys match the database's `report_reason` values. */
export const reportReasons: { key: ReportReason; label: string }[] = [
  { key: "no-show", label: "Didn't show up" },
  { key: "rude", label: "Rude or disrespectful" },
  { key: "unsafe", label: "Made me feel unsafe" },
  { key: "fake", label: "Fake profile" },
  { key: "other", label: "Something else" },
];

export const reportReasonLabel = (reason: ReportReason) =>
  reportReasons.find((option) => option.key === reason)?.label ?? reason;
