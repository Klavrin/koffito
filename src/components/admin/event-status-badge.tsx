import { Badge, type BadgeVariant } from "@/components/ui";
import type { EventStatus } from "@/types/koffito";

export const eventStatusConfig: Record<EventStatus, { label: string; variant: BadgeVariant }> = {
  open: { label: "Open", variant: "primary" },
  closed: { label: "Closed", variant: "warning" },
  matched: { label: "Matched", variant: "success" },
  revealed: { label: "Revealed", variant: "success" },
  completed: { label: "Completed", variant: "neutral" },
  failed: { label: "Failed", variant: "error" },
  cancelled: { label: "Cancelled", variant: "error" },
};

/** An event's status as the admin sees it. */
export function EventStatusBadge({ status, className }: { status: EventStatus; className?: string }) {
  const { label, variant } = eventStatusConfig[status];
  return <Badge label={label} variant={variant} dot className={className} />;
}
