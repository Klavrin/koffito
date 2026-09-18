import { router } from "expo-router";
import { View } from "react-native";

import { InfoRow } from "@/components/events/info-row";
import { Screen, Section } from "@/components/layout";
import { EmojiAvatar } from "@/components/profile/emoji-avatar";
import { Badge, Button, Card, Chip, Header, IconButton, Text } from "@/components/ui";
import { useEvents } from "@/context/events";
import { useSession } from "@/context/session";
import { visitedCafes } from "@/data/cafes";
import { findSurveyOption } from "@/data/survey";
import { users } from "@/data/users";

/** Survey questions surfaced on the profile, in display order. */
const interestGroups = [
  { key: "hobbies", title: "Hobbies" },
  { key: "topics", title: "Loves talking about" },
];

export default function ProfilePage() {
  const { profile } = useSession();
  const { events } = useEvents();

  const coffeeTalks = events.filter((event) => event.joined && event.status === "completed").length;
  const stats = [
    { label: "Coffee talks", value: coffeeTalks },
    { label: "Cafés visited", value: visitedCafes.length },
    { label: "People met", value: users.length },
  ];

  const meetup = findSurveyOption("meetup", profile.survey.meetup?.[0] ?? "");
  const personality = findSurveyOption("personality", profile.survey.personality?.[0] ?? "");
  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(" ");

  return (
    <Screen
      tabBarInset
      header={
        <Header
          title="Profile"
          right={<IconButton icon="settings-outline" accessibilityLabel="Settings" onPress={() => router.push("/settings")} />}
        />
      }>
      <View className="items-center gap-3">
        <EmojiAvatar emoji={profile.avatar} size="xl" />
        <View className="items-center gap-1">
          <Text variant="title">Hi, {fullName}! 👋</Text>
          {profile.occupation && <Text tone="muted">{profile.occupation}</Text>}
        </View>
        <View className="flex-row flex-wrap justify-center gap-2">
          {personality && <Badge label={`${personality.emoji} ${personality.label.split(" (")[0]}`} variant="primary" />}
          {meetup && <Badge label={`${meetup.emoji} ${meetup.label.split(" (")[0]}`} />}
        </View>
        {/* Button aligns itself to the start, so center it with a row. */}
        <View className="flex-row justify-center">
          <Button
            title="Edit profile"
            variant="secondary"
            size="sm"
            leftIcon="create-outline"
            onPress={() => router.push("/survey-profile-settings")}
          />
        </View>
      </View>

      <Card className="flex-row">
        {stats.map((stat) => (
          <View key={stat.label} className="flex-1 items-center gap-0.5">
            <Text variant="title" tone="primary">
              {stat.value}
            </Text>
            <Text variant="caption" tone="muted">
              {stat.label}
            </Text>
          </View>
        ))}
      </Card>

      <Section title="About me">
        <Card className="gap-3">
          <InfoRow icon="cafe-outline" label={`Favorite coffee: ${profile.favoriteCoffee ?? "still deciding"}`} />
          <InfoRow icon="person-outline" label={`Gender: ${profile.gender ?? "not shared"}`} />
          <InfoRow icon="calendar-outline" label={`Age: ${profile.age ?? "not shared"}`} />
          <InfoRow icon="briefcase-outline" label={`Occupation: ${profile.occupation ?? "not shared"}`} />
        </Card>
      </Section>

      {interestGroups.map((group) => {
        const answers = profile.survey[group.key] ?? [];
        if (answers.length === 0) return null;

        return (
          <Section key={group.key} title={group.title}>
            <View className="flex-row flex-wrap gap-2">
              {answers.map((answer) => {
                const option = findSurveyOption(group.key, answer);
                return option ? <Chip key={answer} label={option.label} emoji={option.emoji} size="sm" /> : null;
              })}
            </View>
          </Section>
        );
      })}
    </Screen>
  );
}
