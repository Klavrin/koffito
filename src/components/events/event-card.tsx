import { View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { MeetupStatus } from "@/components/koffito";
import { AvatarGroup, Badge, Button, Card, Icon, Text } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatDateTime, formatRelativeDay } from "@/lib/date";
import { formatAttendance, getCafeLabel, getConfirmStage, getEventState } from "@/lib/events";
import { toAvatarPeople } from "@/lib/people";
import { motion } from "@/theme/tokens";
import type { CoffeeEvent } from "@/types/koffito";

import { CafePhoto } from "./cafe-photo";
import { InfoRow } from "./info-row";
import { RatingStars } from "./rating-stars";

export type EventCardProps = {
  event: CoffeeEvent;
  onPress?: () => void;
  animateIn?: boolean | number;
  /** Answer to "did this happen?" on a past coffee talk. */
  onConfirm?: (happened: boolean) => void;
  /** Opens the review sheet for a past coffee talk that happened. */
  onReview?: () => void;
};

/**
 * List card for a coffee talk. The layout is shared; what changes per state is
 * the photo, the location line and the footer — see `getEventState`.
 */
export function EventCard({ event, onPress, animateIn, onConfirm, onReview }: EventCardProps) {
  const state = getEventState(event);
  const locked = state.kind === "mystery" || state.kind === "awaiting-reveal";
  // The café is sitting there waiting to be opened, so this card asks for attention.
  const ready = state.kind === "awaiting-reveal";
  // Waiting for the user to say they're still coming.
  const confirmStage = getConfirmStage(event);

  const locationLabel =
    state.kind === "mystery"
      ? `Revealed ${formatRelativeDay(state.revealAt)}`
      : state.kind === "awaiting-reveal"
        ? "The reveal is awaiting"
        : (event.cafe?.address ?? "Café to be announced");

  return (
    <Card
      onPress={onPress}
      animateIn={animateIn}
      padding="sm"
      className={cn("gap-3", ready && "border-2 border-primary bg-secondary")}>
      <View className="flex-row gap-3">
        <View>
          <Animated.View key={locked ? "locked" : "open"} entering={FadeIn.duration(motion.slow)}>
            {/* The API withholds the café while it's a secret, so the placeholder does the hiding. */}
            <CafePhoto cafe={event.cafe} hidden={locked} width={92} height={92} iconSize={0} />
          </Animated.View>
          {/* Marks the placeholder as deliberately hidden, not a failed image. */}
          {locked && (
            <View className="absolute inset-0 items-center justify-center">
              {ready ? (
                <Icon name="lock-open" size={34} color="on-secondary" />
              ) : (
                <Text className="text-[40px] leading-[48px]" tone="on-secondary">
                  ?
                </Text>
              )}
            </View>
          )}
        </View>

        <View className="flex-1 justify-center gap-1.5">
          <Text variant="heading" numberOfLines={1}>
            {getCafeLabel(event)}
          </Text>
          <InfoRow size="sm" icon="calendar-outline" label={formatDateTime(event.date)} />
          <InfoRow
            size="sm"
            icon={locked ? "lock-closed-outline" : "location-outline"}
            label={locationLabel}
          />
        </View>
      </View>

      <View className="flex-row items-center justify-between px-1 pb-1">
        <View className="flex-row items-center gap-2">
          {/* Faces and headcount stay hidden until the café is revealed. */}
          {!locked && <AvatarGroup people={toAvatarPeople(event.participants)} size="xs" />}
          <Text variant="caption" tone="muted">
            {formatAttendance(event)}
          </Text>
        </View>
        {ready ? (
          <Badge label="Tap to reveal" variant="primary" icon="lock-open-outline" />
        ) : confirmStage ? (
          <Badge label="Confirm you're coming" variant="warning" icon="alarm-outline" />
        ) : (
          <MeetupStatus status={event.status} />
        )}
      </View>

      {state.kind === "past" && state.needsConfirm && onConfirm && (
        <View className="gap-2 border-t border-border pt-3">
          <Text variant="label">Did this coffee talk happen?</Text>
          {/* Button sizes itself to its content, so each half needs its own flex box. */}
          <View className="flex-row gap-2">
            <View className="flex-1">
              <Button title="Yes" size="sm" fullWidth onPress={() => onConfirm(true)} />
            </View>
            <View className="flex-1">
              <Button title="No" variant="outline" size="sm" fullWidth onPress={() => onConfirm(false)} />
            </View>
          </View>
        </View>
      )}

      {state.kind === "past" && state.needsReview && onReview && (
        <View className="border-t border-border pt-3">
          <Button title="Leave a review" variant="secondary" size="sm" fullWidth leftIcon="star-outline" onPress={onReview} />
        </View>
      )}

      {event.attendance === "missed" && (
        <View className="border-t border-border pt-3">
          <Text variant="caption" tone="muted" numberOfLines={2}>
            {event.attendanceNote ? `Didn't happen · ${event.attendanceNote}` : "Didn't happen"}
          </Text>
        </View>
      )}

      {event.review && (
        <View className="flex-row items-center gap-2 border-t border-border pt-3">
          <RatingStars value={event.review.rating} size={16} />
          <Text variant="caption" tone="muted" className="flex-1" numberOfLines={1}>
            {event.review.comment || "Thanks for the review"}
          </Text>
        </View>
      )}
    </Card>
  );
}
