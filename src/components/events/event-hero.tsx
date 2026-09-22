import { Image } from "expo-image";
import type { ReactNode } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { IconButton } from "@/components/ui";

export type EventHeroProps = {
  photo: string;
  /** Blur the picture for surprise cafés. */
  hidden?: boolean;
  onBack: () => void;
  /** Buttons on the top right. */
  actions?: ReactNode;
  /** Centered overlay, e.g. the reveal countdown. */
  children?: ReactNode;
  accessibilityLabel: string;
};

const HERO_HEIGHT = 300;

/** Full-bleed café picture with floating back/action buttons. */
export function EventHero({ photo, hidden = false, onBack, actions, children, accessibilityLabel }: EventHeroProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ height: HERO_HEIGHT }} className="overflow-hidden rounded-b-sheet bg-surface-muted">
      <Image
        source={photo}
        contentFit="cover"
        transition={250}
        blurRadius={hidden ? 60 : 0}
        accessibilityLabel={accessibilityLabel}
        style={{ width: "100%", height: "100%" }}
      />

      {children && <View className="absolute inset-0 items-center justify-center">{children}</View>}

      <View style={{ top: insets.top + 8 }} className="absolute inset-x-5 flex-row items-center justify-between">
        <IconButton icon="chevron-back" accessibilityLabel="Go back" onPress={onBack} />
        <View className="flex-row gap-2">{actions}</View>
      </View>
    </View>
  );
}
