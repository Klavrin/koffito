import { useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { View } from "react-native";

import { cancelAdminEvent, fetchAdminEvent, revealAdminEventNow } from "@/api";
import { AdminOnly } from "@/components/admin/admin-only";
import { EventStatusBadge } from "@/components/admin/event-status-badge";
import { GroupMemberRow } from "@/components/events/group-member-row";
import { InfoRow } from "@/components/events/info-row";
import { RatingStars } from "@/components/events/rating-stars";
import { SharedInterests } from "@/components/events/shared-interests";
import { Screen, Section } from "@/components/layout";
import { Badge, Button, Card, ErrorState, Header, Modal, Skeleton, Text, useToast } from "@/components/ui";
import { useSession } from "@/context/session";
import { reportReasonLabel } from "@/data/reports";
import { useInterval } from "@/hooks/use-interval";
import { useResource } from "@/hooks/use-resource";
import { formatCountdown, formatDateTime } from "@/lib/date";
import { describeError } from "@/lib/errors";
import { memberStatusLabel } from "@/lib/events";
import { goBack } from "@/lib/navigation";
import type { AdminEventDetail, AdminGroup } from "@/types/api";

/** Matchmaking normally finishes on the first tick after closing; longer than this is worth a look. */
const CLOSED_TOO_LONG_MS = 3 * 60 * 1000;
const CANCELLABLE = new Set(["open", "closed", "matched", "revealed"]);
/** "Reveal now" is a testing shortcut; the API only allows it outside production. */
const REVEALABLE = new Set(["open", "closed", "matched"]);

export default function AdminEventPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useSession();
  const toast = useToast();
  const isAdmin = !!profile.isAdmin;

  const load = useCallback(() => fetchAdminEvent(id), [id]);
  const { data, loading, error, refresh, setData } = useResource(load, isAdmin && !!id);
  const [now, setNow] = useState(() => Date.now());
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [revealOpen, setRevealOpen] = useState(false);
  const [revealing, setRevealing] = useState(false);

  // A live countdown, and a fresh look at the server every 30 seconds.
  useInterval(() => setNow(Date.now()), 1000, isAdmin);
  useInterval(refresh, 30_000, isAdmin);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      setData(await cancelAdminEvent(id));
      toast.show({ title: "Coffee talk cancelled", variant: "info" });
    } catch (cancelError) {
      toast.show({ title: "Couldn't cancel", message: describeError(cancelError), variant: "error" });
    } finally {
      setCancelling(false);
      setCancelOpen(false);
    }
  };

  const handleRevealNow = async () => {
    setRevealing(true);
    try {
      setData(await revealAdminEventNow(id));
      toast.show({ title: "Revealed", message: "Participants can now say whether they're coming.", variant: "success" });
    } catch (revealError) {
      toast.show({ title: "Couldn't reveal", message: describeError(revealError), variant: "error" });
    } finally {
      setRevealing(false);
      setRevealOpen(false);
    }
  };

  const detail = data;
  const event = detail?.event;

  return (
    <AdminOnly title="Coffee talk">
      <Screen
        header={
          <Header
            title={event ? formatDateTime(new Date(event.event_at)) : "Coffee talk"}
            subtitle="Coffee talk"
            onBack={goBack}
          />
        }
        footer={
          event && CANCELLABLE.has(event.status) ? (
            <View className="gap-2">
              {__DEV__ && REVEALABLE.has(event.status) && (
                <Button
                  title="Reveal now (testing)"
                  variant="secondary"
                  size="lg"
                  fullWidth
                  leftIcon="flash-outline"
                  onPress={() => setRevealOpen(true)}
                />
              )}
              <Button title="Cancel event" variant="destructive" size="lg" fullWidth onPress={() => setCancelOpen(true)} />
            </View>
          ) : undefined
        }
        contentClassName="gap-5">
        {!detail ? (
          loading ? (
            <>
              <Skeleton height={140} className="rounded-3xl" />
              <Skeleton height={220} className="rounded-3xl" />
            </>
          ) : (
            <ErrorState
              title="Couldn't load this coffee talk"
              description={error ? describeError(error) : undefined}
              onRetry={refresh}
              className="flex-1 justify-center"
            />
          )
        ) : (
          <>
            <Overview detail={detail} now={now} />

            {detail.groups.length > 0 && (
              <Section title={`Groups (${detail.groups.length})`}>
                <View className="gap-3">
                  {detail.groups.map((group) => (
                    <GroupCard key={group.id} group={group} />
                  ))}
                </View>
              </Section>
            )}

            {detail.groups.length === 0 && (
              <Section title={`Registered (${detail.participants.length})`}>
                <Card className="gap-1">
                  {detail.participants.length === 0 ? (
                    <Text tone="muted">Nobody has joined yet.</Text>
                  ) : (
                    detail.participants.map((person) => (
                      <GroupMemberRow key={person.user_id} name={person.name} emoji={person.emoji ?? undefined} status={person.status} sharedInterests={[]} />
                    ))
                  )}
                </Card>
              </Section>
            )}

            {detail.reports.length > 0 && (
              <Section title={`Reports (${detail.reports.length})`}>
                <View className="gap-3">
                  {detail.reports.map((report) => (
                    <Card key={report.id} className="gap-1">
                      <View className="flex-row items-center justify-between gap-2">
                        <Text variant="label">{reportReasonLabel(report.reason)}</Text>
                        <Badge label={report.status} />
                      </View>
                      <Text variant="caption" tone="muted">
                        {report.reported_by}
                        {report.reported_user_name ? ` about ${report.reported_user_name}` : ""}
                      </Text>
                      <Text>{report.details}</Text>
                    </Card>
                  ))}
                </View>
              </Section>
            )}
          </>
        )}

        <Modal
          visible={revealOpen}
          onClose={() => setRevealOpen(false)}
          title="Reveal this coffee talk now?"
          description="For testing: registration closes, groups and cafés are assigned, and everyone can answer right away. The event still happens at its original time."
          primaryAction={{ title: "Reveal now", loading: revealing, onPress: handleRevealNow }}
          secondaryAction={{ title: "Not yet", onPress: () => setRevealOpen(false) }}
        />

        <Modal
          visible={cancelOpen}
          onClose={() => setCancelOpen(false)}
          title="Cancel this coffee talk?"
          description="Everyone who joined will see it was cancelled. This can't be undone."
          primaryAction={{ title: "Cancel event", variant: "destructive", loading: cancelling, onPress: handleCancel }}
          secondaryAction={{ title: "Keep it", onPress: () => setCancelOpen(false) }}
        />
      </Screen>
    </AdminOnly>
  );
}

