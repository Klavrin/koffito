import { Image } from "expo-image";
import { View } from "react-native";

import { MeetupStatus } from "@/components/koffito";
import { AvatarGroup, Card, Text } from "@/components/ui";
import { formatDateTime } from "@/lib/date";
import type { CoffeeEvent } from "@/types/koffito";

import { InfoRow } from "./info-row";

export type EventCardProps = {
  event: CoffeeEvent;
  onPress?: () => void;
  animateIn?: boolean | number;
};

/** List card for a coffee talk: café picture, when/where and who's coming. */
export function EventCard({ event, onPress, animateIn }: EventCardProps) {
  const hidden = !!event.locationHidden;

  return (
    <Card onPress={onPress} animateIn={animateIn} padding="sm" className="gap-3">
      <View className="flex-row gap-3">
        <Image
          source={event.cafe.photo}
          contentFit="cover"
          transition={200}
          blurRadius={hidden ? 40 : 0}
          accessibilityLabel={hidden ? "Hidden café" : `Photo of ${event.cafe.name}`}
          style={{ width: 92, height: 92, borderRadius: 20 }}
        />
        <View className="flex-1 justify-center gap-1.5">
          <Text variant="heading" numberOfLines={1}>
            {hidden ? "Surprise café 🤫" : event.cafe.name}
          </Text>
          <InfoRow size="sm" icon="calendar-outline" label={formatDateTime(event.date)} />
          <InfoRow size="sm" icon="location-outline" label={hidden ? "Revealed before the meetup" : event.cafe.address} />
        </View>
      </View>

      <View className="flex-row items-center justify-between px-1 pb-1">
        <View className="flex-row items-center gap-2">
          <AvatarGroup people={event.participants} size="xs" />
          <Text variant="caption" tone="muted">
            {event.participants.length}/{event.maxParticipants} going
          </Text>
        </View>
        <MeetupStatus status={event.status} />
      </View>
    </Card>
  );
}
