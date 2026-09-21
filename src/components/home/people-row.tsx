import { Pressable, ScrollView, View } from "react-native";

import { Avatar, Icon, Text } from "@/components/ui";
import type { User } from "@/types/koffito";

export type PeopleRowProps = {
  people: User[];
  onSelect: (user: User) => void;
  onDiscoverMore: () => void;
};

/** Horizontally scrolling faces, ending in a "Discover more" bubble. */
export function PeopleRow({ people, onSelect, onDiscoverMore }: PeopleRowProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5" contentContainerClassName="gap-4 px-5 py-1">
      {people.map((person) => (
        <Pressable
          key={person.id}
          accessibilityRole="button"
          accessibilityLabel={`View ${person.name}`}
          onPress={() => onSelect(person)}
          className="w-[72px] items-center gap-2">
          <Avatar name={person.name} emoji={person.emoji} size="lg" status={person.isOnline ? "online" : undefined} />
          <Text variant="caption" numberOfLines={1}>
            {person.name.split(" ")[0]}
          </Text>
        </Pressable>
      ))}

      <Pressable accessibilityRole="button" onPress={onDiscoverMore} className="w-[72px] items-center gap-2">
        <View className="h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-primary/40 bg-secondary/40">
          <Icon name="add" size={28} color="primary" />
        </View>
        <Text variant="caption" tone="primary" numberOfLines={1}>
          Discover
        </Text>
      </Pressable>
    </ScrollView>
  );
}
