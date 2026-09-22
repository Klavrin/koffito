import { Image } from "expo-image";
import { View } from "react-native";

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
      <Image
        source={cafe.photo}
        contentFit="cover"
        transition={200}
        accessibilityLabel={`Photo of ${cafe.name}`}
        style={{ width: "100%", height: 104 }}
      />
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
