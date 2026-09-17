import { Image } from "expo-image";
import { View } from "react-native";
import Animated, {
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconButton } from "@/components/ui/icon-button";
import { Text } from "@/components/ui/text";
import { motion } from "@/theme/tokens";
import type { Match } from "@/types/koffito";
import { InterestChip } from "./interest-chip";

export type MatchCardProps = {
  match: Match;
  onConnect?: () => void;
  onPass?: () => void;
  connectLabel?: string;
  connecting?: boolean;
};

const PHOTO_HEIGHT = 300;

export function MatchCard({
  match,
  onConnect,
  onPass,
  connectLabel = "Let's grab coffee",
  connecting = false,
}: MatchCardProps) {
  const { user, sharedInterests, distance } = match;
  const pulse = useSharedValue(0);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
    transform: [{ scale: 0.6 + pulse.value * 0.8 }],
  }));

  const handleConnect = () => {
    pulse.value = withSequence(
      withSpring(1, motion.spring),
      withTiming(0, { duration: motion.slow }),
    );
    onConnect?.();
  };

  return (
    <Animated.View entering={FadeInUp.duration(motion.slow)}>
      <Card padding="none" className="overflow-hidden">
        <View style={{ height: PHOTO_HEIGHT }} className="bg-secondary">
          {user.photo ? (
            <Image source={user.photo} contentFit="cover" transition={250} style={{ flex: 1 }} />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Avatar name={user.name} size="xl" />
            </View>
          )}

          <View
            style={{ experimental_backgroundImage: "linear-gradient(180deg, rgba(42,26,16,0) 40%, rgba(42,26,16,0.75) 100%)" }}
            className="absolute inset-0 justify-end p-5">
            <Text variant="title" className="text-white">
              {user.age ? `${user.name}, ${user.age}` : user.name}
            </Text>
            {(distance || user.location) && (
              <Text variant="caption" className="text-white/85">
                📍 {distance ?? user.location}
              </Text>
            )}
          </View>

          <Animated.View
            pointerEvents="none"
            style={pulseStyle}
            className="absolute inset-0 items-center justify-center">
            <Text className="text-[72px] leading-[88px]">☕</Text>
          </Animated.View>
        </View>

        <View className="gap-4 p-5">
          {user.bio && (
            <Text tone="muted" numberOfLines={3}>
              {user.bio}
            </Text>
          )}

          {sharedInterests.length > 0 && (
            <View className="gap-2">
              <Text variant="caption" tone="muted">
                You both love
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {sharedInterests.map((interest) => (
                  <InterestChip key={interest} interest={interest} size="sm" selected />
                ))}
              </View>
            </View>
          )}

          <View className="flex-row items-center gap-3">
            {onPass && (
              <IconButton icon="close" accessibilityLabel={`Pass on ${user.name}`} size="lg" onPress={onPass} />
            )}
            <View className="flex-1">
              <Button
                title={connectLabel}
                leftIcon="cafe"
                size="lg"
                fullWidth
                loading={connecting}
                onPress={handleConnect}
              />
            </View>
          </View>
        </View>
      </Card>
    </Animated.View>
  );
}
