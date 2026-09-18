import { useState } from "react";
import { View } from "react-native";

import { AvailabilityCalendar } from "@/components/home/availability-calendar";
import { Screen } from "@/components/layout";
import {
  Button,
  Card,
  EmptyState,
  Header,
  Text,
  useToast,
} from "@/components/ui";
import { useEvents } from "@/context/events";
import { isUpcoming } from "@/data/events";
import { dayKey, formatDate, formatTime } from "@/lib/date";
import { goBack } from "@/lib/navigation";

export default function FindCoffeeTalkPage() {
  const { events } = useEvents();
  const toast = useToast();
  const [selectedDay, setSelectedDay] = useState<string>();
  const [selectedEvent, setSelectedEvent] = useState<string>();

  const available = events
    .filter((event) => !event.joined && isUpcoming(event))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  const availableDays = [
    ...new Set(available.map((event) => dayKey(event.date))),
  ];
  const visibleEvents = selectedDay
    ? available.filter((event) => dayKey(event.date) === selectedDay)
    : available;

  const handleSelect = (eventId: string) => {
    setSelectedEvent(eventId);
    toast.show({
      title: "Time selected",
      message: "The cafe and guests will be revealed closer to the meetup.",
      variant: "success",
    });
  };

  return (
    <Screen
      header={
        <Header
          title="Find coffee talk"
          subtitle="Choose a time that works for you"
          onBack={goBack}
        />
      }
    >
      {available.length === 0 ? (
        <EmptyState
          emoji="☕"
          title="No coffee talks available"
          description="Check back soon for new times to meet over coffee."
          action={{ title: "Go back", leftIcon: "arrow-back", onPress: goBack }}
          className="flex-1 justify-center"
        />
      ) : (
        <View className="gap-6">
          <View className="gap-3">
            <View className="gap-1">
              <Text variant="heading">Choose a date</Text>
              <Text variant="caption" tone="muted">
                Pick a day to see available coffee talk times.
              </Text>
            </View>
            <Card padding="sm">
              <AvailabilityCalendar
                month={new Date()}
                selected={selectedDay ? [selectedDay] : []}
                onToggle={(day) =>
                  setSelectedDay((current) =>
                    current === day ? undefined : day,
                  )
                }
                editable
                marked={availableDays}
              />
            </Card>
          </View>

          <View className="gap-3">
            <View className="flex-row items-end justify-between gap-3">
              <Text variant="heading">Available times</Text>
              {!selectedDay && (
                <Text variant="caption" tone="muted">
                  {visibleEvents.length} option
                  {visibleEvents.length === 1 ? "" : "s"}
                </Text>
              )}
            </View>

            {visibleEvents.length === 0 ? (
              <Card variant="filled" padding="sm">
                <Text tone="muted">
                  No coffee talks are available on this date.
                </Text>
              </Card>
            ) : (
              visibleEvents.map((event, index) => {
                const selected = selectedEvent === event.id;

                return (
                  <Card
                    key={event.id}
                    animateIn={index}
                    className={selected ? "border border-primary" : undefined}
                  >
                    <View className="gap-4">
                      <View className="flex-row items-center justify-between gap-3">
                        <View className="flex-1 gap-1">
                          <Text variant="heading">
                            {formatDate(event.date)}
                          </Text>
                          <Text variant="body" tone="muted">
                            {formatTime(event.date)}
                          </Text>
                        </View>
                        <Text variant="caption" tone="muted">
                          Details locked
                        </Text>
                      </View>
                      <Button
                        title={selected ? "Time selected" : "Choose this time"}
                        variant={selected ? "secondary" : "primary"}
                        fullWidth
                        disabled={selected}
                        onPress={() => handleSelect(event.id)}
                      />
                    </View>
                  </Card>
                );
              })
            )}
          </View>
        </View>
      )}
    </Screen>
  );
}
