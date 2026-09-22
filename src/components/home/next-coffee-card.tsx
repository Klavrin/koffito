import { View } from "react-native";

import { AvatarGroup, Badge, Card, Icon, Text } from "@/components/ui";
import { toAvatarPeople } from "@/lib/events";
import { formatDateTime, formatRelativeDay } from "@/lib/date";
import type { CoffeeEvent } from "@/types/koffito";

export type NextCoffeeCardProps = {
  event: CoffeeEvent;
  onPress: () => void;
};

/** Highlight card for the closest upcoming coffee talk. */
export function NextCoffeeCard({ event, onPress }: NextCoffeeCardProps) {
  return (
    <Card onPress={onPress} animateIn className="gap-3 bg-secondary">
      <View className="flex-row items-center justify-between">
        <Text variant="label" tone="on-secondary">
          Your next coffee talk
        </Text>
        <Badge label={formatRelativeDay(event.date)} variant="primary" icon="time-outline" />
      </View>

      <View className="gap-1">
        <Text variant="heading" tone="on-secondary">
          {event.cafe?.name ?? "Surprise café 🤫"}
        </Text>
        <Text variant="caption" tone="on-secondary">
          {formatDateTime(event.date)}
        </Text>
      </View>

      <View className="flex-row items-center justify-between">
        {event.participants.length > 0 ? (
          <AvatarGroup people={toAvatarPeople(event.participants)} size="sm" />
        ) : (
          <Text variant="caption" tone="on-secondary">
            Your coffee mates are revealed soon
          </Text>
        )}
        <Icon name="arrow-forward-circle" size={28} color="primary" />
      </View>
    </Card>
  );
}
