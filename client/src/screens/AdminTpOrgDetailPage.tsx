"use client";

import { useEffect, useState } from "react";
import { apiAssetUrl, apiFetch } from "@/lib/api";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import {
  AdminDetailTabs,
  type AdminDetailTabId,
} from "@/components/admin/admin-detail-tabs";
import { AdminTpPlatformCoursesTable } from "@/components/admin/admin-tp-platform-courses-table";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-widgets";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { tpStatusLabel, type TpOrg } from "@/lib/tp-platform";

type TpOrgDetail = TpOrg & { userEmail: string; courseCount?: number };

export default function AdminTpOrgDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const nav = useNavigate();
  const tab: AdminDetailTabId =
    searchParams.get("tab") === "courses" ? "courses" : "company";

  const [org, setOrg] = useState<TpOrgDetail | null>(null);
  const [busy, setBusy] = useState(false);
  const [rejectNote, setRejectNote] = useState("");

  function load() {
    if (!id) return;
    void apiFetch(`/api/admin/tp-orgs/${id}`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { org: TpOrgDetail } | null) => setOrg(d?.org ?? null));
  }

  useEffect(() => {
    load();
  }, [id]);

  function setTab(next: AdminDetailTabId) {
    setSearchParams(next === "courses" ? { tab: "courses" } : {}, { replace: true });
  }

  async function approve() {
    if (!id) return;
    setBusy(true);
    await apiFetch(`/api/admin/tp-orgs/${id}/approve`, { method: "PATCH", credentials: "include" });
    setBusy(false);
    load();
  }

  async function reject() {
    if (!id) return;
    setBusy(true);
    await apiFetch(`/api/admin/tp-orgs/${id}/reject`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ adminNote: rejectNote.trim() || undefined }),
    });
    setBusy(false);
    load();
  }

  if (!org) {
    return <div className="p-6 text-sm text-[color:var(--text-muted)]">Loading…</div>;
  }

  const pending = org.status === "PENDING" || org.status === "UNDER_REVIEW";

  return (
    <div className="space-y-6 p-6">
      <DashboardPageHeader
        title={org.companyName}
        description="Registered on platform"
        right={
          <Badge
            tone={org.status === "APPROVED" ? "green" : org.status === "REJECTED" ? "red" : "yellow"}
          >
            {tpStatusLabel(org.status)}
          </Badge>
        }
      />

      {pending ? (
        <section className="flex flex-wrap gap-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
          <Button type="button" disabled={busy} onClick={() => void approve()}>
            Approve
          </Button>
          <div className="flex min-w-[200px] flex-1 flex-col gap-2 sm:flex-row sm:items-center">
            <input
              className="flex-1 rounded-lg border border-[color:var(--border)] px-3 py-2 text-sm"
              placeholder="Rejection note (optional)"
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
            />
            <Button type="button" variant="outline" disabled={busy} onClick={() => void reject()}>
              Reject
            </Button>
          </div>
        </section>
      ) : null}

      {org.adminNote ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <strong>Admin note:</strong> {org.adminNote}
        </p>
      ) : null}

      <AdminDetailTabs
        active={tab}
        onChange={setTab}
        courseCount={org.courseCount}
      />

      {tab === "company" ? (
        <div className="space-y-6" role="tabpanel">
          <DetailSection title="Company">
            <DetailRow label="Company email" value={org.companyEmail} />
            <DetailRow label="Sign-in email" value={org.userEmail} />
            <DetailRow label="Phone" value={org.phone} />
            <DetailRow label="Address" value={org.address} />
            <DetailRow label="Website" value={org.website} />
            <DetailRow label="Description" value={org.description} />
            <DetailRow label="SSM registration number" value={org.ssmNumber?.trim() || "—"} />
            <DetailRow label="HRDC Training Provider ID" value={org.hrdcTpId} />
          </DetailSection>

          <DetailSection title="Contact Person">
            <DetailRow label="Name" value={org.picName} />
            {org.picPosition?.trim() ? <DetailRow label="Position" value={org.picPosition} /> : null}
            <DetailRow label="Email" value={org.picEmail} />
            <DetailRow label="Phone" value={org.picPhone} />
          </DetailSection>

          <DetailSection title="Documents">
            <DocRow label="SSM Certificate" url={org.ssmCertUrl} />
            <DocRow label="HRDC Training Provider Registration Certificate" url={org.hrdcDocUrl} />
            {org.logoUrl ? <DocRow label="Logo" url={org.logoUrl} /> : null}
          </DetailSection>
        </div>
      ) : (
        <div role="tabpanel">{id ? <AdminTpPlatformCoursesTable tpOrgId={id} /> : null}</div>
      )}

      <Button type="button" variant="outline" onClick={() => nav("/admin/training-providers")}>
        Back to Training Providers
      </Button>
    </div>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[color:var(--text-muted)]">
        {title}
      </h2>
      <dl className="space-y-2">{children}</dl>
    </section>
  );
}

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="grid gap-1 sm:grid-cols-3">
      <dt className="text-sm text-[color:var(--text-muted)]">{label}</dt>
      <dd className="text-sm text-[color:var(--text)] sm:col-span-2">{value?.trim() || "—"}</dd>
    </div>
  );
}

function DocRow({ label, url }: { label: string; url: string }) {
  return (
    <div className="grid gap-2 sm:grid-cols-3 sm:items-center">
      <div className="text-sm text-[color:var(--text-muted)]">{label}</div>
      <div className="sm:col-span-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => window.open(apiAssetUrl(url), "_blank", "noopener,noreferrer")}
        >
          View file
        </Button>
      </div>
    </div>
  );
}
