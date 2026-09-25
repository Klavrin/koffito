import { View } from "react-native";

import { EventPhaseBadge } from "@/components/events/event-phase-badge";
import { Card, Icon, Text } from "@/components/ui";
import { formatDateTime } from "@/lib/date";
import { canSeeDetails, getEventPhase, phaseMessage } from "@/lib/events";
import type { CoffeeEvent } from "@/types/koffito";

export type NextCoffeeCardProps = {
  event: CoffeeEvent;
  onPress: () => void;
};

/** Highlight card for the closest upcoming coffee talk. */
export function NextCoffeeCard({ event, onPress }: NextCoffeeCardProps) {
  const visible = canSeeDetails(getEventPhase(event));

  return (
    <Card onPress={onPress} animateIn className="gap-3 bg-secondary">
      <View className="flex-row items-center justify-between">
        <Text variant="label" tone="on-secondary">
          Your next coffee talk
        </Text>
        <EventPhaseBadge event={event} />
      </View>

      <View className="gap-1">
        <Text variant="heading" tone="on-secondary">
          {visible && event.cafe ? event.cafe.name : "Mystery café"}
        </Text>
        <Text variant="caption" tone="on-secondary">
          {formatDateTime(event.date)}
        </Text>
      </View>

      <View className="flex-row items-center justify-between gap-3">
        <Text variant="caption" tone="on-secondary" className="flex-1">
          {phaseMessage(event, formatDateTime)}
        </Text>
        <Icon name="arrow-forward-circle" size={28} color="primary" />
      </View>
    </Card>
  );
}
