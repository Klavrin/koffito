import { Badge, type BadgeVariant } from "@/components/ui/badge";
import type { IconName } from "@/components/ui/icon";
import type { MeetupStatusType } from "@/types/koffito";

/** `confirmed` has no badge: it is the normal state and the label only added noise. */
const statusConfig: Partial<Record<MeetupStatusType, { label: string; variant: BadgeVariant; icon: IconName }>> = {
  pending: { label: "Waiting to hear back", variant: "warning", icon: "hourglass-outline" },
  completed: { label: "Coffee had", variant: "neutral", icon: "cafe" },
  cancelled: { label: "Cancelled", variant: "error", icon: "close-circle" },
};

export type MeetupStatusProps = {
  status: MeetupStatusType;
  className?: string;
};

export function MeetupStatus({ status, className }: MeetupStatusProps) {
  const config = statusConfig[status];

  if (!config) return null;

  return <Badge label={config.label} variant={config.variant} icon={config.icon} className={className} />;
}
