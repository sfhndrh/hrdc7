"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-widgets";
import { PageHeaderIconCalendar } from "@/components/dashboard/page-header-icons";
import { ButtonLink } from "@/components/ui/button";
import { useTpOutlet } from "@/hooks/use-tp-outlet";

type ScheduleRow = {
  id: string;
  courseTitle: string | null;
  trainerName: string | null;
  clientCompany: string | null;
  scheduledDate: string;
  scheduledTime: string;
  status: string;
};

export default function TpSchedulesPage() {
  const { approved } = useTpOutlet();
  const [schedules, setSchedules] = useState<ScheduleRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    void apiFetch("/api/tp/schedules", { credentials: "include" })
      .then((r) => r.json())
      .then((d: { schedules: ScheduleRow[] }) => setSchedules(d.schedules ?? []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!approved) {
    return (
      <div className="p-6 text-sm text-[color:var(--text-muted)]">
        Schedule unlocks after approval.
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <DashboardPageHeader
        title="Schedule"
        description="Create and manage training schedules"
        icon={<PageHeaderIconCalendar />}
        right={
          <ButtonLink href="/tp/schedules/new" size="sm">
            New schedule
          </ButtonLink>
        }
      />

      {loading ? (
        <p className="text-sm text-[color:var(--text-muted)]">Loading…</p>
      ) : schedules.length === 0 ? (
        <p className="text-sm text-[color:var(--text-muted)]">No schedules yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] shadow-sm">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-b bg-[color:var(--surface-muted)] text-xs uppercase text-[color:var(--text-muted)]">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Trainer</th>
                <th className="px-4 py-3">Employer</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((s) => (
                <tr key={s.id} className="border-b last:border-0">
                  <td className="px-4 py-3">{s.scheduledDate}</td>
                  <td className="px-4 py-3">{s.scheduledTime}</td>
                  <td className="px-4 py-3">{s.courseTitle ?? "—"}</td>
                  <td className="px-4 py-3">{s.trainerName ?? "—"}</td>
                  <td className="px-4 py-3">{s.clientCompany ?? "—"}</td>
                  <td className="px-4 py-3">{s.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
