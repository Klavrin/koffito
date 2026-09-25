import { Badge, type IconName } from "@/components/ui";
import { type EventPhase, getEventPhase, phaseBadge } from "@/lib/events";
import type { CoffeeEvent } from "@/types/koffito";

const icons: Record<EventPhase["kind"], IconName> = {
  available: "cafe-outline",
  full: "people",
  joined: "checkmark-circle",
  preparing: "hourglass-outline",
  ready: "lock-open-outline",
  confirmed: "checkmark-circle",
  declined: "close-circle-outline",
  missed: "time-outline",
  rate: "star-outline",
  rated: "cafe",
  over: "cafe-outline",
  cancelled: "close-circle",
  failed: "alert-circle-outline",
};

export type EventPhaseBadgeProps = { event: CoffeeEvent; className?: string };

/** The one-glance status of a coffee talk, from `getEventPhase`. */
export function EventPhaseBadge({ event, className }: EventPhaseBadgeProps) {
  const phase = getEventPhase(event);
  const { label, tone } = phaseBadge[phase.kind];
  return <Badge label={label} variant={tone} icon={icons[phase.kind]} className={className} />;
}
