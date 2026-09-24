import { Redirect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, View } from "react-native";

import { ReportCard, reportStatusConfig } from "@/components/admin/report-card";
import { Screen } from "@/components/layout";
import { Badge, BottomSheet, Button, Chip, EmptyState, ErrorState, Header, Skeleton, Text, useToast } from "@/components/ui";
import { useSession } from "@/context/session";
import { errorMessage } from "@/lib/api-client";
import { formatDate } from "@/lib/date";
import { koffitoApi } from "@/lib/koffito-api";
import { shortId, toReport } from "@/lib/mappers";
import { goBack } from "@/lib/navigation";
import type { Report, ReportStatus } from "@/types/koffito";

type Filter = "all" | ReportStatus;

const filters: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "reviewing", label: "In review" },
  { key: "resolved", label: "Resolved" },
];

export default function AdminPage() {
  const { profile } = useSession();
  const toast = useToast();

  const [reports, setReports] = useState<Report[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string>();
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(
    () =>
      koffitoApi.admin
        .reports()
        .then((rows) => {
          setReports(rows.map(toReport));
          setError(undefined);
          setStatus("ready");
        })
        .catch((caught: unknown) => {
          setError(errorMessage(caught));
          setStatus("error");
        }),
    [],
  );

  const retry = () => {
    setStatus("loading");
    void load();
  };

  useEffect(() => {
    if (profile.isAdmin) void load();
  }, [load, profile.isAdmin]);

  if (!profile.isAdmin) {
    return <Redirect href="/" />;
  }

  const visible = reports.filter((report) => filter === "all" || report.status === filter);
  const selected = reports.find((report) => report.id === selectedId);
  const openCount = reports.filter((report) => report.status === "open").length;

  const setReportStatus = async (report: Report, nextStatus: ReportStatus) => {
    setSaving(true);
    try {
      const updated = toReport(await koffitoApi.admin.updateReport(report.id, nextStatus));
      setReports((current) => current.map((item) => (item.id === report.id ? updated : item)));
      setSelectedId(null);
      toast.show({ title: `Report #${shortId(report.id)} marked as ${reportStatusConfig[nextStatus].label.toLowerCase()}`, variant: "success" });
    } catch (caught) {
      toast.show({ title: "Couldn't update the report", message: errorMessage(caught), variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen
      header={<Header title="Reports" subtitle={openCount ? `${openCount} waiting for review` : "All caught up"} onBack={goBack} />}
      contentClassName="gap-4">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5 flex-grow-0" contentContainerClassName="gap-2 px-5">
        {filters.map((item) => (
          <Chip key={item.key} label={item.label} size="sm" selected={filter === item.key} onPress={() => setFilter(item.key)} />
        ))}
      </ScrollView>

      {status === "loading" ? (
        <View className="gap-4">
          <Skeleton height={120} className="rounded-3xl" />
          <Skeleton height={120} className="rounded-3xl" />
        </View>
      ) : status === "error" ? (
        <ErrorState description={error} onRetry={retry} className="flex-1 justify-center" />
      ) : visible.length === 0 ? (
        <EmptyState emoji="🧹" title="Nothing to review" description="No reports here — the coffee talks are going well." className="flex-1 justify-center" />
      ) : (
        visible.map((report, index) => (
          <ReportCard key={report.id} report={report} animateIn={index} onPress={() => setSelectedId(report.id)} />
        ))
      )}

      <BottomSheet visible={!!selected} onClose={() => setSelectedId(null)} title={selected ? `Report #${shortId(selected.id)}` : undefined}>
        {selected && (
          <View className="gap-4 pb-6">
            <Badge
              label={reportStatusConfig[selected.status].label}
              variant={reportStatusConfig[selected.status].variant}
              icon={reportStatusConfig[selected.status].icon}
              className="self-start"
            />
            <View className="gap-1">
              <Text variant="label">{selected.reason}</Text>
              <Text tone="muted">{selected.details}</Text>
            </View>
            <Text variant="caption" tone="muted">
              Sent {formatDate(selected.date)} by {selected.reportedBy}
            </Text>

            {selected.status === "open" && (
              <Button title="Start review" leftIcon="eye-outline" fullWidth loading={saving} onPress={() => setReportStatus(selected, "reviewing")} />
            )}
            {selected.status !== "resolved" ? (
              <Button
                title="Mark as resolved"
                variant={selected.status === "open" ? "secondary" : "primary"}
                leftIcon="checkmark-circle-outline"
                fullWidth
                loading={saving}
                onPress={() => setReportStatus(selected, "resolved")}
              />
            ) : (
              <Button title="Reopen" variant="outline" leftIcon="refresh" fullWidth loading={saving} onPress={() => setReportStatus(selected, "open")} />
            )}
          </View>
        )}
      </BottomSheet>
    </Screen>
  );
}
