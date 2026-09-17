import type { PropsWithChildren, ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { cn } from "@/lib/cn";

export type ScreenProps = PropsWithChildren<{
  /** Usually a `Header`; it handles the top safe-area inset itself. */
  header?: ReactNode;
  /** Sticky area pinned to the bottom (e.g. the main call to action). */
  footer?: ReactNode;
  /** Disable when the screen manages its own scrolling (lists, maps). */
  scroll?: boolean;
  /** Leave room for the floating tab bar on tab screens. */
  tabBarInset?: boolean;
  /** Let content run under the status bar (e.g. a hero image). */
  edgeToEdge?: boolean;
  contentClassName?: string;
}>;

/** Space taken by the floating tab bar plus some breathing room. */
const TAB_BAR_SPACE = 112;

/** Shared screen shell: warm background, safe areas, keyboard handling and a centered column on wide screens. */
export function Screen({ header, footer, scroll = true, tabBarInset = false, edgeToEdge = false, contentClassName, children }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const bottomSpace = tabBarInset ? TAB_BAR_SPACE + insets.bottom : footer ? 16 : insets.bottom + 24;
  const content = cn("w-full max-w-xl self-center gap-6 px-5 pt-2", contentClassName);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ paddingTop: header || edgeToEdge ? 0 : insets.top }}
      className="flex-1 bg-background">
      {header && <View className="w-full max-w-xl self-center">{header}</View>}

      {scroll ? (
        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: bottomSpace, flexGrow: 1 }}
          contentContainerClassName={content}>
          {children}
        </ScrollView>
      ) : (
        <View style={{ paddingBottom: bottomSpace }} className={cn("flex-1", content)}>
          {children}
        </View>
      )}

      {footer && (
        <View
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
          className="w-full max-w-xl gap-3 self-center bg-background px-5 pt-3">
          {footer}
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
