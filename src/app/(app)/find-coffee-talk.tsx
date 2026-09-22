import { router } from "expo-router";
import { useRef, useState } from "react";
import { type NativeScrollEvent, type NativeSyntheticEvent, ScrollView, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CafeCarouselCard } from "@/components/events/cafe-carousel-card";
import { MapPlaceholder } from "@/components/events/map-placeholder";
import { EmptyState, ErrorState, Header, Skeleton, useToast } from "@/components/ui";
import { useEvents } from "@/context/events";
import { useProfile } from "@/context/session";
import { formatRelativeDay } from "@/lib/date";
import { describeError } from "@/lib/errors";
import { isUpcoming } from "@/lib/events";
import { goBack } from "@/lib/navigation";

const CARD_GAP = 12;
const SIDE_PADDING = 20;

export default function FindCoffeeTalkPage() {
  const profile = useProfile();
  const { openEvents, loading, error, refresh, joinEvent } = useEvents();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  const carouselRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const open = openEvents.filter((event) => !event.joined && isUpcoming(event));
  // Leave a peek of the next card so the rail reads as swipeable.
  const cardWidth = Math.min(screenWidth, 480) - SIDE_PADDING * 2 - 24;
  const snap = cardWidth + CARD_GAP;

  const selectIndex = (index: number) => {
    setActiveIndex(index);
    carouselRef.current?.scrollTo({ x: index * snap, animated: true });
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / snap);
    if (index !== activeIndex && index >= 0 && index < open.length) setActiveIndex(index);
  };

  const handleJoin = async (id: string) => {
    setJoiningId(id);
    try {
      await joinEvent(id);
      toast.show({ title: "You're in! ☕", message: "We saved you a seat. The café is revealed before you meet.", variant: "success" });
      router.replace({ pathname: "/event-details", params: { id } });
    } catch (joinError) {
      toast.show({ title: "Couldn't join", message: describeError(joinError), variant: "error" });
      setJoiningId(null);
    }
  };

  const showSkeleton = loading && openEvents.length === 0;
  const showError = !!error && openEvents.length === 0;

  return (
    <View className="flex-1 bg-background">
      <Header title="Find coffee talk" subtitle={showSkeleton ? "Looking around…" : `${open.length} coffee talk(s) near you`} onBack={goBack} />

      {showSkeleton ? (
        <View className="gap-3 px-5 pt-2">
          <Skeleton height={260} className="rounded-3xl" />
        </View>
      ) : showError ? (
        <ErrorState title="Couldn't load coffee talks" onRetry={refresh} className="flex-1 justify-center px-5" />
      ) : open.length === 0 ? (
        <EmptyState
          emoji="🗺️"
          title="No coffee talks nearby"
          description={
            profile.isAdmin ? "Be the first — start one and others will join." : "New coffee talks pop up every week. Check back soon!"
          }
          action={profile.isAdmin ? { title: "Create new event", leftIcon: "add", onPress: () => router.replace("/create-event") } : undefined}
          className="flex-1 justify-center px-5"
        />
      ) : (
        <View className="flex-1 overflow-hidden rounded-t-sheet">
          <MapPlaceholder
            pins={open.map((event) => ({ id: event.id, label: `Coffee talk ${formatRelativeDay(event.date)}` }))}
            activeId={open[activeIndex]?.id}
            onSelect={(id) => selectIndex(open.findIndex((event) => event.id === id))}
          />

          <View style={{ bottom: Math.max(insets.bottom, 16) }} className="absolute inset-x-0">
            <ScrollView
              ref={carouselRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
              snapToInterval={snap}
              onScroll={handleScroll}
              scrollEventThrottle={32}
              contentContainerStyle={{ paddingHorizontal: SIDE_PADDING, gap: CARD_GAP, paddingVertical: 8 }}>
              {open.map((event) => (
                <CafeCarouselCard
                  key={event.id}
                  event={event}
                  width={cardWidth}
                  joining={joiningId === event.id}
                  onPress={() => router.push({ pathname: "/event-details", params: { id: event.id } })}
                  onJoin={() => handleJoin(event.id)}
                />
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}
