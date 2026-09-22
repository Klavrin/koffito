import { useState } from "react";
import { View } from "react-native";

import { fetchVenues } from "@/api";
import { CafePicker } from "@/components/events/cafe-picker";
import { combineDateTime, DayPicker, TimePicker } from "@/components/events/date-time-picker";
import { FormField } from "@/components/events/form-field";
import { Stepper } from "@/components/events/stepper";
import { Screen } from "@/components/layout";
import { Button, Card, ErrorState, Header, Text, Toggle, useToast } from "@/components/ui";
import { useEvents } from "@/context/events";
import { useProfile } from "@/context/session";
import { useResource } from "@/hooks/use-resource";
import { describeError } from "@/lib/errors";
import { goBack } from "@/lib/navigation";
import type { Cafe } from "@/types/koffito";

export default function CreateEventPage() {
  const profile = useProfile();
  const { createEvent } = useEvents();
  const venues = useResource(fetchVenues, profile.isAdmin);
  const toast = useToast();

  const [cafe, setCafe] = useState<Cafe>();
  const [day, setDay] = useState<Date>();
  const [time, setTime] = useState<string>();
  const [participants, setParticipants] = useState(4);
  const [locationHidden, setLocationHidden] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const errors = {
    cafe: cafe ? undefined : "Pick a coffee place first",
    day: day ? undefined : "Pick a day",
    time: time ? undefined : "Pick a time",
  };
  const showError = (field: keyof typeof errors) => (submitted ? errors[field] : undefined);

  if (!profile.isAdmin) {
    return (
      <Screen header={<Header title="New event" onBack={goBack} />} contentClassName="flex-1 justify-center">
        <ErrorState emoji="🔒" title="Admins only" description="Coffee talks are set up by the Koffito team." retryLabel="Go back" onRetry={goBack} />
      </Screen>
    );
  }

  const handleSave = async () => {
    setSubmitted(true);
    if (!cafe || !day || !time) return;

    setSaving(true);
    try {
      await createEvent({ venueId: cafe.id, date: combineDateTime(day, time), groupSize: participants, locationHidden });
      toast.show({ title: "Coffee talk created!", message: `See you at ${cafe.name} ☕`, variant: "success" });
      goBack();
    } catch (error) {
      toast.show({ title: "Couldn't create the coffee talk", message: describeError(error), variant: "error" });
      setSaving(false);
    }
  };

  return (
    <Screen
      header={<Header title="New event" subtitle="Set up a coffee talk" onBack={goBack} />}
      footer={<Button title="Save" size="lg" fullWidth leftIcon="checkmark" loading={saving} onPress={handleSave} />}>
      <CafePicker cafes={venues.data ?? []} loading={venues.loading} value={cafe} onChange={setCafe} error={showError("cafe")} />

      <FormField label="Date" error={showError("day")}>
        <DayPicker value={day} onChange={setDay} />
      </FormField>

      <FormField label="Time" error={showError("time")}>
        <TimePicker value={time} onChange={setTime} />
      </FormField>

      <FormField label="Group size">
        <Stepper value={participants} onChange={setParticipants} min={2} max={8} unit="participants" />
      </FormField>

      <Card variant="filled" className="flex-row items-center gap-3">
        <View className="flex-1 gap-0.5">
          <Text variant="label">Keep the café a surprise 🤫</Text>
          <Text variant="caption" tone="muted">
            Guests only see the location shortly before the meetup.
          </Text>
        </View>
        <Toggle accessibilityLabel="Keep the café a surprise" value={locationHidden} onValueChange={setLocationHidden} />
      </Card>
    </Screen>
  );
}
