import { Pressable } from "react-native";

import { Text } from "@/components/ui";

export type AuthSwitchLinkProps = {
  prompt: string;
  actionLabel: string;
  onPress: () => void;
};

/** "Don't have an account? Register" style link under auth forms. */
export function AuthSwitchLink({ prompt, actionLabel, onPress }: AuthSwitchLinkProps) {
  return (
    <Pressable accessibilityRole="link" hitSlop={8} onPress={onPress} className="self-center py-2">
      <Text tone="muted">
        {prompt}{" "}
        <Text variant="label" tone="primary">
          {actionLabel}
        </Text>
      </Text>
    </Pressable>
  );
}
