import type { PropsWithChildren } from "react";
import { View } from "react-native";
import Animated, { FadeInRight } from "react-native-reanimated";

import { Badge, Text } from "@/components/ui";
import { motion } from "@/theme/tokens";

export type SurveyStepProps = PropsWithChildren<{
  section: string;
  question: string;
  hint?: string;
}>;

/** Question heading + content, sliding in whenever the step changes (key it by step). */
export function SurveyStep({ section, question, hint, children }: SurveyStepProps) {
  return (
    <Animated.View entering={FadeInRight.duration(motion.base)}>
      <View className="gap-5">
        <View className="gap-2">
          <Badge label={section} variant="primary" className="self-start" />
          <Text variant="title" accessibilityRole="header">
            {question}
          </Text>
          {hint && <Text tone="muted">{hint}</Text>}
        </View>
        {children}
      </View>
    </Animated.View>
  );
}
