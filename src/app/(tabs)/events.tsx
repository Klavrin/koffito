import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { EventCard } from "@/components/events/event-card";
import { MissedFeedbackSheet } from "@/components/events/missed-feedback-sheet";
import { RateExperienceSheet } from "@/components/events/rate-experience-sheet";
import { Screen } from "@/components/layout";
import { Chip, EmptyState, ErrorState, Header, Skeleton, useToast } from "@/components/ui";
import { useEvents } from "@/context/events";
import { errorMessage } from "@/lib/api-client";
import { isUpcoming } from "@/lib/events";

type Filter = "upcoming" | "past";

const filters: { key: Filter; label: string }[] = [
  { key: "upcoming", label: "Upcoming" },
  { key: "past", label: "Past" },
];

export default function EventsPage() {
  const { events, status, error, refresh, confirmAttendance, confirmEvent, reviewEvent } = useEvents();
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

  const fail = (caught: unknown) =>
    toast.show({ title: "That didn't go through", message: errorMessage(caught), variant: "error" });

  const handleConfirm = async (id: string, happened: boolean) => {
    if (happened) {
      try {
        await confirmAttendance(id, true);
        setReviewing(id);
      } catch (caught) {
        fail(caught);
      }
    } else {
      // The "no" is sent together with the note from the sheet.
      setMissed(id);
    }
  };

  const handleComing = async (id: string, stage: "24h" | "3h") => {
    try {
      await confirmEvent(id, stage);
      toast.show({ title: "See you there! ☕", variant: "success" });
    } catch (caught) {
      fail(caught);
    }
  };

  const handleReview = async (rating: number, comment: string) => {
    const id = reviewing;
    setReviewing(null);
    if (!id) return;
    try {
      await reviewEvent(id, { rating, comment });
      toast.show({ title: "Thanks for the review!", variant: "success" });
    } catch (caught) {
      fail(caught);
    }
  };

  const handleMissed = async (comment: string) => {
    const id = missed;
    setMissed(null);
    if (!id) return;
    try {
      await confirmAttendance(id, false, comment);
      toast.show({ title: "Thanks for letting us know", variant: "info" });
    } catch (caught) {
      fail(caught);
    }
  };

  const mine = events.filter((event) => event.joined);
  const visible = mine
    .filter((event) => (filter === "upcoming" ? isUpcoming(event) : !isUpcoming(event)))
    .sort((a, b) => (filter === "upcoming" ? a.date.getTime() - b.date.getTime() : b.date.getTime() - a.date.getTime()));

  return (
    <Screen
      tabBarInset
      header={
        <Header
          size="large"
          title="Events"
          subtitle="Your coffee talks, all in one place"
        />
      }
      contentClassName="gap-4">
      <View className="flex-row gap-2">
        {filters.map((item) => (
          <Chip key={item.key} label={item.label} selected={filter === item.key} onPress={() => setFilter(item.key)} />
        ))}
      </View>

      {status === "loading" ? (
        <View className="gap-4">
          <Skeleton height={140} className="rounded-3xl" />
          <Skeleton height={140} className="rounded-3xl" />
        </View>
      ) : status === "error" ? (
        <ErrorState description={error} onRetry={refresh} className="flex-1 justify-center" />
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
              onConfirmComing={(stage) => handleComing(event.id, stage)}
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
