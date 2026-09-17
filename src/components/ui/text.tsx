import { Text as RNText, type TextProps as RNTextProps } from "react-native";

import { cn } from "@/lib/cn";

export type TextVariant = "display" | "title" | "heading" | "body" | "label" | "caption";
export type TextTone =
  | "default"
  | "muted"
  | "primary"
  | "on-primary"
  | "on-secondary"
  | "success"
  | "warning"
  | "error";

export type TextProps = RNTextProps & {
  variant?: TextVariant;
  tone?: TextTone;
  className?: string;
};

const variantClasses: Record<TextVariant, string> = {
  display: "font-heading text-[34px] leading-[40px] tracking-tight",
  title: "font-heading text-[26px] leading-[32px]",
  heading: "font-body-bold text-xl leading-7",
  body: "font-body text-base leading-6",
  label: "font-body-bold text-[15px] leading-5",
  caption: "font-body-medium text-[13px] leading-[18px]",
};

const toneClasses: Record<TextTone, string> = {
  default: "text-foreground",
  muted: "text-muted",
  primary: "text-primary",
  "on-primary": "text-on-primary",
  "on-secondary": "text-on-secondary",
  success: "text-success",
  warning: "text-warning",
  error: "text-error",
};

export function Text({ variant = "body", tone = "default", className, ...rest }: TextProps) {
  return <RNText className={cn(variantClasses[variant], toneClasses[tone], className)} {...rest} />;
}
