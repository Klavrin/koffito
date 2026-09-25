import { Image } from "expo-image";
import type { ReactNode } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon, IconButton } from "@/components/ui";

export type EventHeroProps = {
  /** Missing for mystery cafés and venues without a picture. */
  photo?: string | null;
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
      {photo ? (
        <Image
          source={photo}
          contentFit="cover"
          transition={250}
          blurRadius={hidden ? 60 : 0}
          accessibilityLabel={accessibilityLabel}
          style={{ width: "100%", height: "100%" }}
        />
      ) : (
        <View accessibilityRole="image" accessibilityLabel={accessibilityLabel} className="flex-1 items-center justify-center bg-secondary">
          <Icon name={hidden ? "lock-closed" : "cafe"} size={72} color="on-secondary" />
        </View>
      )}

      {children && <View className="absolute inset-0 items-center justify-center">{children}</View>}

      <View style={{ top: insets.top + 8 }} className="absolute inset-x-5 flex-row items-center justify-between">
        <IconButton icon="chevron-back" accessibilityLabel="Go back" onPress={onBack} />
        <View className="flex-row gap-2">{actions}</View>
      </View>
    </View>
  );
}
