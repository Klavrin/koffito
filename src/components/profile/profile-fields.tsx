import { View } from "react-native";

import { Chip, Input, Text } from "@/components/ui";
import { coffeeOptions, genderOptions } from "@/data/survey";
import type { Profile } from "@/types/koffito";

export type ProfileFieldValues = Pick<Profile, "gender" | "age" | "occupation" | "favoriteCoffee">;

export type ProfileFieldsProps = {
  values: ProfileFieldValues;
  onChange: (changes: Partial<ProfileFieldValues>) => void;
  ageError?: string;
};

/** Returns an error for ages outside the allowed range; empty is allowed (optional field). */
export function validateAge(age?: string) {
  if (!age) return undefined;
  const value = Number(age);
  return Number.isInteger(value) && value >= 18 && value <= 120 ? undefined : "Koffito is for ages 18 and up";
}

/** Gender / age / occupation / favorite coffee inputs shared by onboarding and profile editing. */
export function ProfileFields({ values, onChange, ageError }: ProfileFieldsProps) {
  return (
    <View className="gap-5">
      <ChoiceField
        label="Gender"
        options={genderOptions}
        value={values.gender}
        onChange={(gender) => onChange({ gender })}
      />
      <Input
        label="Age"
        placeholder="How many trips around the sun?"
        leftIcon="calendar-outline"
        keyboardType="number-pad"
        maxLength={3}
        value={values.age ?? ""}
        onChangeText={(age) => onChange({ age: age.replace(/\D/g, "") })}
        error={ageError}
      />
      <Input
        label="Occupation"
        placeholder="What keeps you busy?"
        leftIcon="briefcase-outline"
        value={values.occupation ?? ""}
        onChangeText={(occupation) => onChange({ occupation })}
      />
      <ChoiceField
        label="Favorite coffee"
        options={coffeeOptions}
        value={values.favoriteCoffee}
        onChange={(favoriteCoffee) => onChange({ favoriteCoffee })}
      />
    </View>
  );
}

type ChoiceFieldProps = {
  label: string;
  options: string[];
  value?: string;
  onChange: (value: string | undefined) => void;
};

function ChoiceField({ label, options, value, onChange }: ChoiceFieldProps) {
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
    </View>
  );
}
