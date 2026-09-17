import { type ReactNode, type Ref, useState } from "react";
import { Pressable, TextInput, type TextInputProps, View } from "react-native";

import { cn } from "@/lib/cn";
import { useKoffitoTheme } from "@/theme/theme-provider";
import { Icon, type IconName } from "./icon";
import { Text } from "./text";

export type InputProps = Omit<TextInputProps, "style"> & {
  label?: string;
  helperText?: string;
  /** Error message; also switches the field to its error style. */
  error?: string;
  leftIcon?: IconName;
  rightElement?: ReactNode;
  /** Classes for the rounded field container (e.g. `rounded-full`). */
  fieldClassName?: string;
  className?: string;
  ref?: Ref<TextInput>;
};

export function Input({
  label,
  helperText,
  error,
  leftIcon,
  rightElement,
  secureTextEntry,
  editable = true,
  fieldClassName,
  className,
  onFocus,
  onBlur,
  ref,
  ...rest
}: InputProps) {
  const { colors } = useKoffitoTheme();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);

  return (
    <View className={cn("gap-1.5", className)}>
      {label && (
        <Text variant="label" className="ml-1">
          {label}
        </Text>
      )}

      <View
        className={cn(
          "min-h-14 flex-row items-center gap-2.5 rounded-2xl border-2 border-transparent bg-surface-muted px-4",
          focused && "border-primary/50 bg-surface",
          !!error && "border-error/60",
          !editable && "opacity-60",
          fieldClassName,
        )}>
        {leftIcon && <Icon name={leftIcon} size={20} color={focused ? "primary" : "muted"} />}

        <TextInput
          ref={ref}
          editable={editable}
          secureTextEntry={secureTextEntry && hidden}
          placeholderTextColor={colors.muted}
          selectionColor={colors.primary}
          cursorColor={colors.primary}
          accessibilityLabel={label ?? rest.placeholder}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          className="flex-1 py-3 font-body text-base text-foreground"
          {...rest}
        />

        {secureTextEntry && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? "Show password" : "Hide password"}
            hitSlop={10}
            onPress={() => setHidden((value) => !value)}>
            <Icon name={hidden ? "eye-outline" : "eye-off-outline"} size={20} color="muted" />
          </Pressable>
        )}
        {rightElement}
      </View>

      {(error || helperText) && (
        <Text variant="caption" tone={error ? "error" : "muted"} className="ml-1">
          {error ?? helperText}
        </Text>
      )}
    </View>
  );
}
