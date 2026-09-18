import { useState } from "react";
import { Pressable, View } from "react-native";

import { BottomSheet, Button, Input, Text } from "@/components/ui";

import { RatingStars } from "./rating-stars";

export type RateExperienceSheetProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => void;
  /** "Something happened? Report" */
  onReport: () => void;
  initialRating?: number;
};

const ratingLabels = ["Tap a star to rate", "Not my cup of coffee", "Could be better", "It was okay", "Pretty great!", "Best coffee talk ever!"];

export function RateExperienceSheet({ visible, onClose, onSubmit, onReport, initialRating = 0 }: RateExperienceSheetProps) {
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState("");

  // Start fresh (from the stars tapped on the page) every time the sheet opens.
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setRating(initialRating);
      setComment("");
    }
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Rate your experience" description="Your feedback helps everyone find better coffee talks.">
      <View className="gap-5 pb-6">
        <View className="items-center gap-2">
          <RatingStars value={rating} onChange={setRating} size={40} />
          <Text variant="label" tone={rating ? "primary" : "muted"}>
            {ratingLabels[rating]}
          </Text>
        </View>

        <Input
          label="Tell us more about your experience!"
          placeholder="The coffee, the company, the vibe..."
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          fieldClassName="min-h-28 items-start py-3"
          value={comment}
          onChangeText={setComment}
        />

        <Button title="Send rating" size="lg" fullWidth disabled={rating === 0} onPress={() => onSubmit(rating, comment.trim())} />

        <Pressable accessibilityRole="link" hitSlop={8} onPress={onReport} className="self-center">
          <Text variant="caption" tone="muted">
            Something happened?{" "}
            <Text variant="caption" tone="error">
              Report
            </Text>
          </Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}
