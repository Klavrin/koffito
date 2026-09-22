import type { ReactNode } from "react";
import { View } from "react-native";

import { InfoRow } from "@/components/events/info-row";
import { Section } from "@/components/layout";
import { Badge, Card, Chip, Text } from "@/components/ui";
import { findSurveyOption } from "@/data/survey";
import type { SurveyAnswers } from "@/types/koffito";

import { EmojiAvatar } from "./emoji-avatar";

/** Everything the profile setup collects — the shape both profile screens render. */
export type ProfileViewData = {
  name: string;
  /** Emoji avatar picked during onboarding. */
  avatar?: string;
  gender?: string;
  age?: string;
  occupation?: string;
  favoriteCoffee?: string;
  survey: SurveyAnswers;
};

/** Survey questions surfaced on a profile, in display order. */
const surveyGroups = [
  { key: "motivation", title: "Why I'm here" },
  { key: "hobbies", title: "Hobbies" },
  { key: "topics", title: "Loves talking about" },
];

export type ProfileViewProps = {
  profile: ProfileViewData;
  /** Overrides the name shown under the avatar, e.g. "Hi, George!". */
  title?: string;
  /** Rendered under the badges, e.g. an "Edit profile" button. */
  action?: ReactNode;
  /** Coffee talks / cafés visited / people met. */
  stats?: { label: string; value: number }[];
};

/**
 * Read-only view of a profile, used for both your own profile and other
 * people's. It mirrors the profile setup step field for field, so anything
 * added to the survey shows up here for everyone.
 */
export function ProfileView({ profile, title, action, stats }: ProfileViewProps) {
  const meetup = findSurveyOption("meetup", profile.survey.meetup?.[0] ?? "");
  const personality = findSurveyOption("personality", profile.survey.personality?.[0] ?? "");

  return (
    <>
      <View className="items-center gap-3">
        <EmojiAvatar emoji={profile.avatar} size="xl" />
        <View className="items-center gap-1">
          <Text variant="title">{title ?? profile.name}</Text>
          {profile.occupation && <Text tone="muted">{profile.occupation}</Text>}
        </View>
        <View className="flex-row flex-wrap justify-center gap-2">
          {personality && <Badge label={`${personality.emoji} ${personality.label.split(" (")[0]}`} variant="primary" />}
          {meetup && <Badge label={`${meetup.emoji} ${meetup.label.split(" (")[0]}`} />}
        </View>
        {/* Buttons align to the start, so center them with a row. */}
        {action && <View className="flex-row justify-center">{action}</View>}
      </View>

      {stats && stats.length > 0 && (
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
      )}

      <Section title="About me">
        <Card className="gap-3">
          <InfoRow icon="cafe-outline" label={`Favorite coffee: ${profile.favoriteCoffee ?? "still deciding"}`} />
          <InfoRow icon="person-outline" label={`Gender: ${profile.gender ?? "not shared"}`} />
          <InfoRow icon="calendar-outline" label={`Age: ${profile.age ?? "not shared"}`} />
          <InfoRow icon="briefcase-outline" label={`Occupation: ${profile.occupation ?? "not shared"}`} />
        </Card>
      </Section>

      {surveyGroups.map((group) => {
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
    </>
  );
}
