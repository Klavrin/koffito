import { router } from "expo-router";
import { type PropsWithChildren, useState } from "react";
import { ScrollView, View } from "react-native";

import { InterestChip, MatchCard, MeetupCard, UserCard, UserCardSkeleton } from "@/components/koffito";
import {
  Avatar,
  AvatarGroup,
  Badge,
  BottomSheet,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Header,
  IconButton,
  Input,
  Modal,
  SearchInput,
  Skeleton,
  SkeletonText,
  TabBar,
  Text,
  useToast,
} from "@/components/ui";
import { type Interest, interests } from "@/constants/interests";
import type { Match, Meetup, User } from "@/types/koffito";

const maya: User = {
  id: "1",
  name: "Maya Lopez",
  age: 27,
  bio: "Latte art enthusiast, weekend hiker and forever looking for the best croissant in town.",
  photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600",
  interests: ["coffee", "hiking", "photography", "books", "travel"],
  location: "Old Town",
  isOnline: true,
};

const sam: User = {
  id: "2",
  name: "Sam Carter",
  age: 31,
  bio: "Indie games, vinyl records and very strong espresso.",
  interests: ["gaming", "music", "coffee"],
  location: "Riverside",
};

const match: Match = { id: "m1", user: maya, sharedInterests: ["coffee", "hiking"], distance: "1.2 km away" };

const inTwoDays = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
inTwoDays.setHours(10, 30, 0, 0);

const meetups: Meetup[] = [
  { id: "e1", participants: [maya], place: "The Roasted Bean", address: "12 Market St", date: inTwoDays, status: "pending" },
  { id: "e2", title: "Board games & flat whites", participants: [maya, sam, { ...sam, id: "3", name: "Alex Kim" }, { ...sam, id: "4", name: "Jo Park" }], place: "Café Mondo", date: inTwoDays, status: "confirmed" },
];

function Section({ title, children }: PropsWithChildren<{ title: string }>) {
  return (
    <View className="gap-3">
      <Text variant="heading">{title}</Text>
      {children}
    </View>
  );
}

