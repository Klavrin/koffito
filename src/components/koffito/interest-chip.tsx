import { Chip, type ChipProps } from "@/components/ui/chip";
import { type Interest, interests } from "@/constants/interests";

export type InterestChipProps = Omit<ChipProps, "label" | "emoji" | "icon"> &
  ({ interest: Interest; label?: never; emoji?: never } | { interest?: never; label: string; emoji?: string });

/** Interest tag like `☕ Coffee`. Pass a known `interest` key, or a custom `label` + `emoji`. */
export function InterestChip({ interest, label, emoji, ...rest }: InterestChipProps) {
  const known = interest ? interests[interest] : undefined;

  return <Chip label={known?.label ?? label ?? ""} emoji={known?.emoji ?? emoji} {...rest} />;
}