function Overview({ detail, now }: { detail: AdminEventDetail; now: number }) {
  const { event } = detail;
  const closesIn = new Date(event.registration_closes_at).getTime() - now;
  const closedFor = now - new Date(event.status_changed_at).getTime();
  const notEnoughCafes = detail.estimated_groups > detail.active_cafes;

  return (
    <Card className="gap-3">
      <View className="flex-row items-center justify-between">
        <Text variant="heading">Status</Text>
        <EventStatusBadge status={event.status} />
      </View>

      <InfoRow
        icon="people-outline"
        label={
          event.status === "open"
            ? `${event.participant_count} / ${event.capacity} joined`
            : `${event.participant_count} people`
        }
      />
      <InfoRow icon="albums-outline" label={`Groups of ${detail.group_size_min}–${detail.group_size_max} people (preset)`} />
      <InfoRow
        icon="cafe-outline"
        label={`${event.group_count || `~${detail.estimated_groups}`} group(s) · ${detail.active_cafes} active café(s)`}
      />
      <InfoRow icon="lock-open-outline" label={`Reveal ${formatDateTime(new Date(event.reveal_at))}`} />

      {event.status === "open" && (
        <InfoRow
          icon="hourglass-outline"
          label={closesIn > 0 ? `Registration closes in ${formatCountdown(closesIn)}` : "Registration is closing…"}
        />
      )}
      {event.status === "open" && event.participant_count < 3 && (
        <Text variant="caption" tone="warning">
          Fewer than 3 people so far. It will be cancelled automatically if that doesn&apos;t change.
        </Text>
      )}
      {notEnoughCafes && (
        <Text variant="caption" tone="error">
          Not enough active cafés for {detail.estimated_groups} groups. Add or reactivate cafés.
        </Text>
      )}

      {event.status === "closed" && (
        <View className="gap-1">
          <Text variant="label">Matchmaking in progress</Text>
          {closedFor > CLOSED_TOO_LONG_MS && (
            <Text variant="caption" tone="warning">
              Closed for {Math.floor(closedFor / 60000)} minutes. Matchmaking should have finished by now.
            </Text>
          )}
          {event.matching_error && (
            <Text variant="caption" tone="error">
              Last attempt: {event.matching_error}
            </Text>
          )}
        </View>
      )}
      {event.status === "cancelled" && (
        <Text variant="caption" tone="muted">
          {event.cancel_reason === "not_enough_people"
            ? "Cancelled automatically: fewer than 3 people joined."
            : "Cancelled by an admin."}
        </Text>
      )}
      {event.status === "failed" && (
        <Text variant="caption" tone="error">
          Matchmaking didn&apos;t succeed before the reveal.
          {event.matching_error ? ` Last error: ${event.matching_error}` : ""}
        </Text>
      )}
    </Card>
  );
}

function GroupCard({ group }: { group: AdminGroup }) {
  const confirmed = group.members.filter((member) => member.status === "confirmed").length;

  return (
    <Card className="gap-3">
      <View className="flex-row items-center justify-between gap-2">
        <Text variant="heading">Group {group.number}</Text>
        <Badge label={`${confirmed} / ${group.members.length} ${memberStatusLabel.confirmed.toLowerCase()}`} variant="success" />
      </View>

      <View className="gap-1">
        <InfoRow icon="cafe-outline" label={group.cafe?.name ?? "No café"} />
        {group.cafe && <InfoRow size="sm" icon="location-outline" label={group.cafe.address} />}
      </View>

      {group.shared_interests.length > 0 && (
        <View className="gap-1">
          <Text variant="caption" tone="muted">
            Shared interests
          </Text>
          <SharedInterests tags={group.shared_interests} max={6} />
        </View>
      )}

      <View>
        {group.members.map((member) => (
          <GroupMemberRow
            key={member.user_id}
            name={member.name}
            emoji={member.emoji ?? undefined}
            status={member.status}
            sharedInterests={member.shared_interests}
            interestsLabel="Shares"
          />
        ))}
      </View>

      {group.ratings.length > 0 && (
        <View className="gap-2 border-t border-border pt-3">
          <View className="flex-row items-center gap-2">
            <RatingStars value={Math.round(group.average_rating ?? 0)} size={16} />
            <Text variant="caption" tone="muted">
              {group.average_rating} from {group.ratings.length} rating(s)
            </Text>
          </View>
          {group.ratings
            .filter((rating) => rating.comment)
            .map((rating) => (
              <Text key={rating.user_id} variant="caption">
                “{rating.comment}” · {rating.name}
              </Text>
            ))}
        </View>
      )}
    </Card>
  );
}
