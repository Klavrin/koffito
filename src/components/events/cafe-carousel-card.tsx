import { Pressable, View } from "react-native";

import { Button, Card, Text } from "@/components/ui";
import { getSpotsLeft } from "@/lib/events";
import { formatDateTime } from "@/lib/date";
import type { CoffeeEvent } from "@/types/koffito";

import { CafePhoto } from "./cafe-photo";
import { InfoRow } from "./info-row";

export type CafeCarouselCardProps = {
  event: CoffeeEvent;
  width: number;
  onPress: () => void;
  onJoin: () => void;
  joining?: boolean;
};

/** Swipeable card over the map: café (or surprise) blurb and "Join meeting". */
export function CafeCarouselCard({ event, width, onPress, onJoin, joining = false }: CafeCarouselCardProps) {
  const spotsLeft = getSpotsLeft(event);
  const title = event.cafe?.name ?? "Surprise café 🤫";

  return (
    <View style={{ width }}>
      <Card padding="none" className="overflow-hidden">
        {/* Only the summary opens details, so the join button isn't nested in another button. */}
        <Pressable accessibilityRole="button" accessibilityLabel={`View ${title}`} onPress={onPress}>
          <CafePhoto cafe={event.cafe} height={120} radius={0} iconSize={40} />
          <View className="gap-2 px-4 pt-4">
            <Text variant="heading" numberOfLines={1}>
              {title}
            </Text>
            <Text variant="caption" tone="muted" numberOfLines={2}>
              {event.cafe?.description ?? "The café and your coffee mates are revealed shortly before you meet."}
            </Text>
            <InfoRow
              size="sm"
              icon="calendar-outline"
              label={`${formatDateTime(event.date)} · ${spotsLeft} spot(s) left`}
            />
          </View>
        </Pressable>
        <View className="p-4 pt-3">
          <Button title="Join meeting" leftIcon="cafe" fullWidth loading={joining} disabled={spotsLeft <= 0} onPress={onJoin} />
        </View>
      </Card>
    </View>
  );
}
