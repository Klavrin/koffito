import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { createEvent, fetchAdminEvents } from "@/api";
import { AdminOnly } from "@/components/admin/admin-only";
import { CreateEventSheet } from "@/components/admin/create-event-sheet";
import { EventStatusBadge } from "@/components/admin/event-status-badge";
import { InfoRow } from "@/components/events/info-row";
import { Screen } from "@/components/layout";
import { Button, Card, EmptyState, ErrorState, Header, Skeleton, Text, useToast } from "@/components/ui";
import { useSession } from "@/context/session";
import { useInterval } from "@/hooks/use-interval";
import { useResource } from "@/hooks/use-resource";
import { formatDateTime } from "@/lib/date";
import { describeError } from "@/lib/errors";
import { goBack } from "@/lib/navigation";

export default function AdminEventsPage() {
  const { profile } = useSession();
  const toast = useToast();
  const isAdmin = !!profile.isAdmin;
  const { data, loading, error, refresh } = useResource(fetchAdminEvents, isAdmin);
  const [creating, setCreating] = useState(false);

  // Statuses move on the server every minute; keep the list current.
  useInterval(refresh, 30_000, isAdmin);

  const events = data ?? [];

  const handleCreate = async (date: Date) => {
    try {
      await createEvent(date);
      toast.show({ title: "Coffee talk created", message: formatDateTime(date), variant: "success" });
      await refresh();
      return true;
    } catch (createError) {
      toast.show({ title: "Couldn't create it", message: describeError(createError), variant: "error" });
      return false;
    }
  };

  return (
    <AdminOnly title="Coffee talks">
      <Screen
        header={<Header title="Coffee talks" subtitle="Everything runs on its own" onBack={goBack} />}
        footer={<Button title="Create event" size="lg" fullWidth leftIcon="add-circle" onPress={() => setCreating(true)} />}
        contentClassName="gap-3">
        {loading && events.length === 0 ? (
          <>
            <Skeleton height={112} className="rounded-3xl" />
            <Skeleton height={112} className="rounded-3xl" />
          </>
        ) : error && events.length === 0 ? (
          <ErrorState title="Couldn't load coffee talks" onRetry={refresh} className="flex-1 justify-center" />
        ) : events.length === 0 ? (
          <EmptyState
            emoji="☕"
            title="No coffee talks yet"
            description="Create the first one and let people join."
            className="flex-1 justify-center"
          />
        ) : (
          events.map((event, index) => (
            <Card
              key={event.id}
              animateIn={index}
              onPress={() => router.push({ pathname: "/admin/event", params: { id: event.id } })}
              className="gap-2">
              <View className="flex-row items-center justify-between gap-3">
                <Text variant="heading" className="flex-1">
                  {formatDateTime(new Date(event.event_at))}
                </Text>
                <EventStatusBadge status={event.status} />
              </View>
              <InfoRow
                size="sm"
                icon="people-outline"
                label={
                  event.status === "open"
                    ? `${event.participant_count} / ${event.capacity} joined`
                    : `${event.participant_count} people · ${event.group_count} group${event.group_count === 1 ? "" : "s"}`
                }
              />
              {event.status === "open" && (
                <InfoRow
                  size="sm"
                  icon="lock-closed-outline"
                  label={`Registration closes ${formatDateTime(new Date(event.registration_closes_at))}`}
                />
              )}
            </Card>
          ))
        )}

        <CreateEventSheet visible={creating} onClose={() => setCreating(false)} onCreate={handleCreate} />
      </Screen>
    </AdminOnly>
  );
}
