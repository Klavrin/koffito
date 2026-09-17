import { Image, type ImageSource } from "expo-image";
import type { ReactNode } from "react";
import { View } from "react-native";

import { cn } from "@/lib/cn";
import { useKoffitoTheme } from "@/theme/theme-provider";
import { avatarTones } from "@/theme/tokens";
import { Text } from "./text";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";
export type AvatarStatus = "online" | "away" | "busy";

export type AvatarProps = {
  name: string;
  source?: ImageSource | string | null;
  size?: AvatarSize;
  status?: AvatarStatus;
  /** Custom badge rendered on the top-right (e.g. an emoji or count). */
  badge?: ReactNode;
  className?: string;
};

const sizes: Record<AvatarSize, { px: number; text: string; dot: number }> = {
  xs: { px: 28, text: "text-[11px]", dot: 8 },
  sm: { px: 36, text: "text-xs", dot: 10 },
  md: { px: 48, text: "text-base", dot: 12 },
  lg: { px: 64, text: "text-xl", dot: 14 },
  xl: { px: 96, text: "text-3xl", dot: 18 },
};

const statusClasses: Record<AvatarStatus, string> = {
  online: "bg-success",
  away: "bg-warning",
  busy: "bg-error",
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] ?? "?").slice(0, 2);
  return letters.toUpperCase();
}

function toneIndex(name: string) {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return hash % avatarTones.light.length;
}

export function Avatar({ name, source, size = "md", status, badge, className }: AvatarProps) {
  const { scheme } = useKoffitoTheme();
  const { px, text, dot } = sizes[size];

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={status ? `${name}, ${status}` : name}
      style={{ width: px, height: px }}
      className={className}>
      {source ? (
        <Image
          source={source}
          contentFit="cover"
          transition={200}
          style={{ width: px, height: px, borderRadius: px / 2 }}
        />
      ) : (
        <View
          style={{ width: px, height: px, backgroundColor: avatarTones[scheme][toneIndex(name)] }}
          className="items-center justify-center rounded-full">
          <Text variant="label" tone="on-secondary" className={text}>
            {initials(name)}
          </Text>
        </View>
      )}

      {status && (
        <View
          style={{ width: dot + 4, height: dot + 4 }}
          className="absolute bottom-0 right-0 items-center justify-center rounded-full bg-surface">
          <View style={{ width: dot, height: dot }} className={cn("rounded-full", statusClasses[status])} />
        </View>
      )}

      {badge && <View className="absolute -right-1 -top-1">{badge}</View>}
    </View>
  );
}

export type AvatarGroupProps = {
  people: { name: string; source?: AvatarProps["source"] }[];
  size?: AvatarSize;
  max?: number;
};

/** Overlapping stack of avatars, e.g. meetup participants. */
export function AvatarGroup({ people, size = "sm", max = 3 }: AvatarGroupProps) {
  const visible = people.slice(0, max);
  const extra = people.length - visible.length;
  const { px, text } = sizes[size];

  return (
    <View className="flex-row items-center">
      {visible.map((person, index) => (
        <View
          key={`${person.name}-${index}`}
          style={{ marginLeft: index === 0 ? 0 : -px / 3 }}
          className="rounded-full border-2 border-surface">
          <Avatar name={person.name} source={person.source} size={size} />
        </View>
      ))}
      {extra > 0 && (
        <View
          style={{ width: px + 4, height: px + 4, marginLeft: -px / 3 }}
          className="items-center justify-center rounded-full border-2 border-surface bg-surface-muted">
          <Text variant="caption" tone="muted" className={text}>
            +{extra}
          </Text>
        </View>
      )}
    </View>
  );
}
