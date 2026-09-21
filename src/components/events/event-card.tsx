import { Image } from "expo-image";
import { View } from "react-native";

import { MeetupStatus } from "@/components/koffito";
import { AvatarGroup, Card, Text } from "@/components/ui";
import { formatAttendance, getCafeLabel, isLocationHidden } from "@/data/events";
import { toAvatarPeople } from "@/data/users";
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
  const hidden = isLocationHidden(event);

  return (
    <Card onPress={onPress} animateIn={animateIn} padding="sm" className="gap-3">
      <View className="flex-row gap-3">
        <View>
          <Image
            source={event.cafe.photo}
            contentFit="cover"
            transition={200}
            blurRadius={hidden ? 40 : 0}
            accessibilityLabel={hidden ? "Locked café" : `Photo of ${event.cafe.name}`}
            style={{ width: 92, height: 92, borderRadius: 20 }}
          />
          {/* Marks the blurred photo as deliberately hidden, not a failed image. */}
          {hidden && (
            <View className="absolute inset-0 items-center justify-center">
              <Text className="text-[40px] leading-[48px]">?</Text>
            </View>
          )}
        </View>
        <View className="flex-1 justify-center gap-1.5">
          <Text variant="heading" numberOfLines={1}>
            {getCafeLabel(event)}
          </Text>
          <InfoRow size="sm" icon="calendar-outline" label={formatDateTime(event.date)} />
          <InfoRow size="sm" icon="location-outline" label={hidden ? "Revealed before the meetup" : event.cafe.address} />
        </View>
      </View>

      <View className="flex-row items-center justify-between px-1 pb-1">
        <View className="flex-row items-center gap-2">
          {/* Faces and headcount stay hidden until the café is revealed. */}
          {!hidden && <AvatarGroup people={toAvatarPeople(event.participants)} size="xs" />}
          <Text variant="caption" tone="muted">
            {formatAttendance(event)}
          </Text>
        </View>
        <MeetupStatus status={event.status} />
      </View>
    </Card>
  );
}
