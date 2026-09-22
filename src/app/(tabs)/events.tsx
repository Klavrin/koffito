import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { EventCard } from "@/components/events/event-card";
import { MissedFeedbackSheet } from "@/components/events/missed-feedback-sheet";
import { RateExperienceSheet } from "@/components/events/rate-experience-sheet";
import { Screen } from "@/components/layout";
import { Chip, EmptyState, Header, useToast } from "@/components/ui";
import { useEvents } from "@/context/events";
import { isUpcoming } from "@/data/events";

type Filter = "upcoming" | "past";

const filters: { key: Filter; label: string }[] = [
  { key: "upcoming", label: "Upcoming" },
  { key: "past", label: "Past" },
];

export default function EventsPage() {
  const { events, confirmAttendance, reviewEvent } = useEvents();
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

  const handleConfirm = (id: string, happened: boolean) => {
    confirmAttendance(id, happened);
    if (happened) setReviewing(id);
    else setMissed(id);
  };

  const handleReview = (rating: number, comment: string) => {
    if (reviewing) reviewEvent(reviewing, { rating, comment });
    setReviewing(null);
    toast.show({ title: "Thanks for the review!", variant: "success" });
  };

  const handleMissed = (comment: string) => {
    if (missed) reviewEvent(missed, { rating: 0, comment });
    setMissed(null);
    toast.show({ title: "Thanks for letting us know", variant: "info" });
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

      {visible.length === 0 ? (
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
