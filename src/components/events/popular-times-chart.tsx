import { View } from "react-native";

import { Text } from "@/components/ui";
import { cn } from "@/lib/cn";

export type PopularTimesChartProps = {
  /** Busyness per slot, 0-100. */
  values: number[];
  labels: string[];
};

const CHART_HEIGHT = 96;

/** Minimal bar chart; the busiest slot is highlighted. */
export function PopularTimesChart({ values, labels }: PopularTimesChartProps) {
  const peak = Math.max(...values);

  return (
    <View accessibilityLabel={`Popular times. Busiest around ${labels[values.indexOf(peak)]}:00`} className="gap-2">
      <View style={{ height: CHART_HEIGHT }} className="flex-row items-end gap-2">
        {values.map((value, index) => (
          <View
            key={labels[index]}
            style={{ height: Math.max(8, (value / 100) * CHART_HEIGHT) }}
            className={cn("flex-1 rounded-t-xl rounded-b-md", value === peak ? "bg-primary" : "bg-secondary")}
          />
        ))}
      </View>
      <View className="flex-row gap-2">
        {labels.map((label) => (
          <Text key={label} variant="caption" tone="muted" className="flex-1 text-center">
            {label}h
          </Text>
        ))}
      </View>
    </View>
  );
}
