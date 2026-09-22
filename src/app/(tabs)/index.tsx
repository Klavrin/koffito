import { Redirect, router } from "expo-router";
import { useState } from "react";
import { ScrollView, View } from "react-native";

import { fetchVisitedVenues } from "@/api";
import { AvailabilityCalendar } from "@/components/home/availability-calendar";
import { CafeVisitedCard } from "@/components/home/cafe-visited-card";
import { NextCoffeeCard } from "@/components/home/next-coffee-card";
import { PeopleRow } from "@/components/home/people-row";
import { UserCard } from "@/components/koffito";
import { Screen, Section } from "@/components/layout";
import { EmojiAvatar } from "@/components/profile/emoji-avatar";
import { BottomSheet, Button, Card, ErrorState, Header, IconButton, Skeleton, Text, useToast } from "@/components/ui";
import { useEvents } from "@/context/events";
import { useProfile } from "@/context/session";
import { useResource } from "@/hooks/use-resource";
import { dayKey, formatMonth } from "@/lib/date";
import { isUpcoming, peopleMet } from "@/lib/events";
import type { User } from "@/types/koffito";

export default function HomePage() {
  const profile = useProfile();
  const { events, loading, error, refresh } = useEvents();
  const visited = useResource(fetchVisitedVenues);
  const toast = useToast();

  const [selectedPerson, setSelectedPerson] = useState<User | null>(null);
  // Availability isn't stored yet; it only lives on this screen for now.
  const [availability, setAvailability] = useState<string[]>([]);
  const [editingAvailability, setEditingAvailability] = useState(false);

  // Fresh accounts finish the survey before seeing Home.
  if (!profile.onboarded) {
    return <Redirect href="/survey" />;
  }

  const upcoming = events.filter((event) => event.joined && isUpcoming(event)).sort((a, b) => a.date.getTime() - b.date.getTime());
  const nextEvent = upcoming[0];
  const people = peopleMet(events);
  const visitedCafes = visited.data ?? [];
  const today = new Date();

  const toggleDay = (key: string) =>
    setAvailability((current) => (current.includes(key) ? current.filter((day) => day !== key) : [...current, key]));

  const handleAvailabilityButton = () => {
    if (editingAvailability) {
      toast.show({
        title: availability.length ? "Availability saved" : "No days picked yet",
        message: availability.length ? `You're free on ${availability.length} day(s) this month.` : undefined,
        variant: availability.length ? "success" : "info",
      });
    }
    setEditingAvailability(!editingAvailability);
  };

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
              <IconButton icon="settings-outline" accessibilityLabel="Settings" onPress={() => router.push("/settings")} />
              <EmojiAvatar emoji={profile.avatar} size="sm" />
            </>
          }
        />
      }>
      {loading && events.length === 0 ? (
        <Skeleton height={150} className="rounded-3xl" />
      ) : error && events.length === 0 ? (
        <ErrorState title="Couldn't load your coffee talks" onRetry={refresh} className="py-4" />
      ) : (
        nextEvent && (
          <NextCoffeeCard
            event={nextEvent}
            onPress={() => router.push({ pathname: "/event-details", params: { id: nextEvent.id } })}
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

      <Section title="People you know" description="Friends you've shared a coffee with">
        {people.length === 0 && !loading && (
          <Text variant="caption" tone="muted">
            No coffee buddies yet ☕ Your coffee mates show up here after each talk.
          </Text>
        )}
        <PeopleRow people={people} onSelect={setSelectedPerson} onDiscoverMore={() => router.push("/find-coffee-talk")} />
      </Section>

      <Section title={formatMonth(today)} description="Let others know when you're free for coffee">
        <Card className="gap-4">
          <AvailabilityCalendar
            month={today}
            selected={availability}
            onToggle={toggleDay}
            editable={editingAvailability}
            marked={upcoming.map((event) => dayKey(event.date))}
          />
          {editingAvailability && (
            <Text variant="caption" tone="muted" className="text-center">
              Tap the days you&apos;re free ☕
            </Text>
          )}
          <Button
            title={editingAvailability ? "Done" : availability.length ? "Edit availability" : "Set availability"}
            variant={editingAvailability ? "primary" : "secondary"}
            leftIcon={editingAvailability ? "checkmark" : "calendar-outline"}
            fullWidth
            onPress={handleAvailabilityButton}
          />
        </Card>
      </Section>

      <Section title="Cafés you've visited" actionLabel="Find more" onAction={() => router.push("/find-coffee-talk")}>
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
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5" contentContainerClassName="gap-3 px-5 py-2">
            {visitedCafes.map((cafe) => (
              <CafeVisitedCard
                key={cafe.id}
                cafe={cafe}
                onPress={() => router.push({ pathname: "/event-details", params: { cafeId: cafe.id } })}
              />
            ))}
          </ScrollView>
        )}
      </Section>

      <BottomSheet visible={!!selectedPerson} onClose={() => setSelectedPerson(null)}>
        {selectedPerson && (
          <View className="pb-6">
            <UserCard user={selectedPerson} />
          </View>
        )}
      </BottomSheet>
    </Screen>
  );
}
