import { useEffect, useState } from "react";
import { View } from "react-native";

import { Icon, Text } from "@/components/ui";
import { formatCountdown } from "@/lib/date";

export type LocationCountdownProps = {
  /** Moment the café gets revealed. */
  revealAt: Date;
};

/** How long before the meetup a surprise café is revealed. */
export const REVEAL_BEFORE_MS = 60 * 60 * 1000;

/** Pill shown over the blurred café picture: "Revealing location in 22:04:27". */
export function LocationCountdown({ revealAt }: LocationCountdownProps) {
  const [remaining, setRemaining] = useState(() => revealAt.getTime() - Date.now());

  useEffect(() => {
    const timer = setInterval(() => setRemaining(revealAt.getTime() - Date.now()), 1000);
    return () => clearInterval(timer);
  }, [revealAt]);

  return (
    <View
      accessibilityRole="timer"
      accessibilityLabel={`Revealing location in ${formatCountdown(remaining)}`}
      className="items-center gap-1 rounded-3xl bg-overlay/60 px-6 py-4">
      <Icon name="lock-closed" size={22} color="#FFFDF9" />
      <Text variant="caption" className="text-[#FFFDF9]">
        Revealing location in
      </Text>
      <Text variant="title" className="text-[#FFFDF9]">
        {formatCountdown(remaining)}
      </Text>
    </View>
  );
}
