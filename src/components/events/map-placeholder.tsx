import { Pressable, View } from "react-native";

import { Icon } from "@/components/ui";
import { cn } from "@/lib/cn";
import { useKoffitoTheme } from "@/theme/theme-provider";

export type MapPin = { id: string; label: string };

export type MapPlaceholderProps = {
  pins: MapPin[];
  activeId?: string;
  onSelect: (id: string) => void;
};

/** Spots (in % of the map) where pins are dropped, reused in order. */
const pinSpots = [
  { left: "22%", top: "30%" },
  { left: "64%", top: "22%" },
  { left: "46%", top: "52%" },
  { left: "76%", top: "58%" },
  { left: "16%", top: "64%" },
] as const;

/**
 * Illustrated stand-in for a real map until a maps SDK is added.
 * Keeps the same contract a map would have: pins in, selection out.
 */
export function MapPlaceholder({ pins, activeId, onSelect }: MapPlaceholderProps) {
  const { shadows } = useKoffitoTheme();

  return (
    <View accessibilityLabel="Map of nearby coffee talks" className="flex-1 overflow-hidden bg-surface-muted">
      {/* Parks and water */}
      <View className="absolute -left-10 top-[12%] h-40 w-40 rounded-full bg-success-soft" />
      <View className="absolute -right-16 top-[40%] h-56 w-56 rounded-full bg-success-soft" />
      <View className="absolute -bottom-10 left-[20%] h-32 w-72 rounded-full bg-secondary/50" />

      {/* Streets */}
      <View className="absolute left-0 right-0 top-[44%] h-4 bg-surface" />
      <View className="absolute left-0 right-0 top-[72%] h-3 -rotate-6 bg-surface" />
      <View className="absolute bottom-0 left-[38%] top-0 w-4 bg-surface" />
      <View className="absolute bottom-0 left-[70%] top-0 w-3 rotate-12 bg-surface" />

      {/* You are here */}
      <View className="absolute left-[40%] top-[40%] h-6 w-6 items-center justify-center rounded-full bg-accent/30">
        <View className="h-3 w-3 rounded-full border-2 border-surface bg-accent" />
      </View>

      {pins.map((pin, index) => {
        const active = pin.id === activeId;
        const spot = pinSpots[index % pinSpots.length];

        return (
          <Pressable
            key={pin.id}
            accessibilityRole="button"
            accessibilityLabel={pin.label}
            accessibilityState={{ selected: active }}
            onPress={() => onSelect(pin.id)}
            hitSlop={8}
            style={{ left: spot.left, top: spot.top, boxShadow: shadows.soft }}
            className={cn(
              "absolute items-center justify-center rounded-full border-2 border-surface",
              active ? "h-14 w-14 bg-primary" : "h-11 w-11 bg-surface",
            )}>
            <Icon name="cafe" size={active ? 24 : 18} color={active ? "on-primary" : "primary"} />
          </Pressable>
        );
      })}
    </View>
  );
}
