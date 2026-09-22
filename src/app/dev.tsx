import { router } from "expo-router";
import { View } from "react-native";

import { Screen, Section } from "@/components/layout";
import { Button, Header } from "@/components/ui";
import { useSession } from "@/context/session";

/** DEV ONLY — jump to any screen. Delete this file and the DEV ONLY lines in `_layout.tsx`. */

type Link = { label: string; href: Parameters<typeof router.push>[0] };

const groups: {
  title: string;
  guard: "none" | "new" | "returning";
  links: Link[];
}[] = [
  {
    title: "(auth)",
    guard: "none",
    links: [
      { label: "welcome", href: "/welcome" },
      { label: "login", href: "/login" },
      { label: "register", href: "/register" },
    ],
  },
  {
    title: "onboarding",
    guard: "new",
    links: [
      { label: "survey", href: "/survey" },
      {
        label: "survey — retake",
        href: { pathname: "/survey", params: { mode: "interests" } },
      },
    ],
  },
  {
    title: "(tabs)",
    guard: "returning",
    links: [
      { label: "index - home", href: "/" },
      { label: "events", href: "/events" },
      { label: "profile", href: "/profile" },
    ],
  },
  {
    title: "(app)",
    guard: "returning",
    links: [
      { label: "find-coffee-talk", href: "/find-coffee-talk" },
      { label: "create-event", href: "/create-event" },
      {
        label: "event-details",
        href: { pathname: "/event-details", params: { id: "e1" } },
      },
      {
        label: "report",
        href: { pathname: "/report", params: { eventId: "e1" } },
      },
      { label: "person", href: { pathname: "/person", params: { id: "u1" } } },
      { label: "settings", href: "/settings" },
      { label: "survey-profile-settings", href: "/survey-profile-settings" },
      { label: "admin — reports", href: "/admin" },
      { label: "components", href: "/components" },
    ],
  },
];

export default function DevMenuPage() {
  const { session } = useSession();

  const open = (link: Link, guard: "none" | "new" | "returning") => {
    if (guard !== "none" && !session) {
      router.push("/login");
      return;
    }
    router.push(link.href);
  };

  return (
    <Screen header={<Header title="Dev menu" />}>
      {groups.map((group) => (
        <Section key={group.title} title={group.title}>
          <View className="gap-2">
            {group.links.map((link) => (
              <Button
                key={link.label}
                title={link.label}
                variant="outline"
                fullWidth
                onPress={() => open(link, group.guard)}
              />
            ))}
          </View>
        </Section>
      ))}
    </Screen>
  );
}
