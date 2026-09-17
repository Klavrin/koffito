import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Pressable, View } from "react-native";
import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useKoffitoTheme } from "@/theme/theme-provider";
import { motion } from "@/theme/tokens";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "./icon";
import { Text, type TextTone } from "./text";

export type ToastVariant = "info" | "success" | "error";

export type ToastOptions = {
  title: string;
  message?: string;
  variant?: ToastVariant;
  /** Milliseconds before auto-dismiss. */
  duration?: number;
};

type ToastItem = ToastOptions & { id: number };

type ToastContextValue = {
  show: (options: ToastOptions) => void;
  hide: () => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const variantStyles: Record<ToastVariant, { icon: IconName; circle: string; tone: TextTone & ("primary" | "success" | "error") }> = {
  info: { icon: "cafe", circle: "bg-secondary", tone: "primary" },
  success: { icon: "checkmark-circle", circle: "bg-success-soft", tone: "success" },
  error: { icon: "alert-circle", circle: "bg-error-soft", tone: "error" },
};

/** Shows one toast at a time; later toasts wait in a queue. */
export function ToastProvider({ children }: PropsWithChildren) {
  const [queue, setQueue] = useState<ToastItem[]>([]);
  const nextId = useRef(0);
  const current = queue[0];

  const show = useCallback((options: ToastOptions) => {
    setQueue((items) => [...items, { ...options, id: nextId.current++ }]);
  }, []);

  const hide = useCallback(() => {
    setQueue((items) => items.slice(1));
  }, []);

  useEffect(() => {
    if (!current) return;
    const timeout = setTimeout(hide, current.duration ?? 3000);
    return () => clearTimeout(timeout);
  }, [current, hide]);

  const value = useMemo(() => ({ show, hide }), [show, hide]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <View pointerEvents="box-none" className="absolute inset-x-0 top-0">
        {current && <ToastView key={current.id} toast={current} onDismiss={hide} />}
      </View>
    </ToastContext.Provider>
  );
}

function ToastView({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const { shadows } = useKoffitoTheme();
  const insets = useSafeAreaInsets();
  const styles = variantStyles[toast.variant ?? "info"];

  return (
    <Animated.View
      entering={FadeInUp.duration(motion.base)}
      exiting={FadeOutUp.duration(motion.fast)}
      style={{ marginTop: insets.top + 8 }}
      className="px-4">
      <Pressable
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        onPress={onDismiss}
        style={{ boxShadow: shadows.raised }}
        className="flex-row items-center gap-3 self-center rounded-3xl bg-surface py-3 pl-3 pr-5">
        <View className={cn("h-10 w-10 items-center justify-center rounded-full", styles.circle)}>
          <Icon name={styles.icon} size={22} color={styles.tone} />
        </View>
        <View className="shrink">
          <Text variant="label">{toast.title}</Text>
          {toast.message && (
            <Text variant="caption" tone="muted">
              {toast.message}
            </Text>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

export function useToast() {
  const value = useContext(ToastContext);

  if (!value) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return value;
}
