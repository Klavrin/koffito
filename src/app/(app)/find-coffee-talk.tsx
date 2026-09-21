import {
  Button,
  Card,
  EmptyState,
  Header,
  Icon,
  Text,
  useToast,
} from "@/components/ui";
import { Image } from "expo-image";
import { useState } from "react";
import { View } from "react-native";

import { AvailabilityCalendar } from "@/components/home/availability-calendar";
import { Screen } from "@/components/layout";
import { useEvents } from "@/context/events";
import { isUpcoming } from "@/data/events";
import { dayKey, formatDate, formatTime } from "@/lib/date";
import { goBack } from "@/lib/navigation";

export default function FindCoffeeTalkPage() {
  const { events, joinEvent, leaveEvent } = useEvents();
  const toast = useToast();
  const [selectedDay, setSelectedDay] = useState<string>();
  const [selectedEvent, setSelectedEvent] = useState<string>();

  const available = events
    .filter(
      (event) =>
        (!event.joined || event.id === selectedEvent) && isUpcoming(event),
    )
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  const availableDays = [
    ...new Set(available.map((event) => dayKey(event.date))),
  ];
  const visibleEvents = selectedDay
    ? available.filter((event) => dayKey(event.date) === selectedDay)
    : available;

  const handleSelect = (eventId: string) => {
    if (selectedEvent && selectedEvent !== eventId) {
      leaveEvent(selectedEvent);
    }
    joinEvent(eventId);
    setSelectedEvent(eventId);
    toast.show({
      title: "Event joined",
      message:
        "Your spot is saved. The café and guests will be revealed closer to the meetup.",
      variant: "success",
    });
  };

  const handleCancel = () => {
    if (!selectedEvent) return;
    leaveEvent(selectedEvent);
    setSelectedEvent(undefined);
    toast.show({
      title: "Coffee talk cancelled",
      message: "You can choose another time whenever you are ready.",
      variant: "info",
    });
  };

  const selectedEventDetails = selectedEvent
    ? events.find((event) => event.id === selectedEvent)
    : undefined;

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
          {selectedEventDetails && (
            <Card
              padding="sm"
              className="flex-row items-center justify-between gap-3 border border-primary"
            >
              <View className="flex-1 gap-0.5">
                <Text variant="label" tone="primary">
                  Time confirmed
                </Text>
                <Text variant="caption" tone="muted">
                  {formatDate(selectedEventDetails.date)} at{" "}
                  {formatTime(selectedEventDetails.date)}
                </Text>
              </View>
              <Button
                title="Cancel"
                variant="outline"
                size="sm"
                onPress={handleCancel}
              />
            </Card>
          )}

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
                      <View className="h-32 overflow-hidden rounded-2xl">
                        <Image
                          source={event.cafe.photo}
                          contentFit="cover"
                          blurRadius={25}
                          transition={200}
                          accessibilityLabel="Blurred photo of the mystery café"
                          style={{ width: "100%", height: "100%" }}
                        />
                        <View className="absolute inset-0 items-center justify-center bg-black/20">
                          <View className="flex-row items-center gap-1.5 rounded-full bg-surface/90 px-3 py-1.5">
                            <Icon
                              name="lock-closed"
                              size={14}
                              color="primary"
                            />
                            <Text variant="caption">Revealed 24h before</Text>
                          </View>
                        </View>
                      </View>
                      <View className="flex-row items-center justify-between gap-3">
                        <View className="flex-1 gap-1">
                          <Text variant="heading">
                            {formatDate(event.date)}
                          </Text>
                        </View>
                        <View className="items-end gap-0.5">
                          <Text variant="label">{formatTime(event.date)}</Text>
                          <Text variant="caption" tone="muted">
                            Location locked
                          </Text>
                        </View>
                      </View>
                      <Button
                        title={selected ? "Cancel event" : "Join event"}
                        variant={selected ? "outline" : "primary"}
                        fullWidth
                        onPress={
                          selected ? handleCancel : () => handleSelect(event.id)
                        }
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
