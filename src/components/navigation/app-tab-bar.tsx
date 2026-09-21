import type { Tabs } from "expo-router";
import type { ComponentProps } from "react";
import { View } from "react-native";

import { TabBar, type TabBarItem } from "@/components/ui";

type TabBarRenderProps = Parameters<
  NonNullable<ComponentProps<typeof Tabs>["tabBar"]>
>[0];

/** Tabs shown in the floating bar, keyed by their route name inside `(tabs)`. */
const tabs: TabBarItem[] = [
  { key: "index", label: "Home", icon: "home-outline", activeIcon: "home" },
  { key: "events", label: "Events", icon: "cafe-outline", activeIcon: "cafe" },
  {
    key: "profile",
    label: "Profile",
    icon: "person-outline",
    activeIcon: "person",
  },
];

/** Adapts expo-router's tab state to the floating Koffito `TabBar`. */
export function AppTabBar({ state, navigation }: TabBarRenderProps) {
  const activeKey = state.routes[state.index]?.name ?? "index";

  const handleChange = (key: string) => {
    const route = state.routes.find((candidate) => candidate.name === key);
    if (!route) return;

    const event = navigation.emit({
      type: "tabPress",
      target: route.key,
      canPreventDefault: true,
    });

    if (key !== activeKey && !event.defaultPrevented) {
      navigation.navigate(route.name, route.params);
    }
  };

  return (
    <View
      style={{ pointerEvents: "box-none" }}
      className="absolute inset-x-0 bottom-0 items-center"
    >
      <TabBar
        items={tabs}
        activeKey={activeKey}
        onChange={handleChange}
        className="w-[232px] max-w-full"
      />
    </View>
  );
}
