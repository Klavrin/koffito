import { Image } from "expo-image";
import { View } from "react-native";

import { MeetupStatus } from "@/components/koffito";
import { AvatarGroup, Button, Card, Text } from "@/components/ui";
import { formatAttendance, getCafeLabel, isLocationHidden, isUpcoming } from "@/data/events";
import { toAvatarPeople } from "@/data/users";
import { formatDateTime } from "@/lib/date";
import type { CoffeeEvent } from "@/types/koffito";

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

/** List card for a coffee talk: café picture, when/where and who's coming. */
export function EventCard({ event, onPress, animateIn, onConfirm, onReview }: EventCardProps) {
  const hidden = isLocationHidden(event);
  // Past coffee talks are confirmed first, then reviewed.
  const past = !isUpcoming(event) && event.joined;
  const askConfirm = past && !event.attendance && !!onConfirm;
  const askReview = past && event.attendance === "happened" && !event.review && !!onReview;

  return (
    <Card onPress={onPress} animateIn={animateIn} padding="sm" className="gap-3">
      <View className="flex-row gap-3">
        <View>
          <Image
            source={event.cafe.photo}
            contentFit="cover"
            transition={200}
            blurRadius={hidden ? 40 : 0}
            accessibilityLabel={hidden ? "Locked café" : `Photo of ${event.cafe.name}`}
            style={{ width: 92, height: 92, borderRadius: 20 }}
          />
          {/* Marks the blurred photo as deliberately hidden, not a failed image. */}
          {hidden && (
            <View className="absolute inset-0 items-center justify-center">
              <Text className="text-[40px] leading-[48px] text-white">?</Text>
            </View>
          )}
        </View>
        <View className="flex-1 justify-center gap-1.5">
          <Text variant="heading" numberOfLines={1}>
            {getCafeLabel(event)}
          </Text>
          <InfoRow size="sm" icon="calendar-outline" label={formatDateTime(event.date)} />
          <InfoRow size="sm" icon="location-outline" label={hidden ? "Revealed before the meetup" : event.cafe.address} />
        </View>
      </View>

      <View className="flex-row items-center justify-between px-1 pb-1">
        <View className="flex-row items-center gap-2">
          {/* Faces and headcount stay hidden until the café is revealed. */}
          {!hidden && <AvatarGroup people={toAvatarPeople(event.participants)} size="xs" />}
          <Text variant="caption" tone="muted">
            {formatAttendance(event)}
          </Text>
        </View>
        <MeetupStatus status={event.status} />
      </View>

      {askConfirm && (
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

      {askReview && (
        <View className="border-t border-border pt-3">
          <Button title="Leave a review" variant="secondary" size="sm" fullWidth leftIcon="star-outline" onPress={onReview} />
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
