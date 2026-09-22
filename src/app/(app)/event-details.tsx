import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { Linking, View } from "react-native";

import { fetchVenue, rateEvent } from "@/api";
import { EventHero } from "@/components/events/event-hero";
import { InfoRow } from "@/components/events/info-row";
import { LocationCountdown } from "@/components/events/location-countdown";
import { PeopleLikeThis } from "@/components/events/people-like-this";
import { PopularTimesChart } from "@/components/events/popular-times-chart";
import { RateExperienceSheet } from "@/components/events/rate-experience-sheet";
import { RatingStars } from "@/components/events/rating-stars";
import { MeetupStatus } from "@/components/koffito";
import { Screen, Section } from "@/components/layout";
import { Button, Card, ErrorState, Header, IconButton, Modal, Skeleton, Text, useToast } from "@/components/ui";
import { popularTimeLabels } from "@/constants/venues";
import { useEvents } from "@/context/events";
import { useProfile } from "@/context/session";
import { useResource } from "@/hooks/use-resource";
import { formatDateTime } from "@/lib/date";
import { describeError } from "@/lib/errors";
import { getPendingReveal, getSpotsLeft, goingCount, hasHappened, isLocationHidden, isUpcoming } from "@/lib/events";
import { goBack } from "@/lib/navigation";

