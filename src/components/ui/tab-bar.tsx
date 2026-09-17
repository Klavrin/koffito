import { Pressable, View } from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { cn } from "@/lib/cn";
import { useKoffitoTheme } from "@/theme/theme-provider";
import { motion } from "@/theme/tokens";
import { Icon, type IconName } from "./icon";
import { Text } from "./text";

export type TabBarItem = {
  key: string;
  label: string;
  icon: IconName;
  activeIcon?: IconName;
  /** Small count bubble; `true` shows a dot. */
  badge?: number | boolean;
};

export type TabBarProps = {
  items: TabBarItem[];
  activeKey: string;
  onChange: (key: string) => void;
  /** Add the bottom safe-area inset. */
  safeArea?: boolean;
  className?: string;
};

/** Floating pill tab bar. The active tab expands into a warm pill with its label. */
export function TabBar({ items, activeKey, onChange, safeArea = true, className }: TabBarProps) {
  const { shadows } = useKoffitoTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ paddingBottom: safeArea ? Math.max(insets.bottom, 12) : 0 }} className={cn("px-5", className)}>
      <View
        accessibilityRole="tablist"
        style={{ boxShadow: shadows.raised }}
        className="flex-row items-center justify-between rounded-full bg-surface p-2">
        {items.map((item) => {
          const active = item.key === activeKey;

          return (
            <Pressable
              key={item.key}
              accessibilityRole="tab"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: active }}
              onPress={() => onChange(item.key)}
              className={cn(!active && "flex-1 items-center")}>
              <Animated.View
                layout={LinearTransition.duration(motion.base)}
                className={cn(
                  "h-12 flex-row items-center justify-center gap-2 rounded-full",
                  active ? "bg-primary px-5" : "w-12",
                )}>
                <View>
                  <Icon
                    name={active ? (item.activeIcon ?? item.icon) : item.icon}
                    size={22}
                    color={active ? "on-primary" : "muted"}
                  />
                  {item.badge ? <TabBadge value={item.badge} /> : null}
                </View>
                {active && (
                  <Text variant="label" tone="on-primary" numberOfLines={1}>
                    {item.label}
                  </Text>
                )}
              </Animated.View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function TabBadge({ value }: { value: number | boolean }) {
  if (value === true) {
    return <View className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface bg-accent" />;
  }

  return (
    <View className="absolute -right-2 -top-1.5 min-w-[18px] items-center rounded-full border-2 border-surface bg-accent px-1">
      <Text className="font-body-bold text-[10px] leading-[14px] text-on-primary">
        {Number(value) > 99 ? "99+" : value}
      </Text>
    </View>
  );
}
