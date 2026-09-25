import { View } from "react-native";

import { Avatar, Badge, type BadgeVariant, IconButton, Text } from "@/components/ui";
import { memberStatusLabel } from "@/lib/events";
import type { ParticipantStatus } from "@/types/koffito";

import { SharedInterests } from "./shared-interests";

const statusVariant: Record<ParticipantStatus, BadgeVariant> = {
  joined: "neutral",
  matched: "neutral",
  confirmed: "success",
  declined: "error",
};

export type GroupMemberRowProps = {
  name: string;
  emoji?: string;
  status: ParticipantStatus;
  sharedInterests: string[];
  /** Label above the chips, e.g. "You both like" or "Shares". */
  interestsLabel?: string;
  onReport?: () => void;
};

/** One person in a group: face, first name, their answer, and what they have in common. */
export function GroupMemberRow({ name, emoji, status, sharedInterests, interestsLabel, onReport }: GroupMemberRowProps) {
  return (
    <View className="gap-2 py-2">
      <View className="flex-row items-center gap-3">
        <Avatar name={name} emoji={emoji} size="sm" />
        <View className="flex-1 gap-1">
          <Text variant="label" numberOfLines={1}>
            {name}
          </Text>
          <Badge label={memberStatusLabel[status]} variant={statusVariant[status]} />
        </View>
        {onReport && (
          <IconButton icon="flag-outline" variant="ghost" size="sm" accessibilityLabel={`Report ${name}`} onPress={onReport} />
        )}
      </View>
      {sharedInterests.length > 0 && (
        <View className="gap-1 pl-12">
          {interestsLabel && (
            <Text variant="caption" tone="muted">
              {interestsLabel}
            </Text>
          )}
          <SharedInterests tags={sharedInterests} />
        </View>
      )}
    </View>
  );
}
