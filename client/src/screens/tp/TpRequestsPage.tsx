"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-widgets";
import { Badge } from "@/components/ui/badge";
import { useTpOutlet } from "@/hooks/use-tp-outlet";

type EmployerRequest = {
  id: string;
  companyName: string;
  contactName: string;
  contactEmail: string | null;
  contactPhone: string | null;
  courseTitle: string;
  message: string | null;
  preferredDates: string | null;
  status: string;
  createdAt: string;
};

export default function TpRequestsPage() {
  const { approved } = useTpOutlet();
  const [requests, setRequests] = useState<EmployerRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void apiFetch("/api/tp/requests", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { requests: [] }))
      .then((d: { requests: EmployerRequest[] }) => setRequests(d.requests ?? []))
      .finally(() => setLoading(false));
  }, []);

  if (!approved) {
    return <div className="p-6 text-sm text-[color:var(--text-muted)]">Employer requests unlock after approval.</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <DashboardPageHeader title="Employer requests" description="Training inquiries from employers" />
      {loading ? (
        <p className="text-sm text-[color:var(--text-muted)]">Loading…</p>
      ) : requests.length === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-[color:var(--text-muted)]">
          No employer requests yet. When employers request training, they will appear here for you to propose schedules.
        </p>
      ) : (
        <ul className="space-y-4">
          {requests.map((r) => (
            <li key={r.id} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-[color:var(--text)]">{r.companyName}</h3>
                  <p className="text-sm text-[color:var(--text-muted)]">{r.courseTitle}</p>
                </div>
                <Badge tone={r.status === "REQUESTED" ? "yellow" : "blue"}>{r.status}</Badge>
              </div>
              <dl className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
                <div><span className="text-[color:var(--text-muted)]">Contact: </span>{r.contactName}</div>
                <div><span className="text-[color:var(--text-muted)]">Email: </span>{r.contactEmail ?? "—"}</div>
                <div><span className="text-[color:var(--text-muted)]">Phone: </span>{r.contactPhone ?? "—"}</div>
                <div><span className="text-[color:var(--text-muted)]">Preferred: </span>{r.preferredDates ?? "—"}</div>
              </dl>
              {r.message ? <p className="mt-3 text-sm text-[color:var(--text)]">{r.message}</p> : null}
              <p className="mt-2 text-xs text-[color:var(--text-muted)]">
                Propose a schedule from the Schedule page and link this request.
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
