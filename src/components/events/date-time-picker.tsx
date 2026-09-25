import { Pressable, ScrollView, View } from "react-native";

import { Chip, Text } from "@/components/ui";
import { cn } from "@/lib/cn";
import { dayKey } from "@/lib/date";

const DAYS_AHEAD = 14;
const weekdayFormatter = new Intl.DateTimeFormat("en-GB", { weekday: "short" });
const monthFormatter = new Intl.DateTimeFormat("en-GB", { month: "short" });

export const timeSlots = ["09:00", "11:00", "13:00", "15:00", "17:00", "18:30", "20:00"];

/** Combines a picked day and an "HH:mm" slot into one Date. */
export function combineDateTime(day: Date, time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hours, minutes);
}

export type DayPickerProps = {
  value?: Date;
  onChange: (day: Date) => void;
  /** How many days to offer, starting tomorrow. */
  days?: number;
};

/** Horizontal strip of the next two weeks. */
export function DayPicker({ value, onChange, days: count = DAYS_AHEAD }: DayPickerProps) {
  const today = new Date();
  const days = Array.from(
    { length: count },
    (_, index) => new Date(today.getFullYear(), today.getMonth(), today.getDate() + index + 1),
  );

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5" contentContainerClassName="gap-2 px-5">
      {days.map((day) => {
        const active = !!value && dayKey(day) === dayKey(value);

        return (
          <Pressable
            key={dayKey(day)}
            accessibilityRole="radio"
            accessibilityLabel={day.toDateString()}
            accessibilityState={{ checked: active }}
            onPress={() => onChange(day)}
            className={cn("w-16 items-center gap-0.5 rounded-3xl py-3", active ? "bg-primary" : "bg-surface-muted")}>
            <Text variant="caption" tone={active ? "on-primary" : "muted"}>
              {weekdayFormatter.format(day)}
            </Text>
            <Text variant="heading" tone={active ? "on-primary" : "default"}>
              {day.getDate()}
            </Text>
            <Text variant="caption" tone={active ? "on-primary" : "muted"}>
              {monthFormatter.format(day)}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export type TimePickerProps = {
  value?: string;
  onChange: (time: string) => void;
  /** "HH:mm" options; defaults to `timeSlots`. */
  slots?: string[];
};

/** Every half hour between two hours, e.g. halfHourSlots(8, 21) → "08:00" … "21:00". */
export const halfHourSlots = (from: number, to: number) =>
  Array.from({ length: (to - from) * 2 + 1 }, (_, index) => {
    const minutes = from * 60 + index * 30;
    return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${minutes % 60 === 0 ? "00" : "30"}`;
  });

export function TimePicker({ value, onChange, slots = timeSlots }: TimePickerProps) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {slots.map((slot) => (
        <Chip key={slot} label={slot} size="sm" selected={slot === value} onPress={() => onChange(slot)} />
      ))}
    </View>
  );
}