export default function EventDetailsPage() {
  // `id` opens a coffee talk; `cafeId` opens a café on its own (e.g. from "Cafés you've visited").
  const { id, cafeId } = useLocalSearchParams<{ id?: string; cafeId?: string }>();
  const profile = useProfile();
  const { getEvent, joinEvent, cancelEvent, refresh, loading } = useEvents();
  const toast = useToast();

  const loadVenue = useCallback(() => fetchVenue(cafeId ?? ""), [cafeId]);
  const venue = useResource(loadVenue, !!cafeId && !id);

  const [rateOpen, setRateOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const event = getEvent(id);
  const cafe = event?.cafe ?? venue.data;
  const rating = event?.myRating ?? 0;

  if (!event && !cafe) {
    const pending = (id && loading) || (cafeId && venue.loading);

    return (
      <Screen header={<Header title="Coffee talk" onBack={goBack} />} contentClassName={pending ? undefined : "flex-1 justify-center"}>
        {pending ? (
          <>
            <Skeleton height={220} className="rounded-3xl" />
            <Skeleton height={120} className="rounded-3xl" />
          </>
        ) : (
          <ErrorState title="We lost this coffee talk" description="It may have been cancelled or removed." retryLabel="Go back" onRetry={goBack} />
        )}
      </Screen>
    );
  }

  const upcoming = !!event && isUpcoming(event);
  const hidden = !!event && isLocationHidden(event);
  const spotsLeft = event ? getSpotsLeft(event) : 0;
  const canRate = !!event && hasHappened(event) && !!cafe;
  const countdown = event && hidden ? getPendingReveal(event) : undefined;

  const openReport = () => {
    setRateOpen(false);
    router.push({ pathname: "/report", params: event ? { eventId: event.id } : {} });
  };

  const handleRatingSubmit = async (value: number, comment: string) => {
    if (!event) return;

    setRateOpen(false);
    try {
      await rateEvent(event.id, profile.id, value, comment);
      await refresh();
      toast.show({ title: "Thanks for the feedback! 💛", variant: "success" });
    } catch (error) {
      toast.show({ title: "Couldn't save your rating", message: describeError(error), variant: "error" });
    }
  };

  const handleCancel = async () => {
    if (!event) return;

    setBusy(true);
    try {
      await cancelEvent(event.id);
      setCancelOpen(false);
      toast.show({ title: "Coffee talk cancelled", message: "Maybe next time ☕", variant: "info" });
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
      toast.show({ title: "You're in! ☕", message: "We saved you a seat. The café is revealed before you meet.", variant: "success" });
    } catch (error) {
      toast.show({ title: "Couldn't join", message: describeError(error), variant: "error" });
    } finally {
      setBusy(false);
    }
  };

  const footer = !event || !upcoming ? undefined : event.joined ? (
    <Button title="Cancel coffee talk" variant="destructive" size="lg" fullWidth onPress={() => setCancelOpen(true)} />
  ) : (
    <Button title="Join meeting" size="lg" fullWidth leftIcon="cafe" loading={busy} disabled={spotsLeft <= 0} onPress={handleJoin} />
  );

  return (
    <Screen edgeToEdge footer={footer} contentClassName="px-0 pt-0">
      <EventHero
        photo={cafe?.photo}
        hidden={hidden}
        onBack={goBack}
        accessibilityLabel={hidden || !cafe ? "Hidden café picture" : `Photo of ${cafe.name}`}
        actions={<IconButton icon="flag-outline" accessibilityLabel="Report a problem" onPress={openReport} />}>
        {countdown && <LocationCountdown revealAt={countdown} />}
      </EventHero>

      <View className="gap-6 px-5">
        {event && !hidden && (
          <PeopleLikeThis people={event.participants} caption={`${goingCount(event)}/${event.maxParticipants} going`} />
        )}

        <View className="gap-2">
          <View className="flex-row items-start justify-between gap-3">
            <Text variant="title" className="flex-1" accessibilityRole="header">
              {cafe && !hidden ? cafe.name : "Surprise café 🤫"}
            </Text>
            {event?.joined && <MeetupStatus status={event.status} className="mt-1.5" />}
          </View>
          <Text tone="muted">
            {cafe && !hidden
              ? cafe.description
              : event?.joined
                ? "The café stays a secret until shortly before you meet. All you need to know: the coffee is good and the company is better."
                : "Join and we'll match you with a small group. The café and your coffee mates are revealed shortly before you meet."}
          </Text>
        </View>

        <Card className="gap-3">
          {event && <InfoRow icon="calendar-outline" label={formatDateTime(event.date)} />}
          {event && !event.joined && <InfoRow icon="people-outline" label={`Groups of ${event.maxParticipants} · ${spotsLeft} spot(s) left`} />}
          {cafe && !hidden ? (
            <>
              <InfoRow icon="location-outline" label={cafe.address} onPress={cafe.mapsUrl ? () => Linking.openURL(cafe.mapsUrl!) : undefined} />
              {cafe.website && <InfoRow icon="globe-outline" label={cafe.website.replace(/^https?:\/\//, "")} onPress={() => Linking.openURL(cafe.website!)} />}
              {cafe.phone && <InfoRow icon="call-outline" label={cafe.phone} onPress={() => Linking.openURL(`tel:${cafe.phone!.replace(/\s/g, "")}`)} />}
            </>
          ) : (
            <>
              <InfoRow icon="lock-closed-outline" label="Location hidden until the reveal" />
              <InfoRow icon="lock-closed-outline" label="Website hidden until the reveal" />
              <InfoRow icon="lock-closed-outline" label="Phone hidden until the reveal" />
            </>
          )}
        </Card>

        {cafe && !hidden && cafe.popularTimes.length > 0 && (
          <Section title="Popular times" description="When this café is usually buzzing">
            <Card>
              <PopularTimesChart values={cafe.popularTimes} labels={popularTimeLabels} />
            </Card>
          </Section>
        )}

        {canRate && (
          <Section title="Rate this café" description={rating ? "Thanks! Tap to change your rating." : "How was your coffee talk here?"}>
            <Card className="items-center">
              <RatingStars value={rating} onChange={() => setRateOpen(true)} />
            </Card>
          </Section>
        )}
      </View>

      <RateExperienceSheet
        visible={rateOpen}
        initialRating={rating}
        onClose={() => setRateOpen(false)}
        onSubmit={handleRatingSubmit}
        onReport={openReport}
      />

      <Modal
        visible={cancelOpen}
        onClose={() => setCancelOpen(false)}
        emoji="🥺"
        title="Cancel this coffee talk?"
        description="The others will be told you can't make it. You can always join another one."
        primaryAction={{ title: "Yes, cancel it", variant: "destructive", loading: busy, onPress: handleCancel }}
        secondaryAction={{ title: "Keep my seat", onPress: () => setCancelOpen(false) }}
      />
    </Screen>
  );
}
