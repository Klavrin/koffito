import { useState } from "react";
import { ScrollView, View } from "react-native";

import { fetchReports, updateReportStatus } from "@/api";
import { ReportCard, reportStatusConfig, shortReportId } from "@/components/admin/report-card";
import { Screen } from "@/components/layout";
import { Badge, BottomSheet, Button, Chip, EmptyState, ErrorState, Header, Skeleton, Text, useToast } from "@/components/ui";
import { useProfile } from "@/context/session";
import { reportReasonLabel } from "@/data/reports";
import { useResource } from "@/hooks/use-resource";
import { formatDate } from "@/lib/date";
import { describeError } from "@/lib/errors";
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
  const profile = useProfile();
  const toast = useToast();

  const { data, loading, error, refresh, setData } = useResource(fetchReports, profile.isAdmin);
  const reports = data ?? [];

  const [filter, setFilter] = useState<Filter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  if (!profile.isAdmin) {
    return (
      <Screen header={<Header title="Reports" onBack={goBack} />} contentClassName="flex-1 justify-center">
        <ErrorState emoji="🔒" title="Admins only" description="This area is reserved for the Koffito team." retryLabel="Go back" onRetry={goBack} />
      </Screen>
    );
  }

  const visible = reports.filter((report) => filter === "all" || report.status === filter);
  const selected = reports.find((report) => report.id === selectedId);
  const openCount = reports.filter((report) => report.status === "open").length;

  const setStatus = async (report: Report, status: ReportStatus) => {
    setUpdating(true);
    try {
      await updateReportStatus(report.id, status, profile.id);
      setData((current) => (current ?? []).map((item) => (item.id === report.id ? { ...item, status } : item)));
      setSelectedId(null);
      toast.show({ title: `Report #${shortReportId(report.id)} marked as ${reportStatusConfig[status].label.toLowerCase()}`, variant: "success" });
    } catch (updateError) {
      toast.show({ title: "Couldn't update the report", message: describeError(updateError), variant: "error" });
    } finally {
      setUpdating(false);
    }
  };

  const showSkeleton = loading && reports.length === 0;
  const showError = !!error && reports.length === 0;

  return (
    <Screen
      header={
        <Header
          title="Reports"
          subtitle={showSkeleton ? "Loading…" : openCount ? `${openCount} waiting for review` : "All caught up"}
          onBack={goBack}
        />
      }
      contentClassName="gap-4">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5 flex-grow-0" contentContainerClassName="gap-2 px-5">
        {filters.map((item) => (
          <Chip key={item.key} label={item.label} size="sm" selected={filter === item.key} onPress={() => setFilter(item.key)} />
        ))}
      </ScrollView>

      {showSkeleton ? (
        <>
          <Skeleton height={150} className="rounded-3xl" />
          <Skeleton height={150} className="rounded-3xl" />
        </>
      ) : showError ? (
        <ErrorState title="Couldn't load the reports" onRetry={refresh} className="flex-1 justify-center" />
      ) : visible.length === 0 ? (
        <EmptyState emoji="🧹" title="Nothing to review" description="No reports here — the coffee talks are going well." className="flex-1 justify-center" />
      ) : (
        visible.map((report, index) => (
          <ReportCard key={report.id} report={report} animateIn={index} onPress={() => setSelectedId(report.id)} />
        ))
      )}

      <BottomSheet visible={!!selected} onClose={() => setSelectedId(null)} title={selected ? `Report #${shortReportId(selected.id)}` : undefined}>
        {selected && (
          <View className="gap-4 pb-6">
            <Badge
              label={reportStatusConfig[selected.status].label}
              variant={reportStatusConfig[selected.status].variant}
              icon={reportStatusConfig[selected.status].icon}
              className="self-start"
            />
            <View className="gap-1">
              <Text variant="label">{reportReasonLabel(selected.reason)}</Text>
              <Text tone="muted">{selected.details}</Text>
            </View>
            <Text variant="caption" tone="muted">
              Sent {formatDate(selected.date)} by {selected.reportedBy}
            </Text>

            {selected.status === "open" && (
              <Button title="Start review" leftIcon="eye-outline" fullWidth loading={updating} onPress={() => setStatus(selected, "reviewing")} />
            )}
            {selected.status !== "resolved" ? (
              <Button
                title="Mark as resolved"
                variant={selected.status === "open" ? "secondary" : "primary"}
                leftIcon="checkmark-circle-outline"
                fullWidth
                loading={updating}
                onPress={() => setStatus(selected, "resolved")}
              />
            ) : (
              <Button title="Reopen" variant="outline" leftIcon="refresh" fullWidth loading={updating} onPress={() => setStatus(selected, "open")} />
            )}
          </View>
        )}
      </BottomSheet>
    </Screen>
  );
}
