import { api } from "@/lib/api";
import type { AdminReport, Paginated, ReportBody, ReportResponse, ReportStatusPatch, ReportStatusResponse } from "@/types/api";
import type { Report, ReportReason, ReportStatus } from "@/types/koffito";

import { toReport } from "./mappers";

export type NewReport = {
  reason: ReportReason;
  details: string;
  eventId?: string;
  reportedUserId?: string;
};

/** Files a report; the reporter is always the signed-in user. Limited to 5 per hour. */
export function sendReport(report: NewReport) {
  const body: ReportBody = { reason: report.reason, details: report.details.trim() };
  if (report.eventId) body.event_id = report.eventId;
  if (report.reportedUserId) body.reported_user_id = report.reportedUserId;
  return api.post<ReportResponse>("/reports", body);
}

const PAGE = 100;
const MAX_PAGES = 10;

/** Admins only: every report with the reporter's name, newest first. */
export async function fetchReports(): Promise<Report[]> {
  const reports: Report[] = [];

  for (let page = 0; page < MAX_PAGES; page++) {
    const { items, total } = await api.get<Paginated<AdminReport>>(
      `/admin/reports?limit=${PAGE}&offset=${page * PAGE}`,
    );
    reports.push(...items.map(toReport));
    if (items.length === 0 || reports.length >= total) break;
  }

  return reports.sort((a, b) => b.date.getTime() - a.date.getTime());
}

/** Admins only. The API records who handled the report from the token. */
export function updateReportStatus(reportId: string, status: ReportStatus) {
  const body: ReportStatusPatch = { status };
  return api.patch<ReportStatusResponse>(`/admin/reports/${reportId}`, body);
}
