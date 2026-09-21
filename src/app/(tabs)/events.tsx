import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { EventCard } from "@/components/events/event-card";
import { Screen } from "@/components/layout";
import { Chip, EmptyState, Header } from "@/components/ui";
import { useEvents } from "@/context/events";
import { isUpcoming } from "@/data/events";

type Filter = "upcoming" | "past";

const filters: { key: Filter; label: string }[] = [
  { key: "upcoming", label: "Upcoming" },
  { key: "past", label: "Past" },
];

export default function EventsPage() {
  const { events } = useEvents();
  const [filter, setFilter] = useState<Filter>("upcoming");

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
            />
          ))}
        </>
      )}
    </Screen>
  );
}
