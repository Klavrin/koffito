import { useState } from "react";
import { View } from "react-native";

import { combineDateTime, DayPicker, halfHourSlots, TimePicker } from "@/components/events/date-time-picker";
import { FormField } from "@/components/events/form-field";
import { InfoRow } from "@/components/events/info-row";
import { BottomSheet, Button, Card, Text } from "@/components/ui";
import { useInterval } from "@/hooks/use-interval";
import { formatDateTime } from "@/lib/date";
import { eventTimes, GROUP_SIZE } from "@/lib/events";

const slots = halfHourSlots(8, 21);

export type CreateEventSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Resolves once the event is saved; the sheet closes itself afterwards. */
  onCreate: (date: Date) => Promise<boolean>;
};

/** "Create event": the admin only picks a date and a time; everything else is shown read-only. */
export function CreateEventSheet({ visible, onClose, onCreate }: CreateEventSheetProps) {
  const [day, setDay] = useState<Date>();
  const [time, setTime] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  useInterval(() => setNow(Date.now()), 30_000, visible);

  const date = day && time ? combineDateTime(day, time) : undefined;
  const times = date ? eventTimes(date) : undefined;
  // The server refuses a coffee talk nobody could join anymore.
  const tooSoon = !!times && times.registrationClosesAt.getTime() <= now;

  const reset = () => {
    setDay(undefined);
    setTime(undefined);
  };

  const handleCreate = async () => {
    if (!date || tooSoon) return;
    setSaving(true);
    const ok = await onCreate(date);
    setSaving(false);
    if (ok) {
      reset();
      onClose();
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Create event" description="Pick when people meet.">
      <View className="gap-5 pb-4">
        <FormField label="Date">
          <DayPicker value={day} onChange={setDay} days={30} />
        </FormField>
        <FormField label="Time" error={tooSoon ? "Pick a time more than a day away, so people can still join." : undefined}>
          <TimePicker value={time} onChange={setTime} slots={slots} />
        </FormField>

        <Card variant="filled" className="gap-2">
          <InfoRow icon="people-outline" label={`Group size: ${GROUP_SIZE.min}–${GROUP_SIZE.max} people (preset)`} />
          <InfoRow
            icon="lock-closed-outline"
            label={`Registration closes: ${times ? formatDateTime(times.registrationClosesAt) : "—"}`}
          />
          <InfoRow icon="lock-open-outline" label={`Reveal: ${times ? formatDateTime(times.revealAt) : "—"}`} />
          <Text variant="caption" tone="muted">
            Groups, cafés and every status change happen automatically.
          </Text>
        </Card>

        <Button title="Create" size="lg" fullWidth loading={saving} disabled={!date || tooSoon} onPress={handleCreate} />
      </View>
    </BottomSheet>
  );
}
