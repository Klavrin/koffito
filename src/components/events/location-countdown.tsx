import { useEffect, useState } from "react";
import { View } from "react-native";

import { Icon, Text } from "@/components/ui";
import { formatCountdown } from "@/lib/date";

export type LocationCountdownProps = {
  /** Moment the café gets revealed. */
  revealAt: Date;
  /** Text above the timer. */
  label?: string;
};

/** Pill shown over the blurred café picture: "Revealing location in 22:04:27". */
export function LocationCountdown({ revealAt, label = "Revealing location in" }: LocationCountdownProps) {
  // Depend on the timestamp, not the Date object, so a fresh Date each render doesn't restart the timer.
  const target = revealAt.getTime();
  const [remaining, setRemaining] = useState(() => target - Date.now());

  useEffect(() => {
    const timer = setInterval(() => setRemaining(target - Date.now()), 1000);
    return () => clearInterval(timer);
  }, [target]);

  return (
    <View
      accessibilityRole="timer"
      accessibilityLabel={`${label} ${formatCountdown(remaining)}`}
      className="items-center gap-1 rounded-3xl bg-overlay/60 px-6 py-4">
      <Icon name="lock-closed" size={22} color="#FFFDF9" />
      <Text variant="caption" className="text-[#FFFDF9]">
        {label}
      </Text>
      <Text variant="title" className="text-[#FFFDF9]">
        {formatCountdown(remaining)}
      </Text>
    </View>
  );
}
