import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Linking, View } from "react-native";

import { EventHero } from "@/components/events/event-hero";
import { InfoRow } from "@/components/events/info-row";
import { LocationCountdown } from "@/components/events/location-countdown";
import { PeopleGoing } from "@/components/events/people-going";
import { MeetupStatus, UserCard } from "@/components/koffito";
import { Screen } from "@/components/layout";
import {
  BottomSheet,
  Button,
  Card,
  ErrorState,
  Header,
  IconButton,
  Modal,
  Text,
  useToast,
} from "@/components/ui";
import { useEvents } from "@/context/events";
import { getCafe } from "@/data/cafes";
import { getRevealTime, isLocationHidden, isUpcoming } from "@/data/events";
import { formatDateTime } from "@/lib/date";
import { goBack } from "@/lib/navigation";

export default function EventDetailsPage() {
  // `id` opens a coffee talk; `cafeId` opens a café on its own (e.g. from "Cafés you've visited").
  const { id, cafeId } = useLocalSearchParams<{
    id?: string;
    cafeId?: string;
  }>();
  const { getEvent, joinEvent, cancelEvent } = useEvents();
  const toast = useToast();

  const [cancelOpen, setCancelOpen] = useState(false);
  const [peopleOpen, setPeopleOpen] = useState(false);

  const event = getEvent(id);
  const cafe = event?.cafe ?? getCafe(cafeId);

  if (!cafe) {
    return (
      <Screen
        header={<Header title="Coffee talk" onBack={goBack} />}
        contentClassName="flex-1 justify-center"
      >
        <ErrorState
          title="We lost this coffee talk"
          description="It may have been cancelled or removed."
          retryLabel="Go back"
          onRetry={goBack}
        />
      </Screen>
    );
  }

  const upcoming = !!event && isUpcoming(event);
  const hidden = !!event && isLocationHidden(event);
  const spotsLeft = event
    ? event.maxParticipants - event.participants.length
    : 0;

  const openReport = () =>
    router.push({
      pathname: "/report",
      params: event ? { eventId: event.id } : {},
    });

  const handleCancel = () => {
    if (!event) return;
    cancelEvent(event.id);
    setCancelOpen(false);
    toast.show({
      title: "Coffee talk cancelled",
      message: "Maybe next time.",
      variant: "info",
    });
    goBack();
  };

  const handleJoin = () => {
    if (!event) return;
    joinEvent(event.id);
    toast.show({
      title: "You're in!",
      message: `We saved you a seat at ${cafe.name}`,
      variant: "success",
    });
  };

  const footer =
    !event || !upcoming ? undefined : event.joined ? (
      <Button
        title="Cancel coffee talk"
        variant="destructive"
        size="lg"
        fullWidth
        onPress={() => setCancelOpen(true)}
      />
    ) : (
      <Button
        title="Join meeting"
        size="lg"
        fullWidth
        leftIcon="cafe"
        disabled={spotsLeft <= 0}
        onPress={handleJoin}
      />
    );

  return (
    <Screen edgeToEdge footer={footer} contentClassName="px-0 pt-0">
      <EventHero
        photo={cafe.photo}
        hidden={hidden}
        onBack={goBack}
        accessibilityLabel={
          hidden ? "Hidden café picture" : `Photo of ${cafe.name}`
        }
        actions={
          <IconButton
            icon="flag-outline"
            accessibilityLabel="Report a problem"
            onPress={openReport}
          />
        }
      >
        {hidden && event && (
          <LocationCountdown revealAt={getRevealTime(event)} />
        )}
      </EventHero>

      <View className="gap-6 px-5">
        {/* Faces and headcount stay hidden until the café is revealed. */}
        {event && !hidden && (
          <PeopleGoing
            people={event.participants}
            past={!upcoming}
            onPress={() => setPeopleOpen(true)}
          />
        )}

        <View className="gap-2">
          <View className="flex-row items-start justify-between gap-3">
            <Text variant="title" className="flex-1" accessibilityRole="header">
              {hidden ? "Mystery café" : cafe.name}
            </Text>
            {event && <MeetupStatus status={event.status} className="mt-1.5" />}
          </View>
          <Text tone="muted">
            {hidden
              ? "The café will be revealed a day before the meet up. Can you handle the suspense?"
              : cafe.description}
          </Text>
        </View>

        <Card className="gap-3">
          {event && (
            <InfoRow
              icon="calendar-outline"
              label={formatDateTime(event.date)}
            />
          )}
          {hidden ? (
            <InfoRow
              icon="lock-closed-outline"
              label="Details hidden until the reveal"
            />
          ) : (
            <>
              <InfoRow icon="location-outline" label={cafe.address} />
              {cafe.website && (
                <InfoRow
                  icon="globe-outline"
                  label={cafe.website.replace(/^https?:\/\//, "")}
                  onPress={() => Linking.openURL(cafe.website!)}
                />
              )}
              {cafe.phone && (
                <InfoRow
                  icon="call-outline"
                  label={cafe.phone}
                  onPress={() =>
                    Linking.openURL(`tel:${cafe.phone!.replace(/\s/g, "")}`)
                  }
                />
              )}
            </>
          )}
        </Card>
      </View>

      <BottomSheet
        visible={peopleOpen}
        onClose={() => setPeopleOpen(false)}
        title="Who's going"
        description="Tap someone to see their profile."
      >
        <View className="gap-2 pb-4">
          {event?.participants.map((person) => (
            <UserCard
              key={person.id}
              user={person}
              variant="compact"
              onPress={() => {
                setPeopleOpen(false);
                router.push({ pathname: "/person", params: { id: person.id } });
              }}
            />
          ))}
        </View>
      </BottomSheet>

      <Modal
        visible={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Cancel this coffee talk?"
        description="The others will be told you can't make it. You can always join another one."
        primaryAction={{
          title: "Yes, cancel it",
          variant: "destructive",
          onPress: handleCancel,
        }}
        secondaryAction={{
          title: "Keep my seat",
          onPress: () => setCancelOpen(false),
        }}
      />
    </Screen>
  );
}
