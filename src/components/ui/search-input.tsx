import { Pressable } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { motion } from "@/theme/tokens";
import { Icon } from "./icon";
import { Input, type InputProps } from "./input";

export type SearchInputProps = Omit<
  InputProps,
  "label" | "leftIcon" | "rightElement" | "secureTextEntry" | "value" | "onChangeText"
> & {
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
};

export function SearchInput({
  value,
  onChangeText,
  onClear,
  placeholder = "Search",
  ...rest
}: SearchInputProps) {
  return (
    <Input
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      leftIcon="search"
      returnKeyType="search"
      autoCorrect={false}
      fieldClassName="rounded-full"
      rightElement={
        value.length > 0 ? (
          <Animated.View entering={FadeIn.duration(motion.fast)} exiting={FadeOut.duration(motion.fast)}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              hitSlop={10}
              onPress={() => {
                onChangeText("");
                onClear?.();
              }}>
              <Icon name="close-circle" size={20} color="muted" />
            </Pressable>
          </Animated.View>
        ) : null
      }
      {...rest}
    />
  );
}
