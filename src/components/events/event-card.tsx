import { View } from "react-native";

import { MeetupStatus } from "@/components/koffito";
import { AvatarGroup, Card, Text } from "@/components/ui";
import { goingCount, isLocationHidden, toAvatarPeople } from "@/lib/events";
import { formatDateTime } from "@/lib/date";
import type { CoffeeEvent } from "@/types/koffito";

import { CafePhoto } from "./cafe-photo";
import { InfoRow } from "./info-row";

export type EventCardProps = {
  event: CoffeeEvent;
  onPress?: () => void;
  animateIn?: boolean | number;
};

/** List card for a coffee talk: café picture, when/where and who's coming. */
export function EventCard({ event, onPress, animateIn }: EventCardProps) {
  const hidden = isLocationHidden(event);

  return (
    <Card onPress={onPress} animateIn={animateIn} padding="sm" className="gap-3">
      <View className="flex-row gap-3">
        <CafePhoto cafe={event.cafe} hidden={hidden} width={92} height={92} />
        <View className="flex-1 justify-center gap-1.5">
          <Text variant="heading" numberOfLines={1}>
            {event.cafe?.name ?? "Surprise café 🤫"}
          </Text>
          <InfoRow size="sm" icon="calendar-outline" label={formatDateTime(event.date)} />
          <InfoRow size="sm" icon="location-outline" label={event.cafe?.address ?? "Revealed before the meetup"} />
        </View>
      </View>

      <View className="flex-row items-center justify-between px-1 pb-1">
        <View className="flex-row items-center gap-2">
          <AvatarGroup people={toAvatarPeople(event.participants)} size="xs" />
          <Text variant="caption" tone="muted">
            {hidden ? "Guests revealed with the café" : `${goingCount(event)}/${event.maxParticipants} going`}
          </Text>
        </View>
        <MeetupStatus status={event.status} />
      </View>
    </Card>
  );
}
