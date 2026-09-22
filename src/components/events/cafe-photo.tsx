import { Image } from "expo-image";
import { type DimensionValue, View } from "react-native";

import { Icon } from "@/components/ui";
import type { Cafe } from "@/types/koffito";

export type CafePhotoProps = {
  cafe?: Cafe;
  /** Show the surprise placeholder even when the café is known. */
  hidden?: boolean;
  width?: DimensionValue;
  height: number;
  radius?: number;
  iconSize?: number;
};

/** Café picture with a warm placeholder for surprise cafés and venues without a photo. */
export function CafePhoto({ cafe, hidden = false, width = "100%", height, radius = 20, iconSize = 28 }: CafePhotoProps) {
  const frame = { width, height, borderRadius: radius };

  if (!hidden && cafe?.photo) {
    return (
      <Image
        source={cafe.photo}
        contentFit="cover"
        transition={200}
        accessibilityLabel={`Photo of ${cafe.name}`}
        style={frame}
      />
    );
  }

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={hidden || !cafe ? "Hidden café" : `${cafe.name} has no photo yet`}
      style={frame}
      className="items-center justify-center bg-secondary">
      <Icon name={hidden || !cafe ? "lock-closed" : "cafe"} size={iconSize} color="on-secondary" />
    </View>
  );
}
