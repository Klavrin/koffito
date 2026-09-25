import { View } from "react-native";

import { Chip } from "@/components/ui";
import { findSurveyOption } from "@/data/survey";
import { cn } from "@/lib/cn";

/** Turns a "question:answer" key (e.g. "hobbies:hiking") into its survey label and emoji. */
export function interestLabel(tag: string) {
  const [question = "", answer = ""] = tag.split(":");
  const option = findSurveyOption(question, answer);
  return { label: option?.label ?? answer, emoji: option?.emoji };
}

export type SharedInterestsProps = { tags: string[]; max?: number; className?: string };

/** Interests two or more people have in common, as small pills. */
export function SharedInterests({ tags, max = 4, className }: SharedInterestsProps) {
  if (tags.length === 0) return null;
  const shown = tags.slice(0, max);
  const more = tags.length - shown.length;

  return (
    <View className={cn("flex-row flex-wrap gap-1.5", className)}>
      {shown.map((tag) => {
        const { label, emoji } = interestLabel(tag);
        return <Chip key={tag} label={label} emoji={emoji} size="sm" />;
      })}
      {more > 0 && <Chip label={`+${more}`} size="sm" />}
    </View>
  );
}
