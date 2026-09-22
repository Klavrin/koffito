import { supabase } from "@/lib/supabase";
import type { Report, ReportReason, ReportStatus } from "@/types/koffito";

import { toReport } from "./mappers";

export type NewReport = {
  reporterId: string;
  reason: ReportReason;
  details: string;
  eventId?: string;
};

export async function sendReport(report: NewReport) {
  const { error } = await supabase.from("reports").insert({
    reporter_id: report.reporterId,
    reason: report.reason,
    details: report.details.trim(),
    event_id: report.eventId ?? null,
  });
  if (error) throw error;
}

/** Admins only: every report with the reporter's name, newest first. */
export async function fetchReports(): Promise<Report[]> {
  const { data, error } = await supabase.from("admin_reports").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data.map(toReport).filter((report): report is Report => !!report);
}

export async function updateReportStatus(reportId: string, status: ReportStatus, adminId: string) {
  const { error } = await supabase.from("reports").update({ status, handled_by: adminId }).eq("id", reportId);
  if (error) throw error;
}
