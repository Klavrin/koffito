import { Button, type ButtonProps } from "./button";
import { StateView } from "./state-view";

export type EmptyStateProps = {
  emoji?: string;
  title?: string;
  description?: string;
  action?: Omit<ButtonProps, "size">;
  className?: string;
};

export function EmptyState({
  emoji = "☕",
  title = "No coffee buddies yet",
  description = "There's always someone new to meet.",
  action,
  className,
}: EmptyStateProps) {
  return (
    <StateView
      emoji={emoji}
      title={title}
      description={description}
      circleClassName="bg-secondary"
      action={action && <Button size="md" {...action} />}
      className={className}
    />
  );
}
