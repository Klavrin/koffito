import { Pressable, View } from "react-native";

import { AvatarGroup, Icon, Text } from "@/components/ui";
import { toAvatarPeople } from "@/data/users";
import type { User } from "@/types/koffito";

export type PeopleGoingProps = {
  people: User[];
  /** Past coffee talks say who went, not who is going. */
  past?: boolean;
  /** Opens the list of everyone going. */
  onPress?: () => void;
};

/** Tappable strip of who is coming to a coffee talk. */
export function PeopleGoing({ people, past = false, onPress }: PeopleGoingProps) {
  if (people.length === 0) {
    return (
      <Text variant="caption" tone="muted">
        {past ? "No one joined this one." : "No one has joined yet — be the first."}
      </Text>
    );
  }

  const names = people.slice(0, 2).map((person) => person.name.split(" ")[0]);
  const others = people.length - names.length;
  const count = people.length;
  const label = past
    ? `${count} ${count === 1 ? "person" : "people"} went`
    : `${count} ${count === 1 ? "person is" : "people are"} going`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}. See who.`}
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-full bg-surface-muted py-2 pl-2 pr-4">
      <AvatarGroup people={toAvatarPeople(people)} size="sm" />
      <View className="flex-1">
        <Text variant="label" numberOfLines={1}>
          {label}
        </Text>
        <Text variant="caption" tone="muted" numberOfLines={1}>
          {names.join(", ")}
          {others > 0 ? ` and ${others} more` : ""}
        </Text>
      </View>
      {onPress && <Icon name="chevron-forward" size={18} color="muted" />}
    </Pressable>
  );
}
