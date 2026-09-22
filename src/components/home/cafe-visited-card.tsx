import { View } from "react-native";

import { CafePhoto } from "@/components/events/cafe-photo";
import { Card, Icon, Text } from "@/components/ui";
import type { Cafe } from "@/types/koffito";

export type CafeVisitedCardProps = {
  cafe: Cafe;
  onPress?: () => void;
};

/** Compact picture card for the "Cafés you've visited" rail. */
export function CafeVisitedCard({ cafe, onPress }: CafeVisitedCardProps) {
  return (
    <Card padding="none" onPress={onPress} className="w-44 overflow-hidden">
      <CafePhoto cafe={cafe} height={104} radius={0} />
      <View className="gap-1 p-3">
        <Text variant="label" numberOfLines={1}>
          {cafe.name}
        </Text>
        <View className="flex-row items-center gap-1">
          <Icon name="star" size={13} color="warning" />
          <Text variant="caption" tone="muted">
            {cafe.rating.toFixed(1)}
          </Text>
        </View>
      </View>
    </Card>
  );
}
