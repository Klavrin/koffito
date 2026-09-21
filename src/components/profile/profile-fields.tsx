import { View } from "react-native";

import { Chip, Input, Text } from "@/components/ui";
import { coffeeOptions, genderOptions } from "@/data/survey";
import type { Profile } from "@/types/koffito";

export type ProfileFieldValues = Pick<Profile, "gender" | "age" | "occupation" | "favoriteCoffee">;

export type ProfileFieldErrors = Partial<Record<keyof ProfileFieldValues, string>>;

export type ProfileFieldsProps = {
  values: ProfileFieldValues;
  onChange: (changes: Partial<ProfileFieldValues>) => void;
  errors?: ProfileFieldErrors;
};

/** Returns an error for a missing age or one outside the allowed range. */
export function validateAge(age?: string) {
  if (!age) return "We need your age";
  const value = Number(age);
  return Number.isInteger(value) && value >= 18 && value <= 120 ? undefined : "Koffito is for ages 18 and up";
}

/** Every profile field is required; returns a message per field that still needs one. */
export function validateProfileFields(values: ProfileFieldValues): ProfileFieldErrors {
  return {
    gender: values.gender ? undefined : "Pick one",
    age: validateAge(values.age),
    occupation: values.occupation?.trim() ? undefined : "We need your occupation",
    favoriteCoffee: values.favoriteCoffee ? undefined : "Pick one",
  };
}

/** True when no profile field is missing or invalid. */
export function isProfileComplete(values: ProfileFieldValues) {
  return Object.values(validateProfileFields(values)).every((error) => !error);
}

/** Gender / age / occupation / favorite coffee inputs shared by onboarding and profile editing. */
export function ProfileFields({ values, onChange, errors }: ProfileFieldsProps) {
  return (
    <View className="gap-5">
      <ChoiceField
        label="Gender"
        options={genderOptions}
        value={values.gender}
        onChange={(gender) => onChange({ gender })}
        error={errors?.gender}
      />
      <Input
        label="Age"
        placeholder="How many trips around the sun?"
        leftIcon="calendar-outline"
        keyboardType="number-pad"
        maxLength={3}
        value={values.age ?? ""}
        onChangeText={(age) => onChange({ age: age.replace(/\D/g, "") })}
        error={errors?.age}
      />
      <Input
        label="Occupation"
        placeholder="What keeps you busy?"
        leftIcon="briefcase-outline"
        value={values.occupation ?? ""}
        onChangeText={(occupation) => onChange({ occupation })}
        error={errors?.occupation}
      />
      <ChoiceField
        label="Favorite coffee"
        options={coffeeOptions}
        value={values.favoriteCoffee}
        onChange={(favoriteCoffee) => onChange({ favoriteCoffee })}
        error={errors?.favoriteCoffee}
      />
    </View>
  );
}

type ChoiceFieldProps = {
  label: string;
  options: string[];
  value?: string;
  onChange: (value: string | undefined) => void;
  error?: string;
};

function ChoiceField({ label, options, value, onChange, error }: ChoiceFieldProps) {
  return (
    <View className="gap-2">
      <Text variant="label">{label}</Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((option) => (
          <Chip
            key={option}
            label={option}
            size="sm"
            selected={option === value}
            onPress={() => onChange(option === value ? undefined : option)}
          />
        ))}
      </View>
      {error && (
        <Text variant="caption" tone="error" className="ml-1">
          {error}
        </Text>
      )}
    </View>
  );
}
