import type { PropsWithChildren } from "react";

import { Screen } from "@/components/layout";
import { ErrorState, Header } from "@/components/ui";
import { useSession } from "@/context/session";
import { goBack } from "@/lib/navigation";

/** Renders its children for admins; everyone else gets a friendly lock. The API checks too. */
export function AdminOnly({ title, children }: PropsWithChildren<{ title: string }>) {
  const { profile } = useSession();

  if (profile.isAdmin) return <>{children}</>;

  return (
    <Screen header={<Header title={title} onBack={goBack} />} contentClassName="flex-1 justify-center">
      <ErrorState
        emoji="🔒"
        title="Admins only"
        description="This area is reserved for the Koffito team."
        retryLabel="Go back"
        onRetry={goBack}
      />
    </Screen>
  );
}
