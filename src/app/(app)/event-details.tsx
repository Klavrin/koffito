import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Linking, View } from "react-native";
import Animated, { ZoomIn } from "react-native-reanimated";

import { fetchVenue } from "@/api";
import { EventHero } from "@/components/events/event-hero";
import { EventPhaseBadge } from "@/components/events/event-phase-badge";
import { GroupMemberRow } from "@/components/events/group-member-row";
import { InfoRow } from "@/components/events/info-row";
import { LocationCountdown } from "@/components/events/location-countdown";
import { RateExperienceSheet } from "@/components/events/rate-experience-sheet";
import { Screen, Section } from "@/components/layout";
import { Button, Card, ErrorState, Header, IconButton, Modal, Skeleton, Text, useToast } from "@/components/ui";
import { useEvents } from "@/context/events";
import { useResource } from "@/hooks/use-resource";
import { formatDateTime } from "@/lib/date";
import { describeError } from "@/lib/errors";
import { canBackOut, canSeeDetails, getEventPhase, phaseMessage } from "@/lib/events";
import { goBack } from "@/lib/navigation";
import { motion } from "@/theme/tokens";
import type { Cafe } from "@/types/koffito";

export default function EventDetailsPage() {
  // `id` opens a coffee talk (`ask=1` goes straight to "Are you coming?"); `cafeId` opens a café
  // on its own (e.g. from "Cafés you've visited").
  const { id, cafeId, ask } = useLocalSearchParams<{ id?: string; cafeId?: string; ask?: string }>();
  const { getEvent, joinEvent, leaveEvent, respond, reviewEvent, loading } = useEvents();
  const toast = useToast();

  const loadVenue = useCallback(() => fetchVenue(cafeId ?? ""), [cafeId]);
  const venue = useResource(loadVenue, !!cafeId && !id);

  const [askOpen, setAskOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [backOutOpen, setBackOutOpen] = useState(false);
  const [rateOpen, setRateOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const event = getEvent(id);
  const phase = event ? getEventPhase(event) : undefined;

  // Coming from "Reveal" in My events: ask once, as soon as the event is loaded.
  const asked = useRef(false);
  useEffect(() => {
    if (ask && phase?.kind === "ready" && !asked.current) {
      asked.current = true;
      setAskOpen(true);
    }
  }, [ask, phase?.kind]);

  if (!event) {
    if (venue.data) return <CafeOnly cafe={venue.data} />;
    const pending = (id && loading) || (cafeId && venue.loading);

    return (
      <Screen
        header={<Header title="Coffee talk" onBack={goBack} />}
        contentClassName={pending ? undefined : "flex-1 justify-center"}>
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

  const kind = phase!.kind;
  const visible = canSeeDetails(phase!);
  const cafe = visible ? event.cafe : undefined;
  const afterEvent = kind === "rate" || kind === "rated";

  const run = async (action: () => Promise<void>, success: { title: string; message?: string }, failTitle: string) => {
    setBusy(true);
    try {
      await action();
      toast.show({ ...success, variant: "success" });
      return true;
    } catch (error) {
      toast.show({ title: failTitle, message: describeError(error), variant: "error" });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleJoin = () =>
    run(
      () => joinEvent(event.id),
      { title: "You're in!", message: `Your group will be revealed on ${formatDateTime(event.revealAt)}.` },
      "Couldn't join",
    );

  const handleLeave = async () => {
    const ok = await run(() => leaveEvent(event.id), { title: "You left this coffee talk" }, "Couldn't leave");
    setLeaveOpen(false);
    if (ok) goBack();
  };

  const handleAnswer = async (coming: boolean) => {
    await run(
      () => respond(event.id, coming),
      coming
        ? { title: "See you there!", message: "Your group can see you're coming." }
        : { title: "Thanks for letting us know", message: "Your group will see you can't make it." },
      "Couldn't save your answer",
    );
    setAskOpen(false);
    setBackOutOpen(false);
  };

  const handleRate = (rating: number, comment: string) => {
    setRateOpen(false);
    run(() => reviewEvent(event.id, { rating, comment }), { title: "Thanks for the review!" }, "Couldn't save your review");
  };

  const report = (person?: { id: string; name: string }) =>
    router.push({
      pathname: "/report",
      params: person ? { eventId: event.id, userId: person.id, name: person.name } : { eventId: event.id },
    });

  const footer =
    kind === "available" ? (
      <Button title="Join" size="lg" fullWidth leftIcon="cafe" loading={busy} onPress={handleJoin} />
    ) : kind === "full" ? (
      <Button title="Event full" size="lg" fullWidth disabled />
    ) : kind === "joined" ? (
      <Button title="Leave" variant="outline" size="lg" fullWidth onPress={() => setLeaveOpen(true)} />
    ) : kind === "ready" ? (
      <Button title="Reveal" size="lg" fullWidth leftIcon="lock-open-outline" onPress={() => setAskOpen(true)} />
    ) : kind === "rate" ? (
      <Button title="Rate your coffee talk" size="lg" fullWidth leftIcon="star-outline" onPress={() => setRateOpen(true)} />
    ) : canBackOut(event) ? (
      <Button title="Can't make it anymore" variant="outline" size="lg" fullWidth onPress={() => setBackOutOpen(true)} />
    ) : undefined;

  return (
    <Screen edgeToEdge footer={footer} contentClassName="px-0 pt-0">
      <EventHero
        photo={cafe?.photo}
        hidden={!cafe}
        onBack={goBack}
        accessibilityLabel={cafe ? `Photo of ${cafe.name}` : "Hidden café picture"}
        actions={<IconButton icon="flag-outline" accessibilityLabel="Report a problem" onPress={() => report()} />}>
        {(kind === "available" || kind === "full" || kind === "joined" || kind === "preparing") && (
          <LocationCountdown revealAt={event.revealAt} label="Group and location revealed in" />
        )}
        {kind === "ready" && (
          <Animated.View entering={ZoomIn.duration(motion.base)}>
            <Button title="Your group is ready" size="lg" leftIcon="lock-open-outline" onPress={() => setAskOpen(true)} />
          </Animated.View>
        )}
      </EventHero>

      <View className="gap-6 px-5">
        <View className="gap-2">
          <View className="flex-row items-start justify-between gap-3">
            <Text variant="title" className="flex-1" accessibilityRole="header">
              {cafe ? cafe.name : "Mystery café"}
            </Text>
            <EventPhaseBadge event={event} className="mt-1.5" />
          </View>
          <Text tone="muted">{phaseMessage(event, formatDateTime)}</Text>
        </View>

        <Card className="gap-3">
          <InfoRow icon="calendar-outline" label={formatDateTime(event.date)} />
          {cafe ? (
            <CafeRows cafe={cafe} />
          ) : (
            <InfoRow icon="lock-closed-outline" label="Group and location revealed 24h before" />
          )}
        </Card>

        {visible && (
          <Section title={event.groupNumber ? `Your group · #${event.groupNumber}` : "Your group"}>
            <Card className="gap-1">
              {event.members.length === 0 ? (
                <Text tone="muted">It&apos;s just you so far.</Text>
              ) : (
                event.members.map((member) => (
                  <GroupMemberRow
                    key={member.id}
                    name={member.name}
                    emoji={member.emoji}
                    status={member.status}
                    sharedInterests={member.sharedInterests}
                    interestsLabel="You both like"
                    onReport={afterEvent ? () => report(member) : undefined}
                  />
                ))
              )}
            </Card>
          </Section>
        )}
      </View>

      <Modal
        visible={askOpen}
        onClose={() => setAskOpen(false)}
        emoji="☕"
        title="Are you coming to this coffee talk?"
        description={`${formatDateTime(event.date)}. Say yes to see your café and your group.`}
        primaryAction={{ title: "Yes, I'm coming", loading: busy, onPress: () => handleAnswer(true) }}
        secondaryAction={{ title: "No, I can't make it", onPress: () => handleAnswer(false) }}
      />

      <Modal
        visible={backOutOpen}
        onClose={() => setBackOutOpen(false)}
        title="Can't make it anymore?"
        description="Your group will see that you're not coming. This can't be undone."
        primaryAction={{ title: "I can't make it", variant: "destructive", loading: busy, onPress: () => handleAnswer(false) }}
        secondaryAction={{ title: "I'm still coming", onPress: () => setBackOutOpen(false) }}
      />

      <Modal
        visible={leaveOpen}
        onClose={() => setLeaveOpen(false)}
        title="Leave this coffee talk?"
        description="You can join again while registration is open."
        primaryAction={{ title: "Leave", variant: "destructive", loading: busy, onPress: handleLeave }}
        secondaryAction={{ title: "Keep my seat", onPress: () => setLeaveOpen(false) }}
      />

      <RateExperienceSheet
        visible={rateOpen}
        onClose={() => setRateOpen(false)}
        onSubmit={handleRate}
        onReport={() => {
          setRateOpen(false);
          report();
        }}
      />
    </Screen>
  );
}

function CafeRows({ cafe }: { cafe: Cafe }) {
  return (
    <>
      <InfoRow
        icon="location-outline"
        label={cafe.address}
        onPress={cafe.mapsUrl ? () => Linking.openURL(cafe.mapsUrl!) : undefined}
      />
      {cafe.mapsUrl && <InfoRow icon="map-outline" label="Open in maps" onPress={() => Linking.openURL(cafe.mapsUrl!)} />}
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
          onPress={() => Linking.openURL(`tel:${cafe.phone!.replace(/\s/g, "")}`)}
        />
      )}
    </>
  );
}

/** A café the user visited, opened from Home. */
function CafeOnly({ cafe }: { cafe: Cafe }) {
  return (
    <Screen edgeToEdge contentClassName="px-0 pt-0">
      <EventHero photo={cafe.photo} onBack={goBack} accessibilityLabel={`Photo of ${cafe.name}`} />
      <View className="gap-6 px-5">
        <View className="gap-2">
          <Text variant="title" accessibilityRole="header">
            {cafe.name}
          </Text>
          {!!cafe.description && <Text tone="muted">{cafe.description}</Text>}
        </View>
        <Card className="gap-3">
          <CafeRows cafe={cafe} />
        </Card>
      </View>
    </Screen>
  );
}
