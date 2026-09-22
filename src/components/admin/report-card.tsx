import { View } from "react-native";

import { Badge, type BadgeVariant, Card, type IconName, Text } from "@/components/ui";
import { reportReasonLabel } from "@/data/reports";
import { formatDate } from "@/lib/date";
import type { Report, ReportStatus } from "@/types/koffito";

export type ReportCardProps = {
  report: Report;
  onPress?: () => void;
  animateIn?: boolean | number;
};

export const reportStatusConfig: Record<ReportStatus, { label: string; variant: BadgeVariant; icon: IconName }> = {
  open: { label: "Open", variant: "warning", icon: "alert-circle-outline" },
  reviewing: { label: "In review", variant: "primary", icon: "eye-outline" },
  resolved: { label: "Resolved", variant: "success", icon: "checkmark-circle-outline" },
};

/** Report ids are UUIDs; the first characters are enough to tell them apart on screen. */
export const shortReportId = (id: string) => id.slice(0, 6).toUpperCase();

export function ReportCard({ report, onPress, animateIn }: ReportCardProps) {
  const status = reportStatusConfig[report.status];

  return (
    <Card onPress={onPress} animateIn={animateIn} className="gap-2">
      <View className="flex-row items-center justify-between gap-3">
        <Text variant="heading">Report #{shortReportId(report.id)}</Text>
        <Badge label={status.label} variant={status.variant} icon={status.icon} />
      </View>
      <Text variant="label">{reportReasonLabel(report.reason)}</Text>
      <Text tone="muted" numberOfLines={2}>
        {report.details}
      </Text>
      <Text variant="caption" tone="muted">
        {formatDate(report.date)} · by {report.reportedBy}
      </Text>
    </Card>
  );
}
