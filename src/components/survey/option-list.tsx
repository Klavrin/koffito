import { Pressable, View } from "react-native";

import { Icon, Text } from "@/components/ui";
import type { SurveyOption } from "@/data/survey";
import { cn } from "@/lib/cn";

export type OptionListProps = {
  options: SurveyOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  /** Maximum number of answers; 1 behaves like radio buttons. */
  max: number;
};

/** Tappable answer rows. Single-choice swaps the answer; multi-choice stops at `max`. */
export function OptionList({ options, selected, onChange, max }: OptionListProps) {
  const single = max === 1;
  const full = !single && selected.length >= max;

  const toggle = (key: string) => {
    if (single) return onChange([key]);
    if (selected.includes(key)) return onChange(selected.filter((item) => item !== key));
    if (!full) onChange([...selected, key]);
  };

  return (
    <View accessibilityRole={single ? "radiogroup" : undefined} className="gap-3">
      {options.map((option) => {
        const active = selected.includes(option.key);
        const disabled = full && !active;

        return (
          <Pressable
            key={option.key}
            accessibilityRole={single ? "radio" : "checkbox"}
            accessibilityLabel={option.label}
            accessibilityState={{ checked: active, disabled }}
            disabled={disabled}
            onPress={() => toggle(option.key)}
            className={cn(
              "min-h-[60px] flex-row items-center gap-3 rounded-3xl border-2 px-4 py-3",
              active ? "border-primary bg-secondary" : "border-transparent bg-surface",
              disabled && "opacity-50",
            )}>
            <Text className="text-[24px] leading-[32px]">{option.emoji}</Text>
            <Text variant="label" tone={active ? "on-secondary" : "default"} className="flex-1">
              {option.label}
            </Text>
            <Icon
              name={active ? (single ? "radio-button-on" : "checkmark-circle") : single ? "radio-button-off" : "ellipse-outline"}
              size={24}
              color={active ? "primary" : "border"}
            />
          </Pressable>
        );
      })}
    </View>
  );
}
