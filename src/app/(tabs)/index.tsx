import { Redirect, router } from "expo-router";
import { ScrollView } from "react-native";

import { CafeVisitedCard } from "@/components/home/cafe-visited-card";
import { NextCoffeeCard } from "@/components/home/next-coffee-card";
import { Screen, Section } from "@/components/layout";
import { EmojiAvatar } from "@/components/profile/emoji-avatar";
import { Button, Header, IconButton } from "@/components/ui";
import { useEvents } from "@/context/events";
import { useSession } from "@/context/session";
import { visitedCafes } from "@/data/cafes";
import { isUpcoming } from "@/data/events";

export default function HomePage() {
  const { profile } = useSession();
  const { events } = useEvents();

  // Fresh accounts finish the survey before seeing Home.
  if (!profile.onboarded) {
    return <Redirect href="/survey" />;
  }

  const upcoming = events
    .filter((event) => event.joined && isUpcoming(event))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  const nextEvent = upcoming[0];

  return (
    <Screen
      tabBarInset
      header={
        <Header
          size="large"
          title={`Welcome back, ${profile.firstName}!`}
          subtitle="Who will you meet over coffee this week?"
          right={
            <>
              <IconButton
                icon="settings-outline"
                accessibilityLabel="Settings"
                onPress={() => router.push("/settings")}
              />
              <EmojiAvatar emoji={profile.avatar} size="sm" />
            </>
          }
        />
      }
    >
      {nextEvent && (
        <NextCoffeeCard
          event={nextEvent}
          onPress={() =>
            router.push({
              pathname: "/event-details",
              params: { id: nextEvent.id },
            })
          }
        />
      )}

      <Button
        title="Find coffee talk"
        size="lg"
        fullWidth
        leftIcon="cafe"
        onPress={() => router.push("/find-coffee-talk")}
      />

      <Section
        title="Cafés you've visited"
        actionLabel="Find more"
        onAction={() => router.push("/find-coffee-talk")}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="-mx-5"
          contentContainerClassName="gap-3 px-5 py-2"
        >
          {visitedCafes.map((cafe) => (
            <CafeVisitedCard
              key={cafe.id}
              cafe={cafe}
              onPress={() =>
                router.push({
                  pathname: "/event-details",
                  params: { cafeId: cafe.id },
                })
              }
            />
          ))}
        </ScrollView>
      </Section>
    </Screen>
  );
}
