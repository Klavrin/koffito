import { Redirect, router } from "expo-router";
import { ScrollView, View } from "react-native";

import { fetchVisitedVenues } from "@/api";
import { CafeVisitedCard } from "@/components/home/cafe-visited-card";
import { NextCoffeeCard } from "@/components/home/next-coffee-card";
import { Screen, Section } from "@/components/layout";
import { EmojiAvatar } from "@/components/profile/emoji-avatar";
import { Button, ErrorState, Header, IconButton, Skeleton, Text } from "@/components/ui";
import { useEvents } from "@/context/events";
import { useSession } from "@/context/session";
import { useResource } from "@/hooks/use-resource";
import { isUpcoming } from "@/lib/events";

export default function HomePage() {
  const { profile } = useSession();
  const { events, loading, error, refresh } = useEvents();
  const visited = useResource(fetchVisitedVenues);

  // Fresh accounts finish the survey before seeing Home.
  if (!profile.onboarded) {
    return <Redirect href="/survey" />;
  }

  const upcoming = events
    .filter((event) => event.joined && isUpcoming(event))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  const nextEvent = upcoming[0];
  const visitedCafes = visited.data ?? [];

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
      {loading && events.length === 0 ? (
        <Skeleton height={150} className="rounded-3xl" />
      ) : error && events.length === 0 ? (
        <ErrorState title="Couldn't load your coffee talks" onRetry={refresh} className="py-4" />
      ) : (
        nextEvent && (
          <NextCoffeeCard
            event={nextEvent}
            onPress={() =>
              router.push({
                pathname: "/event-details",
                params: { id: nextEvent.id },
              })
            }
          />
        )
      )}

      <Button
        title="Find coffee talk"
        size="lg"
        fullWidth
        leftIcon="cafe"
        onPress={() => router.push("/find-coffee-talk")}
      />

      {/* Only admins set up coffee talks; the API refuses everyone else anyway. */}
      {profile.isAdmin && (
        <Button
          title="Create coffee talk"
          variant="secondary"
          size="lg"
          fullWidth
          leftIcon="add-circle"
          onPress={() => router.push("/create-event")}
        />
      )}

      <Section
        title="Cafés you've visited"
        actionLabel="Find more"
        onAction={() => router.push("/find-coffee-talk")}
      >
        {visited.loading && visitedCafes.length === 0 ? (
          <View className="flex-row gap-3 py-2">
            <Skeleton width={176} height={160} className="rounded-3xl" />
            <Skeleton width={176} height={160} className="rounded-3xl" />
          </View>
        ) : visitedCafes.length === 0 ? (
          <Text variant="caption" tone="muted">
            {visited.error ? "We couldn't load your cafés right now." : "Your first coffee talk will put a café here."}
          </Text>
        ) : (
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
        )}
      </Section>
    </Screen>
  );
}
