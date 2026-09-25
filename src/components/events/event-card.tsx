import { View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { Button, Card, Icon, Text } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatDateTime, formatRelativeDay } from "@/lib/date";
import { canSeeDetails, getEventPhase, phaseMessage } from "@/lib/events";
import { motion } from "@/theme/tokens";
import type { CoffeeEvent } from "@/types/koffito";

import { CafePhoto } from "./cafe-photo";
import { EventPhaseBadge } from "./event-phase-badge";
import { InfoRow } from "./info-row";
import { RatingStars } from "./rating-stars";

export type EventCardProps = {
  event: CoffeeEvent;
  onPress?: () => void;
  animateIn?: boolean | number;
  /** "Reveal" on a coffee talk whose group is ready: opens "Are you coming?". */
  onReveal?: () => void;
  /** "Rate your coffee talk" once it's over. */
  onRate?: () => void;
};

/**
 * List card for a coffee talk in "My events". What it says and offers comes from
 * `getEventPhase`; the café only appears once the user said they're coming.
 */
export function EventCard({ event, onPress, animateIn, onReveal, onRate }: EventCardProps) {
  const phase = getEventPhase(event);
  const visible = canSeeDetails(phase);
  const ready = phase.kind === "ready";

  return (
    <Card
      onPress={onPress}
      animateIn={animateIn}
      padding="sm"
      className={cn("gap-3", ready && "border-2 border-primary bg-secondary")}>
      <View className="flex-row gap-3">
        <View>
          <Animated.View key={visible ? "open" : "locked"} entering={FadeIn.duration(motion.slow)}>
            <CafePhoto cafe={event.cafe} hidden={!visible} width={92} height={92} iconSize={0} />
          </Animated.View>
          {!visible && (
            <View className="absolute inset-0 items-center justify-center">
              <Icon name={ready ? "lock-open" : "lock-closed"} size={30} color="on-secondary" />
            </View>
          )}
        </View>

        <View className="flex-1 justify-center gap-1.5">
          <Text variant="heading" numberOfLines={1}>
            {visible && event.cafe ? event.cafe.name : "Mystery café"}
          </Text>
          <InfoRow size="sm" icon="calendar-outline" label={formatDateTime(event.date)} />
          <InfoRow
            size="sm"
            icon={visible ? "location-outline" : "time-outline"}
            label={visible && event.cafe ? event.cafe.address : formatRelativeDay(event.date)}
          />
        </View>
      </View>

      <View className="flex-row items-center justify-between gap-2 px-1">
        <Text variant="caption" tone="muted" className="flex-1" numberOfLines={2}>
          {phaseMessage(event, formatDateTime)}
        </Text>
        <EventPhaseBadge event={event} />
      </View>

      {ready && onReveal && (
        <Button title="Reveal" size="sm" fullWidth leftIcon="lock-open-outline" onPress={onReveal} />
      )}

      {phase.kind === "rate" && onRate && (
        <Button title="Rate your coffee talk" variant="secondary" size="sm" fullWidth leftIcon="star-outline" onPress={onRate} />
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