/** Dev gallery of every Koffito UI component. */
export default function ComponentsScreen() {
  const toast = useToast();
  const [selected, setSelected] = useState<Interest[]>(["coffee", "music"]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [tab, setTab] = useState("discover");
  const [showSkeleton, setShowSkeleton] = useState(true);

  const toggleInterest = (interest: Interest) =>
    setSelected((current) =>
      current.includes(interest) ? current.filter((item) => item !== interest) : [...current, interest],
    );

  const fakeLoad = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1500);
  };

  return (
    <View className="flex-1 bg-background">
      <Header
        title="Components"
        subtitle="Koffito UI kit"
        onBack={router.canGoBack() ? router.back : undefined}
        right={
          <IconButton
            icon="notifications-outline"
            accessibilityLabel="Show toast"
            onPress={() => toast.show({ title: "Hello there ☕", message: "This is an info toast." })}
          />
        }
      />

      <ScrollView contentContainerClassName="gap-8 px-5 pb-40 pt-2">
        <Section title="Typography">
          <Text variant="display">Find your coffee buddy</Text>
          <Text variant="title">Meetups this week</Text>
          <Text variant="heading">People nearby</Text>
          <Text>Body text stays calm and readable for longer descriptions.</Text>
          <Text variant="label">Label text</Text>
          <Text variant="caption" tone="muted">
            Caption · muted
          </Text>
        </Section>

        <Section title="Buttons">
          <Button title="Find someone" leftIcon="search" size="lg" fullWidth />
          <View className="flex-row flex-wrap gap-3">
            <Button title="Let's grab coffee" leftIcon="cafe" />
            <Button title="Create meetup" variant="secondary" />
            <Button title="Send message" variant="outline" rightIcon="send" />
            <Button title="Maybe later" variant="ghost" />
            <Button title="Cancel meetup" variant="destructive" />
            <Button title="Disabled" disabled />
            <Button title="Tap to load" loading={loading} onPress={fakeLoad} />
            <Button title="Small" size="sm" />
          </View>
        </Section>

        <Section title="Icon buttons">
          <View className="flex-row items-center gap-3">
            <IconButton icon="heart" variant="primary" accessibilityLabel="Like" />
            <IconButton icon="chatbubble-ellipses" variant="secondary" accessibilityLabel="Message" />
            <IconButton icon="share-outline" accessibilityLabel="Share" />
            <IconButton icon="ellipsis-horizontal" variant="ghost" accessibilityLabel="More" />
            <IconButton icon="close" size="sm" accessibilityLabel="Close" />
            <IconButton icon="cafe" size="lg" variant="primary" accessibilityLabel="Coffee" />
          </View>
        </Section>

        <Section title="Avatars & badges">
          <View className="flex-row items-end gap-3">
            <Avatar name="Maya Lopez" emoji={maya.emoji} size="xl" status="online" />
            <Avatar name="Sam Carter" size="lg" status="away" />
            <Avatar name="Alex Kim" size="md" status="busy" />
            <Avatar name="Jo" size="sm" badge={<Text>☕</Text>} />
            <Avatar name="Riley" size="xs" />
          </View>
          <AvatarGroup people={meetups[1].participants} size="md" />
          <View className="flex-row flex-wrap gap-2">
            <Badge label="New" variant="primary" />
            <Badge label="Online" variant="success" dot />
            <Badge label="2 pending" variant="warning" icon="time-outline" />
            <Badge label="Blocked" variant="error" />
            <Badge label="Neutral" />
          </View>
        </Section>

        <Section title="Chips">
          <View className="flex-row flex-wrap gap-2">
            {(Object.keys(interests) as Interest[]).map((interest) => (
              <InterestChip
                key={interest}
                interest={interest}
                selected={selected.includes(interest)}
                onPress={() => toggleInterest(interest)}
              />
            ))}
          </View>
        </Section>

        <Section title="Inputs">
          <SearchInput value={query} onChangeText={setQuery} placeholder="Search people or cafés" />
          <Input label="Name" placeholder="What should we call you?" leftIcon="person-outline" />
          <Input label="Password" placeholder="••••••••" secureTextEntry helperText="At least 8 characters" />
          <Input label="Email" placeholder="you@example.com" defaultValue="maya@" error="That email doesn't look quite right" />
        </Section>

        <Section title="Cards">
          <Card>
            <Text variant="heading">Elevated card</Text>
            <Text tone="muted">Soft shadow on a warm surface.</Text>
          </Card>
          <Card variant="filled" onPress={() => toast.show({ title: "Card pressed" })}>
            <Text variant="heading">Filled & pressable</Text>
            <Text tone="muted">Tap me.</Text>
          </Card>
          <Card variant="outlined">
            <Text variant="heading">Outlined card</Text>
          </Card>
        </Section>

        <Section title="Overlays & feedback">
          <View className="flex-row flex-wrap gap-3">
            <Button title="Bottom sheet" variant="secondary" onPress={() => setSheetOpen(true)} />
            <Button title="Modal" variant="secondary" onPress={() => setModalOpen(true)} />
            <Button
              title="Success toast"
              variant="outline"
              onPress={() => toast.show({ title: "Invite sent!", message: "We'll let you know when Maya replies.", variant: "success" })}
            />
            <Button
              title="Error toast"
              variant="outline"
              onPress={() => toast.show({ title: "Couldn't send invite", message: "Check your connection.", variant: "error" })}
            />
          </View>
        </Section>

        <Section title="Skeletons">
          <Button
            title={showSkeleton ? "Show content" : "Show skeleton"}
            variant="ghost"
            size="sm"
            onPress={() => setShowSkeleton((value) => !value)}
          />
          {showSkeleton ? <UserCardSkeleton /> : <UserCard user={sam} animateIn />}
          <View className="flex-row items-center gap-3">
            <Skeleton shape="circle" width={40} />
            <SkeletonText lines={2} className="flex-1" />
          </View>
        </Section>

        <Section title="User cards">
          <UserCard
            user={maya}
            animateIn={0}
            primaryAction={{ title: "Let's grab coffee", onPress: () => toast.show({ title: "Invite sent ☕", variant: "success" }) }}
          />
          <UserCard user={sam} variant="compact" animateIn={1} primaryAction={{ title: "Say hi", variant: "secondary" }} />
        </Section>

        <Section title="Match card">
          <MatchCard
            match={match}
            onPass={() => toast.show({ title: "Maybe next time" })}
            onConnect={() => toast.show({ title: "It's a match!", variant: "success" })}
          />
        </Section>

        <Section title="Meetup cards">
          <MeetupCard
            meetup={meetups[0]}
            onAccept={() => toast.show({ title: "See you there!", variant: "success" })}
            onDecline={() => toast.show({ title: "No worries" })}
          />
          <MeetupCard meetup={meetups[1]} />
          <MeetupCard meetup={{ ...meetups[0], id: "e3", status: "completed" }} />
          <MeetupCard meetup={{ ...meetups[1], id: "e4", status: "cancelled" }} />
        </Section>

        <Section title="Empty & error states">
          <Card>
            <EmptyState action={{ title: "Find someone", leftIcon: "search" }} />
          </Card>
          <Card>
            <ErrorState onRetry={fakeLoad} retrying={loading} />
          </Card>
        </Section>
      </ScrollView>

      <View className="absolute inset-x-0 bottom-0">
        <TabBar
          activeKey={tab}
          onChange={setTab}
          items={[
            { key: "discover", label: "Discover", icon: "compass-outline", activeIcon: "compass" },
            { key: "meetups", label: "Meetups", icon: "cafe-outline", activeIcon: "cafe", badge: 2 },
            { key: "chats", label: "Chats", icon: "chatbubbles-outline", activeIcon: "chatbubbles", badge: true },
            { key: "profile", label: "Profile", icon: "person-outline", activeIcon: "person" },
          ]}
        />
      </View>

      <BottomSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Pick your vibe"
        description="Choose what you'd love to chat about.">
        <View className="mb-6 flex-row flex-wrap gap-2">
          {(["coffee", "music", "books", "travel", "art"] as Interest[]).map((interest) => (
            <InterestChip
              key={interest}
              interest={interest}
              selected={selected.includes(interest)}
              onPress={() => toggleInterest(interest)}
            />
          ))}
        </View>
        <Button title="Save" fullWidth onPress={() => setSheetOpen(false)} />
      </BottomSheet>

      <Modal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        emoji="☕"
        title="Coffee with Maya?"
        description="We'll send Maya an invite for Thursday at 10:30 at The Roasted Bean."
        primaryAction={{
          title: "Send invite",
          onPress: () => {
            setModalOpen(false);
            toast.show({ title: "Invite sent!", variant: "success" });
          },
        }}
        secondaryAction={{ title: "Not now", onPress: () => setModalOpen(false) }}
      />
    </View>
  );
}
