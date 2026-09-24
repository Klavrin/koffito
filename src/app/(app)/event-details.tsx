import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Linking, View } from "react-native";
import Animated, { ZoomIn } from "react-native-reanimated";

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
import { errorMessage } from "@/lib/api-client";
import { formatDateTime } from "@/lib/date";
import { getConfirmationStage, getEventState, getRevealTime, isUpcoming } from "@/lib/events";
import { goBack } from "@/lib/navigation";
import { motion } from "@/theme/tokens";

export default function EventDetailsPage() {
  // `id` opens a coffee talk; `cafeId` opens a café on its own (e.g. from "Cafés you've visited").
  const { id, cafeId } = useLocalSearchParams<{
    id?: string;
    cafeId?: string;
  }>();
  const { getEvent, visitedCafes, joinEvent, leaveEvent, confirmEvent, revealEvent } = useEvents();
  const toast = useToast();

  const [cancelOpen, setCancelOpen] = useState(false);
  const [peopleOpen, setPeopleOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const event = getEvent(id);
  const cafe = event?.cafe ?? visitedCafes.find((item) => item.id === cafeId);

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
  const state = event ? getEventState(event) : undefined;
  const hidden = state?.kind === "mystery" || state?.kind === "awaiting-reveal";
  const confirmStage = event ? getConfirmationStage(event) : undefined;
  const spotsLeft = event
    ? (event.spotsLeft ?? event.maxParticipants - event.participants.length)
    : 0;

  const fail = (title: string, caught: unknown) =>
    toast.show({ title, message: errorMessage(caught), variant: "error" });

  const openReport = () =>
    router.push({
      pathname: "/report",
      params: event ? { eventId: event.id } : {},
    });

  const handleCancel = async () => {
    if (!event) return;
    setBusy(true);
    try {
      await leaveEvent(event.id);
      setCancelOpen(false);
      toast.show({
        title: "Coffee talk cancelled",
        message: "Maybe next time.",
        variant: "info",
      });
      goBack();
    } catch (caught) {
      setCancelOpen(false);
      fail("Couldn't cancel", caught);
    } finally {
      setBusy(false);
    }
  };

  const handleJoin = async () => {
    if (!event) return;
    setBusy(true);
    try {
      await joinEvent(event.id);
      toast.show({
        title: "You're in!",
        message: "We saved you a seat. The café is revealed a day before.",
        variant: "success",
      });
    } catch (caught) {
      fail("Couldn't join", caught);
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmComing = async () => {
    if (!event || !confirmStage) return;
    setBusy(true);
    try {
      await confirmEvent(event.id, confirmStage);
      toast.show({ title: "See you there! ☕", variant: "success" });
    } catch (caught) {
      fail("Couldn't confirm", caught);
    } finally {
      setBusy(false);
    }
  };

  const handleReveal = async () => {
    if (!event) return;
    try {
      await revealEvent(event.id);
    } catch (caught) {
      fail("Couldn't open the café", caught);
    }
  };

  const footer =
    !event || !upcoming ? undefined : event.joined ? (
      <View className="gap-2">
        {confirmStage && (
          <Button
            title="Yes, I'm coming"
            size="lg"
            fullWidth
            leftIcon="checkmark-circle-outline"
            loading={busy}
            onPress={handleConfirmComing}
          />
        )}
        <Button
          title="Cancel coffee talk"
          variant={confirmStage ? "ghost" : "destructive"}
          size="lg"
          fullWidth
          onPress={() => setCancelOpen(true)}
        />
      </View>
    ) : (
      <Button
        title="Join meeting"
        size="lg"
        fullWidth
        leftIcon="cafe"
        disabled={spotsLeft <= 0}
        loading={busy}
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
        {state?.kind === "mystery" && event && (
          <LocationCountdown revealAt={getRevealTime(event)} />
        )}
        {state?.kind === "awaiting-reveal" && event && (
          <Animated.View entering={ZoomIn.duration(motion.base)}>
            <Button
              title="Reveal the café"
              size="lg"
              leftIcon="lock-open-outline"
              onPress={handleReveal}
            />
          </Animated.View>
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
              <InfoRow
                icon="location-outline"
                label={cafe.address}
                onPress={cafe.mapsUrl ? () => Linking.openURL(cafe.mapsUrl!) : undefined}
              />
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
