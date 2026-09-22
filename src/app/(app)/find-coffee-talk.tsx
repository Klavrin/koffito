import { Image } from "expo-image";
import { useState } from "react";
import { View } from "react-native";

import { AvailabilityCalendar } from "@/components/home/availability-calendar";
import { Screen } from "@/components/layout";
import {
  Button,
  Card,
  EmptyState,
  Header,
  Icon,
  Text,
  useToast,
} from "@/components/ui";
import { useEvents } from "@/context/events";
import { isUpcoming } from "@/data/events";
import { dayKey, formatDate, formatTime } from "@/lib/date";
import { goBack } from "@/lib/navigation";

export default function FindCoffeeTalkPage() {
  const { events, joinEvent, leaveEvent } = useEvents();
  const toast = useToast();
  const [selectedDay, setSelectedDay] = useState<string>();

  const available = events
    .filter(isUpcoming)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  const joinedCount = available.filter((event) => event.joined).length;
  const availableDays = [
    ...new Set(available.map((event) => dayKey(event.date))),
  ];
  const visibleEvents = selectedDay
    ? available.filter((event) => dayKey(event.date) === selectedDay)
    : available;

  const handleJoin = (eventId: string) => {
    joinEvent(eventId);
    toast.show({
      title: "Event joined",
      message:
        "Your spot is saved. The café and guests will be revealed closer to the meetup.",
      variant: "success",
    });
  };

  const handleCancel = (eventId: string) => {
    leaveEvent(eventId);
    toast.show({
      title: "Event cancelled",
      message: "You can join another time whenever you are ready.",
      variant: "info",
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
          {joinedCount > 0 && (
            <Card padding="sm" className="border border-primary">
              <Text variant="label" tone="primary">
                You've joined {joinedCount} coffee talk
                {joinedCount === 1 ? "" : "s"}
              </Text>
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
                const joined = event.joined;

                return (
                  <Card
                    key={event.id}
                    animateIn={index}
                    className={joined ? "border border-primary" : undefined}
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
                        title={joined ? "Cancel event" : "Join event"}
                        variant={joined ? "outline" : "primary"}
                        fullWidth
                        onPress={() =>
                          joined ? handleCancel(event.id) : handleJoin(event.id)
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
