import { useState } from "react";
import { View } from "react-native";

import { createVenue, fetchAdminVenues, setVenueActive, updateVenue } from "@/api";
import { AdminOnly } from "@/components/admin/admin-only";
import { InfoRow } from "@/components/events/info-row";
import { Screen } from "@/components/layout";
import {
  Badge,
  BottomSheet,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Header,
  Input,
  Skeleton,
  Text,
  useToast,
} from "@/components/ui";
import { useSession } from "@/context/session";
import { useResource } from "@/hooks/use-resource";
import { describeError } from "@/lib/errors";
import { GROUP_SIZE } from "@/lib/events";
import { goBack } from "@/lib/navigation";
import type { AdminVenue, AdminVenueInput } from "@/types/api";

type Form = { name: string; address: string; description: string; maps_url: string; website: string; phone: string };

const emptyForm: Form = { name: "", address: "", description: "", maps_url: "", website: "", phone: "" };

const toForm = (venue: AdminVenue): Form => ({
  name: venue.name,
  address: venue.address,
  description: venue.description ?? "",
  maps_url: venue.maps_url ?? "",
  website: venue.website ?? "",
  phone: venue.phone ?? "",
});

/** Blank optional fields are sent as null so an edit can clear them (description is never null). */
const toInput = (form: Form): AdminVenueInput => ({
  name: form.name.trim(),
  address: form.address.trim(),
  description: form.description.trim(),
  maps_url: form.maps_url.trim() || null,
  website: form.website.trim() || null,
  phone: form.phone.trim() || null,
});

export default function AdminCafesPage() {
  const { profile } = useSession();
  const toast = useToast();
  const isAdmin = !!profile.isAdmin;
  const { data, loading, error, refresh } = useResource(fetchAdminVenues, isAdmin);

  // `null` = closed, `"new"` = adding, otherwise the café being edited.
  const [editing, setEditing] = useState<AdminVenue | "new" | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const venues = data ?? [];
  const active = venues.filter((venue) => venue.is_active).length;

  const open = (target: AdminVenue | "new") => {
    setEditing(target);
    setForm(target === "new" ? emptyForm : toForm(target));
    setSubmitted(false);
  };

  const errors = {
    name: form.name.trim() ? undefined : "Give the café a name",
    address: form.address.trim() ? undefined : "Where is it?",
  };

  const save = async (action: () => Promise<unknown>, title: string) => {
    setSaving(true);
    try {
      await action();
      toast.show({ title, variant: "success" });
      setEditing(null);
      await refresh();
    } catch (saveError) {
      toast.show({ title: "Couldn't save the café", message: describeError(saveError), variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => {
    setSubmitted(true);
    if (errors.name || errors.address || !editing) return;
    const input = toInput(form);
    return editing === "new"
      ? save(() => createVenue(input), "Café added")
      : save(() => updateVenue(editing.id, input), "Café updated");
  };

  const field = (key: keyof Form) => ({
    value: form[key],
    onChangeText: (value: string) => setForm((current) => ({ ...current, [key]: value })),
  });

  return (
    <AdminOnly title="Cafés">
      <Screen
        header={
          <Header
            title="Cafés"
            subtitle={`${active} active · room for ${active * GROUP_SIZE.max} people per coffee talk`}
            onBack={goBack}
          />
        }
        footer={<Button title="Add café" size="lg" fullWidth leftIcon="add-circle" onPress={() => open("new")} />}
        contentClassName="gap-3">
        {loading && venues.length === 0 ? (
          <>
            <Skeleton height={96} className="rounded-3xl" />
            <Skeleton height={96} className="rounded-3xl" />
          </>
        ) : error && venues.length === 0 ? (
          <ErrorState title="Couldn't load cafés" onRetry={refresh} className="flex-1 justify-center" />
        ) : venues.length === 0 ? (
          <EmptyState
            emoji="☕"
            title="No cafés yet"
            description="Each group gets its own café, so add a few."
            className="flex-1 justify-center"
          />
        ) : (
          venues.map((venue, index) => (
            <Card key={venue.id} animateIn={index} onPress={() => open(venue)} className="gap-2">
              <View className="flex-row items-center justify-between gap-3">
                <Text variant="heading" className="flex-1" numberOfLines={1}>
                  {venue.name}
                </Text>
                <Badge
                  label={venue.is_active ? "Active" : "Inactive"}
                  variant={venue.is_active ? "success" : "neutral"}
                  dot
                />
              </View>
              <InfoRow size="sm" icon="location-outline" label={venue.address} />
            </Card>
          ))
        )}

        <BottomSheet
          visible={!!editing}
          onClose={() => setEditing(null)}
          title={editing === "new" ? "Add café" : "Edit café"}
          description="Only active cafés get groups and count towards capacity.">
          <View className="gap-4 pb-4">
            <Input label="Name" placeholder="Tucano Coffee" error={submitted ? errors.name : undefined} {...field("name")} />
            <Input label="Address" placeholder="Str. Ismail 33" error={submitted ? errors.address : undefined} {...field("address")} />
            <Input label="Description" placeholder="Cozy corner with good light" multiline {...field("description")} />
            <Input label="Map link" placeholder="https://maps.google.com/…" autoCapitalize="none" keyboardType="url" {...field("maps_url")} />
            <Input label="Website" placeholder="https://…" autoCapitalize="none" keyboardType="url" {...field("website")} />
            <Input label="Phone" placeholder="+373 …" keyboardType="phone-pad" {...field("phone")} />

            <Button title="Save" size="lg" fullWidth loading={saving} onPress={handleSave} />
            {editing && editing !== "new" && (
              <Button
                title={editing.is_active ? "Deactivate" : "Reactivate"}
                variant={editing.is_active ? "destructive" : "secondary"}
                size="lg"
                fullWidth
                disabled={saving}
                onPress={() =>
                  save(
                    () => setVenueActive(editing.id, !editing.is_active),
                    editing.is_active ? "Café deactivated" : "Café reactivated",
                  )
                }
              />
            )}
          </View>
        </BottomSheet>
      </Screen>
    </AdminOnly>
  );
}
