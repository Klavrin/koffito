import { useState } from "react";
import { ScrollView, View } from "react-native";

import { ReportCard, reportStatusConfig } from "@/components/admin/report-card";
import { Screen } from "@/components/layout";
import { Badge, BottomSheet, Button, Chip, EmptyState, Header, Text, useToast } from "@/components/ui";
import { reports as initialReports } from "@/data/reports";
import { formatDate } from "@/lib/date";
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
  const toast = useToast();

  const [reports, setReports] = useState(initialReports);
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const visible = reports.filter((report) => filter === "all" || report.status === filter);
  const selected = reports.find((report) => report.id === selectedId);
  const openCount = reports.filter((report) => report.status === "open").length;

  const setStatus = (report: Report, status: ReportStatus) => {
    setReports((current) => current.map((item) => (item.id === report.id ? { ...item, status } : item)));
    setSelectedId(null);
    toast.show({ title: `Report #${report.id} marked as ${reportStatusConfig[status].label.toLowerCase()}`, variant: "success" });
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

      {visible.length === 0 ? (
        <EmptyState emoji="🧹" title="Nothing to review" description="No reports here — the coffee talks are going well." className="flex-1 justify-center" />
      ) : (
        visible.map((report, index) => (
          <ReportCard key={report.id} report={report} animateIn={index} onPress={() => setSelectedId(report.id)} />
        ))
      )}

      <BottomSheet visible={!!selected} onClose={() => setSelectedId(null)} title={selected ? `Report #${selected.id}` : undefined}>
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
              <Button title="Start review" leftIcon="eye-outline" fullWidth onPress={() => setStatus(selected, "reviewing")} />
            )}
            {selected.status !== "resolved" ? (
              <Button
                title="Mark as resolved"
                variant={selected.status === "open" ? "secondary" : "primary"}
                leftIcon="checkmark-circle-outline"
                fullWidth
                onPress={() => setStatus(selected, "resolved")}
              />
            ) : (
              <Button title="Reopen" variant="outline" leftIcon="refresh" fullWidth onPress={() => setStatus(selected, "open")} />
            )}
          </View>
        )}
      </BottomSheet>
    </Screen>
  );
}
