import { Pressable, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { cn } from "@/lib/cn";
import { useKoffitoTheme } from "@/theme/theme-provider";
import { motion } from "@/theme/tokens";
import { Icon, type IconName } from "./icon";
import { Text } from "./text";

export type TabBarItem = {
  key: string;
  /** Used for accessibility; tabs are icon-only. */
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

/** Floating pill tab bar. Icon-only; the pressed icon pops. */
export function TabBar({
  items,
  activeKey,
  onChange,
  safeArea = true,
  className,
}: TabBarProps) {
  const { shadows } = useKoffitoTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{ paddingBottom: safeArea ? Math.max(insets.bottom, 14) : 0 }}
      className={cn("px-5 pt-5", className)}
    >
      <View
        accessibilityRole="tablist"
        style={{ boxShadow: shadows.raised }}
        className="flex-row items-center justify-between gap-4 rounded-full bg-surface p-2"
      >
        {items.map((item) => (
          <TabBarButton
            key={item.key}
            item={item}
            active={item.key === activeKey}
            onPress={() => onChange(item.key)}
          />
        ))}
      </View>
    </View>
  );
}

function TabBarButton({
  item,
  active,
  onPress,
}: {
  item: TabBarItem;
  active: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Icon grows, then springs back to its original size.
  const handlePress = () => {
    scale.value = withSequence(
      withTiming(1.25, { duration: motion.fast / 2 }),
      withSpring(1, motion.spring),
    );
    onPress();
  };

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={item.label}
      accessibilityState={{ selected: active }}
      onPress={handlePress}
      className="flex-1 items-center"
    >
      <View
        className={cn(
          "h-12 w-12 items-center justify-center rounded-full",
          active && "bg-primary",
        )}
      >
        <Animated.View style={animatedStyle}>
          <Icon
            name={active ? (item.activeIcon ?? item.icon) : item.icon}
            size={22}
            color={active ? "on-primary" : "muted"}
          />
          {item.badge ? <TabBadge value={item.badge} /> : null}
        </Animated.View>
      </View>
    </Pressable>
  );
}

function TabBadge({ value }: { value: number | boolean }) {
  if (value === true) {
    return (
      <View className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface bg-accent" />
    );
  }

  return (
    <View className="absolute -right-2 -top-1.5 min-w-[18px] items-center rounded-full border-2 border-surface bg-accent px-1">
      <Text className="font-body-bold text-[10px] leading-[14px] text-on-primary">
        {Number(value) > 99 ? "99+" : value}
      </Text>
    </View>
  );
}
