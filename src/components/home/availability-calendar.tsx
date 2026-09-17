import { Pressable, View } from "react-native";

import { Text } from "@/components/ui";
import { cn } from "@/lib/cn";
import { dayKey, startOfDay } from "@/lib/date";

export type AvailabilityCalendarProps = {
  /** Any date inside the month to show. */
  month: Date;
  /** Selected days as `dayKey` strings. */
  selected: string[];
  onToggle: (key: string) => void;
  /** Days can only be toggled while editing. */
  editable?: boolean;
  /** Days with a planned coffee talk get a small dot. */
  marked?: string[];
};

const weekdays = ["M", "T", "W", "T", "F", "S", "S"];

/** Builds the month grid (Monday first); `null` pads the leading empty cells. */
function buildDays(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const offset = (first.getDay() + 6) % 7;

  return [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: count }, (_, index) => new Date(month.getFullYear(), month.getMonth(), index + 1)),
  ];
}

export function AvailabilityCalendar({ month, selected, onToggle, editable = false, marked = [] }: AvailabilityCalendarProps) {
  const today = startOfDay(new Date()).getTime();

  return (
    <View className="gap-1">
      <View className="flex-row">
        {weekdays.map((weekday, index) => (
          <Text key={index} variant="caption" tone="muted" className="w-[14.28%] text-center">
            {weekday}
          </Text>
        ))}
      </View>

      <View className="flex-row flex-wrap">
        {buildDays(month).map((day, index) => {
          if (!day) return <View key={`pad-${index}`} className="w-[14.28%]" />;

          const key = dayKey(day);
          const past = day.getTime() < today;
          const isToday = day.getTime() === today;
          const active = selected.includes(key);

          return (
            <View key={key} className="w-[14.28%] items-center py-0.5">
              <Pressable
                accessibilityRole="checkbox"
                accessibilityLabel={day.toDateString()}
                accessibilityState={{ checked: active, disabled: past || !editable }}
                disabled={past || !editable}
                onPress={() => onToggle(key)}
                className={cn(
                  "h-10 w-10 items-center justify-center rounded-full",
                  active && "bg-primary",
                  !active && isToday && "border-2 border-primary/50",
                  !active && editable && !past && "bg-surface-muted",
                )}>
                <Text
                  variant="label"
                  tone={active ? "on-primary" : past ? "muted" : "default"}
                  className={cn(past && "opacity-50")}>
                  {day.getDate()}
                </Text>
                {marked.includes(key) && (
                  <View className={cn("absolute bottom-1 h-1.5 w-1.5 rounded-full", active ? "bg-on-primary" : "bg-accent")} />
                )}
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}
