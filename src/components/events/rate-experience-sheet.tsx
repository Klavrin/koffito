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

const ratingLabels = [
  "Tap a star to rate",
  "Not my cup of coffee",
  "Could be better",
  "It was okay",
  "Pretty great!",
  "Best coffee talk ever!",
];

/** Ratings below this ask what went wrong instead of an optional comment. */
const LOW_RATING = 3;
const MIN_DETAILS = 10;

export function RateExperienceSheet({
  visible,
  onClose,
  onSubmit,
  onReport,
  initialRating = 0,
}: RateExperienceSheetProps) {
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Start fresh (from the stars tapped on the card) every time the sheet opens.
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setRating(initialRating);
      setComment("");
      setSubmitted(false);
    }
  }

  // A low rating needs an explanation; anything else the comment is optional.
  const low = rating > 0 && rating < LOW_RATING;
  const commentError =
    low && comment.trim().length < MIN_DETAILS
      ? "A sentence or two helps us understand what happened"
      : undefined;

  const handleSubmit = () => {
    setSubmitted(true);
    if (rating === 0 || commentError) return;
    onSubmit(rating, comment.trim());
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Rate your experience"
      description="Your feedback helps everyone find better coffee talks.">
      <View className="gap-5 pb-6">
        <View className="items-center gap-2">
          <RatingStars value={rating} onChange={setRating} size={40} />
          <Text variant="label" tone={rating ? "primary" : "muted"}>
            {ratingLabels[rating]}
          </Text>
        </View>

        <Input
          label={low ? "What went wrong?" : "Tell us more about your experience!"}
          placeholder={low ? "What would have made it better?" : "The coffee, the company, the vibe..."}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          fieldClassName="min-h-28 items-start py-3"
          value={comment}
          onChangeText={setComment}
          error={submitted ? commentError : undefined}
        />

        <Button title="Send rating" size="lg" fullWidth disabled={rating === 0} onPress={handleSubmit} />

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
