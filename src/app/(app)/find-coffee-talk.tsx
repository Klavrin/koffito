import { router } from "expo-router";
import { useRef, useState } from "react";
import { type NativeScrollEvent, type NativeSyntheticEvent, ScrollView, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CafeCarouselCard } from "@/components/events/cafe-carousel-card";
import { MapPlaceholder } from "@/components/events/map-placeholder";
import { EmptyState, Header, useToast } from "@/components/ui";
import { useEvents } from "@/context/events";
import { isUpcoming } from "@/data/events";

const CARD_GAP = 12;
const SIDE_PADDING = 20;

export default function FindCoffeeTalkPage() {
  const { events, joinEvent } = useEvents();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  const carouselRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const open = events.filter((event) => !event.joined && !event.locationHidden && isUpcoming(event));
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

  const handleJoin = (id: string, cafeName: string) => {
    joinEvent(id);
    toast.show({ title: "You're in! ☕", message: `We saved you a seat at ${cafeName}.`, variant: "success" });
    router.replace({ pathname: "/event-details", params: { id } });
  };

  return (
    <View className="flex-1 bg-background">
      <Header title="Find coffee talk" subtitle={`${open.length} coffee talk(s) near you`} onBack={router.back} />

      {open.length === 0 ? (
        <EmptyState
          emoji="🗺️"
          title="No coffee talks nearby"
          description="Be the first — start one and others will join."
          action={{ title: "Create new event", leftIcon: "add", onPress: () => router.replace("/create-event") }}
          className="flex-1 justify-center px-5"
        />
      ) : (
        <View className="flex-1 overflow-hidden rounded-t-sheet">
          <MapPlaceholder
            pins={open.map((event) => ({ id: event.id, label: event.cafe.name }))}
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
                  onPress={() => router.push({ pathname: "/event-details", params: { id: event.id } })}
                  onJoin={() => handleJoin(event.id, event.cafe.name)}
                />
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}
