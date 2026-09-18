import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { Screen } from "@/components/layout";
import { AvatarPicker } from "@/components/profile/avatar-picker";
import {
  isProfileComplete,
  ProfileFields,
  type ProfileFieldValues,
  validateProfileFields,
} from "@/components/profile/profile-fields";
import { OptionList } from "@/components/survey/option-list";
import { SurveyProgress } from "@/components/survey/survey-progress";
import { SurveyStep } from "@/components/survey/survey-step";
import { Button, Header, Text, useToast } from "@/components/ui";
import { useSession } from "@/context/session";
import {
  interestQuestions,
  motivationQuestion,
  type SurveyQuestion,
} from "@/data/survey";
import { goBack } from "@/lib/navigation";
import type { SurveyAnswers } from "@/types/koffito";

type Step = { kind: "question"; question: SurveyQuestion } | { kind: "about" };

const onboardingSteps: Step[] = [
  { kind: "about" },
  { kind: "question", question: motivationQuestion },
  ...interestQuestions.map((question) => ({
    kind: "question" as const,
    question,
  })),
];
const interestSteps: Step[] = [motivationQuestion, ...interestQuestions].map(
  (question) => ({ kind: "question", question }),
);

const choiceHint = (max: number) =>
  max === 1 ? "Choose 1" : `Choose up to ${max}`;

export default function SurveyPage() {
  // `?mode=interests` retakes only the interests part (from the profile editor).
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const retake = mode === "interests";
  const steps = retake ? interestSteps : onboardingSteps;

  const { profile, updateProfile } = useSession();
  const toast = useToast();

  const [stepIndex, setStepIndex] = useState(0);
  // Profile errors only appear once "Next" has been pressed, like the register form.
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState<SurveyAnswers>(profile.survey);
  const [avatar, setAvatar] = useState(profile.avatar);
  const [details, setDetails] = useState<ProfileFieldValues>({
    gender: profile.gender,
    age: profile.age,
    occupation: profile.occupation,
    favoriteCoffee: profile.favoriteCoffee,
  });

  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;
  const detailErrors = validateProfileFields(details);
  const canContinue =
    step.kind === "about"
      ? true
      : (answers[step.question.key]?.length ?? 0) > 0;

  const handleBack = () => {
    setSubmitted(false);
    if (stepIndex > 0) return setStepIndex(stepIndex - 1);
    goBack();
  };

  const handleNext = () => {
    // Every profile detail is required, so surface what is missing instead of moving on.
    if (step.kind === "about" && !isProfileComplete(details))
      return setSubmitted(true);

    setSubmitted(false);
    if (!isLast) return setStepIndex(stepIndex + 1);

    updateProfile({ ...details, avatar, survey: answers, onboarded: true });

    if (retake) {
      toast.show({
        title: "Interests updated",
        message: "We'll use them for your next matches.",
        variant: "success",
      });
      goBack();
    } else {
      toast.show({
        title: `You're all set, ${profile.firstName}!`,
        message: "Time to find a coffee talk.",
        variant: "success",
      });
      router.replace("/");
    }
  };

  // The first onboarding step has nowhere to go back to.
  const showBack = stepIndex > 0 || retake;

  return (
    <Screen
      header={
        <Header
          title={retake ? "Retake survey" : "Let's get to know you"}
          onBack={showBack ? handleBack : undefined}
        />
      }
      footer={
        <Button
          title={isLast ? (retake ? "Save interests" : "Get started") : "Next"}
          size="lg"
          fullWidth
          rightIcon={isLast ? undefined : "arrow-forward"}
          disabled={!canContinue}
          onPress={handleNext}
        />
      }
    >
      <SurveyProgress step={stepIndex} total={steps.length} />

      {step.kind === "about" ? (
        <SurveyStep
          key="about"
          section="Profile"
          question="Tell us more about you"
        >
          <View className="items-center gap-2">
            <Text variant="heading">
              Hi, {profile.firstName || "there"}! 👋
            </Text>
            <AvatarPicker value={avatar} onChange={setAvatar} />
          </View>
          <ProfileFields
            values={details}
            onChange={(changes) =>
              setDetails((current) => ({ ...current, ...changes }))
            }
            errors={submitted ? detailErrors : undefined}
          />
        </SurveyStep>
      ) : (
        <SurveyStep
          key={step.question.key}
          section={step.question.section}
          question={step.question.question}
          hint={choiceHint(step.question.max)}
        >
          <OptionList
            options={step.question.options}
            max={step.question.max}
            selected={answers[step.question.key] ?? []}
            onChange={(selected) =>
              setAnswers((current) => ({
                ...current,
                [step.question.key]: selected,
              }))
            }
          />
        </SurveyStep>
      )}
    </Screen>
  );
}
