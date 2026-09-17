import { Button } from "./button";
import { StateView } from "./state-view";

export type ErrorStateProps = {
  emoji?: string;
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  retrying?: boolean;
  className?: string;
};

export function ErrorState({
  emoji = "🫗",
  title = "Oops, spilled the coffee",
  description = "Something went wrong. Let's try that again.",
  onRetry,
  retryLabel = "Try again",
  retrying = false,
  className,
}: ErrorStateProps) {
  return (
    <StateView
      emoji={emoji}
      title={title}
      description={description}
      circleClassName="bg-error-soft"
      action={
        onRetry && (
          <Button title={retryLabel} variant="outline" leftIcon="refresh" loading={retrying} onPress={onRetry} />
        )
      }
      className={className}
    />
  );
}
