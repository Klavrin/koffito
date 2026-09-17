import type { PropsWithChildren } from "react";
import { View } from "react-native";

import { Text } from "@/components/ui";

export type FormFieldProps = PropsWithChildren<{
  label: string;
  error?: string;
}>;

/** Label + error wrapper for custom (non-`Input`) form controls. */
export function FormField({ label, error, children }: FormFieldProps) {
  return (
    <View className="gap-2">
      <Text variant="label">{label}</Text>
      {children}
      {error && (
        <Text variant="caption" tone="error">
          {error}
        </Text>
      )}
    </View>
  );
}
