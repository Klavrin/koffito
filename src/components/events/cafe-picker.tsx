import { Image } from "expo-image";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";

import { BottomSheet, Icon, Text } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { Cafe } from "@/types/koffito";

export type CafePickerProps = {
  /** Cafés to choose from (active venues from the API). */
  cafes: Cafe[];
  value?: Cafe;
  onChange: (cafe: Cafe) => void;
  error?: string;
};

/** "Choose coffee place" field: shows the picked café and opens a sheet with the options. */
export function CafePicker({ cafes, value, onChange, error }: CafePickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <View className="gap-1.5">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={value ? `Coffee place: ${value.name}. Tap to change` : "Choose coffee place"}
        onPress={() => setOpen(true)}
        className={cn(
          "flex-row items-center gap-3 rounded-3xl border-2 bg-surface-muted p-3",
          error ? "border-error" : "border-transparent",
        )}>
        {value ? (
          <Image source={value.photo} contentFit="cover" transition={200} style={{ width: 72, height: 72, borderRadius: 18 }} />
        ) : (
          <View className="h-[72px] w-[72px] items-center justify-center rounded-[18px] bg-secondary">
            <Icon name="image-outline" size={28} color="on-secondary" />
          </View>
        )}
        <View className="flex-1 gap-0.5">
          <Text variant="label">{value ? value.name : "Choose coffee place"}</Text>
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {value ? value.address : "Pick where you'd like to meet"}
          </Text>
        </View>
        <Icon name="chevron-forward" color="muted" />
      </Pressable>
      {error && (
        <Text variant="caption" tone="error" className="px-1">
          {error}
        </Text>
      )}

      <BottomSheet visible={open} onClose={() => setOpen(false)} title="Choose coffee place" description="Where should everyone meet?">
        <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-2 pb-6">
          {cafes.map((cafe) => {
            const active = cafe.id === value?.id;

            return (
              <Pressable
                key={cafe.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                onPress={() => {
                  onChange(cafe);
                  setOpen(false);
                }}
                className={cn(
                  "flex-row items-center gap-3 rounded-3xl border-2 p-2.5",
                  active ? "border-primary bg-secondary" : "border-transparent bg-surface-muted",
                )}>
                <Image source={cafe.photo} contentFit="cover" style={{ width: 56, height: 56, borderRadius: 16 }} />
                <View className="flex-1">
                  <Text variant="label" tone={active ? "on-secondary" : "default"}>
                    {cafe.name}
                  </Text>
                  <Text variant="caption" tone={active ? "on-secondary" : "muted"} numberOfLines={1}>
                    {cafe.address}
                  </Text>
                </View>
                <View className="flex-row items-center gap-1 pr-1">
                  <Icon name="star" size={13} color="warning" />
                  <Text variant="caption" tone={active ? "on-secondary" : "muted"}>
                    {cafe.rating.toFixed(1)}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </BottomSheet>
    </View>
  );
}
