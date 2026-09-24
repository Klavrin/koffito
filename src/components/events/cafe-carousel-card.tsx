import { Image } from "expo-image";
import { Pressable, View } from "react-native";

import { AvatarGroup, Button, Card, Text } from "@/components/ui";
import { toAvatarPeople } from "@/lib/people";
import { formatDateTime } from "@/lib/date";
import type { CoffeeEvent } from "@/types/koffito";

import { InfoRow } from "./info-row";

export type CafeCarouselCardProps = {
  event: CoffeeEvent;
  width: number;
  onPress: () => void;
  onJoin: () => void;
};

/** Swipeable card over the map: café picture, blurb and "Join meeting". */
export function CafeCarouselCard({ event, width, onPress, onJoin }: CafeCarouselCardProps) {
  const spotsLeft = event.maxParticipants - event.participants.length;

  return (
    <View style={{ width }}>
      <Card padding="none" className="overflow-hidden">
        {/* Only the café summary opens details, so the join button isn't nested in another button. */}
        <Pressable accessibilityRole="button" accessibilityLabel={`View ${event.cafe.name}`} onPress={onPress}>
          <Image
            source={event.cafe.photo}
            contentFit="cover"
            transition={200}
            accessibilityLabel={`Photo of ${event.cafe.name}`}
            style={{ width: "100%", height: 120 }}
          />
          <View className="gap-2 px-4 pt-4">
            <View className="flex-row items-center justify-between gap-2">
              <Text variant="heading" numberOfLines={1} className="flex-1">
                {event.cafe.name}
              </Text>
              <AvatarGroup people={toAvatarPeople(event.participants)} size="xs" />
            </View>
            <Text variant="caption" tone="muted" numberOfLines={2}>
              {event.cafe.description}
            </Text>
            <InfoRow
              size="sm"
              icon="calendar-outline"
              label={`${formatDateTime(event.date)} · ${spotsLeft} spot(s) left`}
            />
          </View>
        </Pressable>
        <View className="p-4 pt-3">
          <Button title="Join meeting" leftIcon="cafe" fullWidth disabled={spotsLeft <= 0} onPress={onJoin} />
        </View>
      </Card>
    </View>
  );
}
