import { View } from "react-native";

import { AvatarGroup, Text } from "@/components/ui";
import { toAvatarPeople } from "@/lib/events";
import type { User } from "@/types/koffito";

export type PeopleLikeThisProps = {
  people: User[];
  /** e.g. "3/4 going". */
  caption?: string;
};

/** "People like this place" strip with overlapping faces. */
export function PeopleLikeThis({ people, caption }: PeopleLikeThisProps) {
  if (people.length === 0) {
    return (
      <Text variant="caption" tone="muted">
        No one has joined yet — be the first ☕
      </Text>
    );
  }

  const names = people.slice(0, 2).map((person) => person.name.split(" ")[0]);
  const others = people.length - names.length;

  return (
    <View className="flex-row items-center gap-3 rounded-full bg-surface-muted py-2 pl-2 pr-4">
      <AvatarGroup people={toAvatarPeople(people)} size="sm" />
      <View className="flex-1">
        <Text variant="label" numberOfLines={1}>
          People like this place
        </Text>
        <Text variant="caption" tone="muted" numberOfLines={1}>
          {names.join(", ")}
          {others > 0 ? ` and ${others} more` : ""}
          {caption ? ` · ${caption}` : ""}
        </Text>
      </View>
    </View>
  );
}
