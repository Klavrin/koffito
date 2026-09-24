import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { EventCard } from "@/components/events/event-card";
import { MissedFeedbackSheet } from "@/components/events/missed-feedback-sheet";
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
  const { events, loading, error, refresh, confirmAttendance, reviewEvent } = useEvents();
  const toast = useToast();
  const [filter, setFilter] = useState<Filter>("upcoming");
  // Which past coffee talk is being reviewed, and in which sheet.
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [missed, setMissed] = useState<string | null>(null);

  const openReport = (id: string | null) => {
    setReviewing(null);
    setMissed(null);
    router.push({ pathname: "/report", params: id ? { eventId: id } : {} });
  };

  const handleConfirm = async (id: string, happened: boolean) => {
    // A missed coffee talk is recorded together with the note from the sheet.
    if (!happened) return setMissed(id);

    try {
      await confirmAttendance(id, true);
      setReviewing(id);
    } catch (confirmError) {
      toast.show({ title: "Couldn't save that", message: describeError(confirmError), variant: "error" });
    }
  };

  const handleReview = async (rating: number, comment: string) => {
    const id = reviewing;
    setReviewing(null);
    if (!id) return;

    try {
      await reviewEvent(id, { rating, comment });
      toast.show({ title: "Thanks for the review!", variant: "success" });
    } catch (reviewError) {
      toast.show({ title: "Couldn't save your review", message: describeError(reviewError), variant: "error" });
    }
  };

  const handleMissed = async (comment: string) => {
    const id = missed;
    setMissed(null);
    if (!id) return;

    try {
      await confirmAttendance(id, false, comment.trim() || undefined);
      toast.show({ title: "Thanks for letting us know", variant: "info" });
    } catch (missedError) {
      toast.show({ title: "Couldn't save that", message: describeError(missedError), variant: "error" });
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
                accessibilityLabel="Create coffee talk"
                onPress={() => router.push("/create-event")}
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
          emoji=""
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
              onConfirm={(happened) => handleConfirm(event.id, happened)}
              onReview={() => setReviewing(event.id)}
            />
          ))}
        </>
      )}

      <RateExperienceSheet
        visible={!!reviewing}
        onClose={() => setReviewing(null)}
        onSubmit={handleReview}
        onReport={() => openReport(reviewing)}
      />

      <MissedFeedbackSheet
        visible={!!missed}
        onClose={() => setMissed(null)}
        onSubmit={handleMissed}
        onReport={() => openReport(missed)}
      />
    </Screen>
  );
}
