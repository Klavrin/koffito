import { View } from "react-native";

import { AvatarGroup } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import type { Meetup } from "@/types/koffito";
import { MeetupStatus } from "./meetup-status";

export type MeetupCardProps = {
  meetup: Meetup;
  onPress?: () => void;
  /** Shown for pending meetups. */
  onAccept?: () => void;
  onDecline?: () => void;
  animateIn?: boolean | number;
};

const monthFormat = new Intl.DateTimeFormat(undefined, { month: "short" });
const timeFormat = new Intl.DateTimeFormat(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" });

export function MeetupCard({ meetup, onPress, onAccept, onDecline, animateIn }: MeetupCardProps) {
  const { date, participants, status } = meetup;
  const title = meetup.title ?? `Coffee with ${participants.map((person) => person.name.split(" ")[0]).join(" & ")}`;
  const showResponse = status === "pending" && (onAccept || onDecline);

  return (
    <Card onPress={onPress} animateIn={animateIn} className="gap-4">
      <View className="flex-row gap-4">
        <View className="h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
          <Text variant="caption" tone="on-secondary" className="uppercase">
            {monthFormat.format(date)}
          </Text>
          <Text variant="title" tone="on-secondary" className="leading-7">
            {date.getDate()}
          </Text>
        </View>

        <View className="flex-1 gap-1">
          <Text variant="heading" numberOfLines={1} className="text-lg">
            {title}
          </Text>
          <View className="flex-row items-center gap-1.5">
            <Icon name="location-outline" size={15} color="muted" />
            <Text variant="caption" tone="muted" numberOfLines={1} className="flex-1">
              {meetup.address ? `${meetup.place} · ${meetup.address}` : meetup.place}
            </Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <Icon name="time-outline" size={15} color="muted" />
            <Text variant="caption" tone="muted">
              {timeFormat.format(date)}
            </Text>
          </View>
        </View>
      </View>

      <View className="flex-row items-center justify-between">
        <AvatarGroup people={participants.map((person) => ({ name: person.name, emoji: person.emoji }))} />
        <MeetupStatus status={status} />
      </View>

      {showResponse && (
        <View className="flex-row gap-3">
          {onDecline && (
            <View className="flex-1">
              <Button title="Not this time" variant="outline" size="sm" fullWidth onPress={onDecline} />
            </View>
          )}
          {onAccept && (
            <View className="flex-1">
              <Button title="I'm in" leftIcon="checkmark" size="sm" fullWidth onPress={onAccept} />
            </View>
          )}
        </View>
      )}
    </Card>
  );
}
