import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";

import { CafePicker } from "@/components/events/cafe-picker";
import { combineDateTime, DayPicker, TimePicker } from "@/components/events/date-time-picker";
import { FormField } from "@/components/events/form-field";
import { Stepper } from "@/components/events/stepper";
import { Screen } from "@/components/layout";
import { Button, Card, Header, Text, Toggle, useToast } from "@/components/ui";
import { useEvents } from "@/context/events";
import { useSession } from "@/context/session";
import { errorMessage } from "@/lib/api-client";
import { koffitoApi } from "@/lib/koffito-api";
import { toCafe } from "@/lib/mappers";
import { goBack } from "@/lib/navigation";
import type { Cafe } from "@/types/koffito";

export default function CreateEventPage() {
  const { profile } = useSession();
  const { createEvent } = useEvents();
  const toast = useToast();

  const [venues, setVenues] = useState<Cafe[]>([]);
  const [cafe, setCafe] = useState<Cafe>();
  const [day, setDay] = useState<Date>();
  const [time, setTime] = useState<string>();
  const [participants, setParticipants] = useState(4);
  const [locationHidden, setLocationHidden] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile.isAdmin) return;
    koffitoApi.admin
      .venues()
      .then((rows) => setVenues(rows.map(toCafe)))
      .catch((caught: unknown) =>
        toast.show({ title: "Couldn't load the cafés", message: errorMessage(caught), variant: "error" }),
      );
  }, [profile.isAdmin, toast]);

  if (!profile.isAdmin) {
    return <Redirect href="/" />;
  }

  const errors = {
    cafe: cafe ? undefined : "Pick a coffee place first",
    day: day ? undefined : "Pick a day",
    time: time ? undefined : "Pick a time",
  };
  const showError = (field: keyof typeof errors) => (submitted ? errors[field] : undefined);

  const handleSave = async () => {
    setSubmitted(true);
    if (!cafe || !day || !time) return;

    setSaving(true);
    try {
      await createEvent({
        eventAt: combineDateTime(day, time).toISOString(),
        targetGroupSize: participants,
        defaultVenueId: cafe.id,
        locationHidden,
      });
      toast.show({ title: "Coffee talk created!", message: `See you at ${cafe.name} ☕`, variant: "success" });
      goBack();
    } catch (caught) {
      toast.show({ title: "Couldn't create the coffee talk", message: errorMessage(caught), variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen
      header={<Header title="New event" subtitle="Set up a coffee talk" onBack={goBack} />}
      footer={<Button title="Save" size="lg" fullWidth leftIcon="checkmark" loading={saving} onPress={handleSave} />}>
      <CafePicker cafes={venues} value={cafe} onChange={setCafe} error={showError("cafe")} />

      <FormField label="Date" error={showError("day")}>
        <DayPicker value={day} onChange={setDay} />
      </FormField>

      <FormField label="Time" error={showError("time")}>
        <TimePicker value={time} onChange={setTime} />
      </FormField>

      <FormField label="Group size">
        <Stepper value={participants} onChange={setParticipants} min={2} max={8} unit="people per table" />
      </FormField>

      <Card variant="filled" className="flex-row items-center gap-3">
        <View className="flex-1 gap-0.5">
          <Text variant="label">Keep the café a surprise 🤫</Text>
          <Text variant="caption" tone="muted">
            Guests only see the location a day before the meetup.
          </Text>
        </View>
        <Toggle accessibilityLabel="Keep the café a surprise" value={locationHidden} onValueChange={setLocationHidden} />
      </Card>
    </Screen>
  );
}
