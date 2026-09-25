import { router, type Href } from "expo-router";
import { View } from "react-native";

import { AdminOnly } from "@/components/admin/admin-only";
import { Screen } from "@/components/layout";
import { Card, Header, Icon, type IconName, Text } from "@/components/ui";
import { goBack } from "@/lib/navigation";

const areas: { href: Href; icon: IconName; title: string; description: string }[] = [
  {
    href: "/admin/events",
    icon: "calendar-outline",
    title: "Coffee talks",
    description: "Create coffee talks and watch groups form",
  },
  { href: "/admin/cafes", icon: "cafe-outline", title: "Cafés", description: "Add, edit and deactivate cafés" },
  { href: "/admin/reports", icon: "flag-outline", title: "Reports", description: "Review what people reported" },
];

export default function AdminHomePage() {
  return (
    <AdminOnly title="Admin">
      <Screen header={<Header title="Admin" subtitle="Behind the counter" onBack={goBack} />} contentClassName="gap-3">
        {areas.map((area, index) => (
          <Card key={area.title} animateIn={index} onPress={() => router.push(area.href)} className="flex-row items-center gap-4">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-secondary">
              <Icon name={area.icon} size={22} color="on-secondary" />
            </View>
            <View className="flex-1 gap-0.5">
              <Text variant="heading">{area.title}</Text>
              <Text variant="caption" tone="muted">
                {area.description}
              </Text>
            </View>
            <Icon name="chevron-forward" size={20} color="muted" />
          </Card>
        ))}
      </Screen>
    </AdminOnly>
  );
}
