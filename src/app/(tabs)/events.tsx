import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { EventCard } from "@/components/events/event-card";
import { Screen } from "@/components/layout";
import { Button, Chip, EmptyState, ErrorState, Header, IconButton, Skeleton } from "@/components/ui";
import { useEvents } from "@/context/events";
import { useProfile } from "@/context/session";
import { isUpcoming } from "@/lib/events";

type Filter = "upcoming" | "past";

const filters: { key: Filter; label: string; emoji: string }[] = [
  { key: "upcoming", label: "Upcoming", emoji: "☕" },
  { key: "past", label: "Past", emoji: "📖" },
];

export default function EventsPage() {
  const profile = useProfile();
  const { events, loading, error, refresh } = useEvents();
  const [filter, setFilter] = useState<Filter>("upcoming");

  const mine = events.filter((event) => event.joined);
  const visible = mine
    .filter((event) => (filter === "upcoming" ? isUpcoming(event) : !isUpcoming(event)))
    .sort((a, b) => (filter === "upcoming" ? a.date.getTime() - b.date.getTime() : b.date.getTime() - a.date.getTime()));

  const showSkeleton = loading && events.length === 0;
  const showError = !!error && events.length === 0;

  return (
    <Screen
      tabBarInset
      header={
        <Header
          size="large"
          title="Events"
          subtitle="Your coffee talks, all in one place"
          right={
            // Coffee talks are set up by the Koffito team.
            profile.isAdmin ? (
              <IconButton icon="add" variant="primary" accessibilityLabel="Create new event" onPress={() => router.push("/create-event")} />
            ) : undefined
          }
        />
      }
      contentClassName="gap-4">
      <View className="flex-row gap-2">
        {filters.map((item) => (
          <Chip key={item.key} label={item.label} emoji={item.emoji} selected={filter === item.key} onPress={() => setFilter(item.key)} />
        ))}
      </View>

      {showSkeleton ? (
        <>
          <Skeleton height={164} className="rounded-3xl" />
          <Skeleton height={164} className="rounded-3xl" />
        </>
      ) : showError ? (
        <ErrorState title="Couldn't load your coffee talks" onRetry={refresh} className="flex-1 justify-center" />
      ) : visible.length === 0 ? (
        <EmptyState
          emoji={filter === "upcoming" ? "☕" : "📖"}
          title={filter === "upcoming" ? "No coffee talks planned" : "No past coffee talks yet"}
          description={filter === "upcoming" ? "There's always someone new to meet." : "Your coffee stories will show up here."}
          action={{ title: "Find coffee talk", leftIcon: "search", onPress: () => router.push("/find-coffee-talk") }}
          className="flex-1 justify-center"
        />
      ) : (
        <>
          {visible.map((event, index) => (
            <EventCard
              key={event.id}
              event={event}
              animateIn={index}
              onPress={() => router.push({ pathname: "/event-details", params: { id: event.id } })}
            />
          ))}
          {profile.isAdmin && (
            <Button
              title="Create new event"
              variant="secondary"
              leftIcon="add-circle-outline"
              fullWidth
              onPress={() => router.push("/create-event")}
            />
          )}
        </>
      )}
    </Screen>
  );
}
