import { useLocalSearchParams } from "expo-router";
import { useState } from "react";

import { sendReport } from "@/api";
import { Screen, Section } from "@/components/layout";
import { OptionList } from "@/components/survey/option-list";
import { Button, Card, Header, Input, Text, useToast } from "@/components/ui";
import { useEvents } from "@/context/events";
import { reportReasons } from "@/data/reports";
import { describeError } from "@/lib/errors";
import { goBack } from "@/lib/navigation";
import type { ReportReason } from "@/types/koffito";

const MIN_DETAILS = 10;

export default function ReportPage() {
  // `userId` + `name` report a groupmate after a completed coffee talk; without them it's
  // a report about the coffee talk itself.
  const { eventId, userId, name } = useLocalSearchParams<{ eventId?: string; userId?: string; name?: string }>();
  const { getEvent } = useEvents();
  const toast = useToast();

  const [reason, setReason] = useState<string[]>([]);
  const [details, setDetails] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const event = getEvent(eventId);
  const detailsError =
    details.trim().length >= MIN_DETAILS
      ? undefined
      : "A sentence or two helps us understand what happened";

  const handleSubmit = async () => {
    setSubmitted(true);
    if (reason.length === 0 || detailsError) return;

    setSending(true);
    try {
      await sendReport({
        reason: reason[0] as ReportReason,
        details,
        eventId: event?.id ?? eventId,
        reportedUserId: userId,
      });
      toast.show({
        title: "Report sent",
        message: "Thank you - our team will take a look.",
        variant: "success",
      });
      goBack();
    } catch (error) {
      toast.show({ title: "Couldn't send the report", message: describeError(error), variant: "error" });
      setSending(false);
    }
  };

  return (
    <Screen
      header={
        <Header
          title={name ? `Report ${name}` : "Report"}
          subtitle={event ? `Coffee talk at ${event.cafe?.name ?? "a mystery café"}` : undefined}
          onBack={goBack}
        />
      }
      footer={
        <Button
          title="Send report"
          size="lg"
          fullWidth
          loading={sending}
          disabled={reason.length === 0}
          onPress={handleSubmit}
        />
      }
    >
      <Card variant="filled" className="gap-1">
        <Text variant="label">We&apos;re sorry something went wrong</Text>
        <Text variant="caption" tone="muted">
          Reports are private. The people involved won&apos;t know who sent it.
        </Text>
      </Card>

      <Section title="Report reason">
        <OptionList
          options={reportReasons}
          max={1}
          selected={reason}
          onChange={setReason}
        />
      </Section>

      <Input
        label="Tell us more about the situation"
        placeholder="What happened?"
        multiline
        numberOfLines={5}
        textAlignVertical="top"
        fieldClassName="min-h-32 items-start py-3"
        value={details}
        onChangeText={setDetails}
        error={submitted ? detailsError : undefined}
      />
    </Screen>
  );
}
