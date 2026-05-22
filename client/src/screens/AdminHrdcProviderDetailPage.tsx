"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";

import {
  AdminDetailTabs,
  type AdminDetailTabId,
} from "@/components/admin/admin-detail-tabs";
import {
  AdminHrdcProviderCompanyTab,
  AdminHrdcProviderCoursesTab,
} from "@/components/admin/admin-hrdc-provider-detail";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-widgets";
import { PageHeaderIconList } from "@/components/dashboard/page-header-icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { TrainingProvider } from "@/lib/training-providers";

export default function AdminHrdcProviderDetailPage() {
  const { lookupKey } = useParams<{ lookupKey: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const tab: AdminDetailTabId =
    searchParams.get("tab") === "courses" ? "courses" : "company";

  const [provider, setProvider] = useState<TrainingProvider | null>(null);
  const [missing, setMissing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!lookupKey) return;
    setLoading(true);
    setMissing(false);
    void apiFetch(`/api/admin/training-providers/hrdc/${encodeURIComponent(lookupKey)}`, {
      credentials: "include",
    })
      .then(async (r) => {
        if (r.status === 404) {
          setMissing(true);
          setProvider(null);
          return;
        }
        if (!r.ok) throw new Error(`Request failed (${r.status})`);
        const d = (await r.json()) as { provider: TrainingProvider };
        setProvider(d.provider);
      })
      .catch(() => {
        setMissing(true);
        setProvider(null);
      })
      .finally(() => setLoading(false));
  }, [lookupKey]);

  function setTab(next: AdminDetailTabId) {
    const params = new URLSearchParams(searchParams);
    if (next === "courses") {
      params.set("tab", "courses");
    } else {
      params.delete("tab");
    }
    setSearchParams(params, { replace: true });
  }

  if (!lookupKey) return null;
  if (loading) {
    return <div className="p-6 text-sm text-[color:var(--text-muted)]">Loading provider…</div>;
  }
  if (missing || !provider) {
    return <Navigate to="/admin/training-providers" replace />;
  }

  return (
    <div className="space-y-6 p-6">
      <DashboardPageHeader
        title={provider.name}
        description="HRDC eTRiS directory"
        icon={<PageHeaderIconList />}
        right={provider.status ? <Badge tone="gray">{provider.status}</Badge> : undefined}
      />

      <AdminDetailTabs
        active={tab}
        onChange={setTab}
        courseCount={provider.courses.length}
      />

      <div role="tabpanel">
        {tab === "company" ? (
          <AdminHrdcProviderCompanyTab provider={provider} />
        ) : (
          <AdminHrdcProviderCoursesTab provider={provider} />
        )}
      </div>

      <Button type="button" variant="outline" onClick={() => navigate("/admin/training-providers")}>
        Back to Training Providers
      </Button>
    </div>
  );
}
