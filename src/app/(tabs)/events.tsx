import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { EventCard } from "@/components/events/event-card";
import { RateExperienceSheet } from "@/components/events/rate-experience-sheet";
import { Screen } from "@/components/layout";
import { Chip, EmptyState, ErrorState, Header, IconButton, Skeleton, useToast } from "@/components/ui";
import { useEvents } from "@/context/events";
import { useSession } from "@/context/session";
import { describeError } from "@/lib/errors";
import { isUpcoming } from "@/lib/events";

type Filter = "upcoming" | "past";

const filters: { key: Filter; label: string }[] = [
  { key: "upcoming", label: "Upcoming" },
  { key: "past", label: "Past" },
];

export default function EventsPage() {
  const { profile } = useSession();
  const { events, loading, error, refresh, reviewEvent } = useEvents();
  const toast = useToast();
  const [filter, setFilter] = useState<Filter>("upcoming");
  // The completed coffee talk being rated.
  const [rating, setRating] = useState<string | null>(null);

  const openDetails = (id: string, ask?: boolean) =>
    router.push({ pathname: "/event-details", params: ask ? { id, ask: "1" } : { id } });

  const handleRate = async (value: number, comment: string) => {
    const id = rating;
    setRating(null);
    if (!id) return;

    try {
      await reviewEvent(id, { rating: value, comment });
      toast.show({ title: "Thanks for the review!", variant: "success" });
    } catch (rateError) {
      toast.show({ title: "Couldn't save your review", message: describeError(rateError), variant: "error" });
    }
  };

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
            profile.isAdmin ? (
              <IconButton
                icon="add"
                variant="primary"
                accessibilityLabel="Manage coffee talks"
                onPress={() => router.push("/admin/events")}
              />
            ) : undefined
          }
        />
      }
      contentClassName="gap-4">
      <View className="flex-row gap-2">
        {filters.map((item) => (
          <Chip key={item.key} label={item.label} selected={filter === item.key} onPress={() => setFilter(item.key)} />
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
          emoji="☕"
          title={filter === "upcoming" ? "No coffee buddies yet" : "No past coffee talks yet"}
          description={filter === "upcoming" ? "There's always someone new to meet." : "Your coffee stories will show up here."}
          action={{ title: "Find coffee talk", leftIcon: "search", onPress: () => router.push("/find-coffee-talk") }}
          className="flex-1 justify-center"
        />
      ) : (
        visible.map((event, index) => (
          <EventCard
            key={event.id}
            event={event}
            animateIn={index}
            onPress={() => openDetails(event.id)}
            onReveal={() => openDetails(event.id, true)}
            onRate={() => setRating(event.id)}
          />
        ))
      )}

      <RateExperienceSheet
        visible={!!rating}
        onClose={() => setRating(null)}
        onSubmit={handleRate}
        onReport={() => {
          const id = rating;
          setRating(null);
          if (id) openDetails(id);
        }}
      />
    </Screen>
  );
}
