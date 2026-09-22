import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { Linking, View } from "react-native";
import Animated, { ZoomIn } from "react-native-reanimated";

import { fetchVenue } from "@/api";
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
  Skeleton,
  Text,
  useToast,
} from "@/components/ui";
import { useEvents } from "@/context/events";
import { useResource } from "@/hooks/use-resource";
import { formatDateTime } from "@/lib/date";
import { describeError } from "@/lib/errors";
import { getEventState, getSpotsLeft, isUpcoming } from "@/lib/events";
import { goBack } from "@/lib/navigation";
import { motion } from "@/theme/tokens";

export default function EventDetailsPage() {
  // `id` opens a coffee talk; `cafeId` opens a café on its own (e.g. from "Cafés you've visited").
  const { id, cafeId } = useLocalSearchParams<{
    id?: string;
    cafeId?: string;
  }>();
  const { getEvent, joinEvent, cancelEvent, revealEvent, loading } = useEvents();
  const toast = useToast();

  const loadVenue = useCallback(() => fetchVenue(cafeId ?? ""), [cafeId]);
  const venue = useResource(loadVenue, !!cafeId && !id);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [peopleOpen, setPeopleOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const event = getEvent(id);
  const cafe = event?.cafe ?? venue.data;

  if (!event && !cafe) {
    const pending = (id && loading) || (cafeId && venue.loading);

    return (
      <Screen
        header={<Header title="Coffee talk" onBack={goBack} />}
        contentClassName={pending ? undefined : "flex-1 justify-center"}
      >
        {pending ? (
          <>
            <Skeleton height={220} className="rounded-3xl" />
            <Skeleton height={120} className="rounded-3xl" />
          </>
        ) : (
          <ErrorState
            title="We lost this coffee talk"
            description="It may have been cancelled or removed."
            retryLabel="Go back"
            onRetry={goBack}
          />
        )}
      </Screen>
    );
  }

  const upcoming = !!event && isUpcoming(event);
  const state = event ? getEventState(event) : undefined;
  const hidden = state?.kind === "mystery" || state?.kind === "awaiting-reveal";
  const spotsLeft = event ? getSpotsLeft(event) : 0;

  const openReport = () =>
    router.push({
      pathname: "/report",
      params: event ? { eventId: event.id } : {},
    });

  const handleCancel = async () => {
    if (!event) return;

    setBusy(true);
    try {
      await cancelEvent(event.id);
      setCancelOpen(false);
      toast.show({
        title: "Coffee talk cancelled",
        message: "Maybe next time.",
        variant: "info",
      });
      goBack();
    } catch (error) {
      setBusy(false);
      setCancelOpen(false);
      toast.show({ title: "Couldn't cancel", message: describeError(error), variant: "error" });
    }
  };

  const handleJoin = async () => {
    if (!event) return;

    setBusy(true);
    try {
      await joinEvent(event.id);
      toast.show({
        title: "You're in!",
        message: "Your spot is saved. The café and guests will be revealed closer to the meetup.",
        variant: "success",
      });
    } catch (error) {
      toast.show({ title: "Couldn't join", message: describeError(error), variant: "error" });
    } finally {
      setBusy(false);
    }
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
        loading={busy}
        disabled={spotsLeft <= 0}
        onPress={handleJoin}
      />
    );

  return (
    <Screen edgeToEdge footer={footer} contentClassName="px-0 pt-0">
      <EventHero
        photo={cafe?.photo}
        hidden={hidden}
        onBack={goBack}
        accessibilityLabel={
          hidden || !cafe ? "Hidden café picture" : `Photo of ${cafe.name}`
        }
        actions={
          <IconButton
            icon="flag-outline"
            accessibilityLabel="Report a problem"
            onPress={openReport}
          />
        }
      >
        {state?.kind === "mystery" && (
          <LocationCountdown revealAt={state.revealAt} />
        )}
        {state?.kind === "awaiting-reveal" && event && (
          <Animated.View entering={ZoomIn.duration(motion.base)}>
            <Button
              title="Reveal the café"
              size="lg"
              leftIcon="lock-open-outline"
              onPress={() => revealEvent(event.id)}
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
              {cafe && !hidden ? cafe.name : "Mystery café"}
            </Text>
            {event?.joined && <MeetupStatus status={event.status} className="mt-1.5" />}
          </View>
          <Text tone="muted">
            {cafe && !hidden
              ? cafe.description
              : "The café will be revealed a day before the meet up. Can you handle the suspense?"}
          </Text>
        </View>

        <Card className="gap-3">
          {event && (
            <InfoRow
              icon="calendar-outline"
              label={formatDateTime(event.date)}
            />
          )}
          {event && !event.joined && (
            <InfoRow icon="people-outline" label={`Groups of ${event.maxParticipants} · ${spotsLeft} spot(s) left`} />
          )}
          {!cafe || hidden ? (
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
          loading: busy,
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
