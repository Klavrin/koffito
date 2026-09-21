import { View } from "react-native";

import { Avatar } from "@/components/ui/avatar";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import type { User } from "@/types/koffito";
import { InterestChip } from "./interest-chip";

export type UserCardProps = {
  user: User;
  variant?: "default" | "compact";
  onPress?: () => void;
  /** e.g. `{ title: "Let's grab coffee", onPress }` */
  primaryAction?: Omit<ButtonProps, "size" | "fullWidth">;
  maxInterests?: number;
  animateIn?: boolean | number;
};

export function UserCard({
  user,
  variant = "default",
  onPress,
  primaryAction,
  maxInterests = 3,
  animateIn,
}: UserCardProps) {
  const heading = user.age ? `${user.name}, ${user.age}` : user.name;
  const status = user.isOnline ? "online" : undefined;

  if (variant === "compact") {
    return (
      <Card padding="sm" onPress={onPress} animateIn={animateIn} className="flex-row items-center gap-3">
        <Avatar name={user.name} emoji={user.emoji} size="md" status={status} />
        <View className="flex-1">
          <Text variant="label" numberOfLines={1}>
            {heading}
          </Text>
          {user.bio && (
            <Text variant="caption" tone="muted" numberOfLines={1}>
              {user.bio}
            </Text>
          )}
        </View>
        {primaryAction && <Button size="sm" {...primaryAction} />}
      </Card>
    );
  }

  const shown = user.interests.slice(0, maxInterests);
  const hidden = user.interests.length - shown.length;

  return (
    <Card onPress={onPress} animateIn={animateIn} className="gap-4">
      <View className="flex-row items-center gap-4">
        <Avatar name={user.name} emoji={user.emoji} size="lg" status={status} />
        <View className="flex-1 gap-0.5">
          <Text variant="heading" numberOfLines={1}>
            {heading}
          </Text>
          {user.location && (
            <View className="flex-row items-center gap-1">
              <Icon name="location-outline" size={13} color="muted" />
              <Text variant="caption" tone="muted" numberOfLines={1}>
                {user.location}
              </Text>
            </View>
          )}
        </View>
      </View>

      {user.bio && (
        <Text tone="muted" numberOfLines={2}>
          {user.bio}
        </Text>
      )}

      {shown.length > 0 && (
        <View className="flex-row flex-wrap gap-2">
          {shown.map((interest) => (
            <InterestChip key={interest} interest={interest} size="sm" />
          ))}
          {hidden > 0 && <InterestChip label={`+${hidden}`} size="sm" />}
        </View>
      )}

      {primaryAction && <Button fullWidth leftIcon="cafe" {...primaryAction} />}
    </Card>
  );
}

export function UserCardSkeleton() {
  return (
    <Card className="gap-4">
      <View className="flex-row items-center gap-4">
        <Skeleton shape="circle" width={64} />
        <View className="flex-1 gap-2">
          <Skeleton width="55%" height={18} />
          <Skeleton width="35%" height={12} />
        </View>
      </View>
      <SkeletonText lines={2} />
      <View className="flex-row gap-2">
        <Skeleton width={84} height={32} className="rounded-full" />
        <Skeleton width={96} height={32} className="rounded-full" />
      </View>
    </Card>
  );
}
