import { useState } from "react";
import { Pressable, View } from "react-native";

import { BottomSheet, Button, Text } from "@/components/ui";
import { avatarOptions } from "@/data/survey";
import { cn } from "@/lib/cn";

import { EmojiAvatar } from "./emoji-avatar";

export type AvatarPickerProps = {
  value?: string;
  onChange: (emoji: string) => void;
  /** Button label, e.g. "Choose avatar" or "Change avatar". */
  label?: string;
};

/** Current avatar + a button that opens a sheet with the avatar choices. */
export function AvatarPicker({ value, onChange, label = "Choose avatar" }: AvatarPickerProps) {
  const [open, setOpen] = useState(false);

  const handlePick = (emoji: string) => {
    onChange(emoji);
    setOpen(false);
  };

  return (
    <View className="flex-row items-center justify-center gap-4">
      <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={() => setOpen(true)}>
        <EmojiAvatar emoji={value} size="xl" />
      </Pressable>
      <Button title={label} variant="secondary" size="sm" leftIcon="happy-outline" onPress={() => setOpen(true)} />

      <BottomSheet
        visible={open}
        onClose={() => setOpen(false)}
        title="Pick your avatar"
        description="Choose the one that feels most like you.">
        <View className="flex-row flex-wrap justify-center gap-3 pb-6">
          {avatarOptions.map((emoji) => (
            <Pressable
              key={emoji}
              accessibilityRole="button"
              accessibilityLabel={`Avatar ${emoji}`}
              accessibilityState={{ selected: emoji === value }}
              onPress={() => handlePick(emoji)}
              className={cn(
                "h-16 w-16 items-center justify-center rounded-full border-2",
                emoji === value ? "border-primary bg-secondary" : "border-transparent bg-surface-muted",
              )}>
              <Text className="text-[30px] leading-[40px]">{emoji}</Text>
            </Pressable>
          ))}
        </View>
      </BottomSheet>
    </View>
  );
}
