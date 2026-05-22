"use client";

import { useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { apiFetch } from "@/lib/api";

import {
  AdminTrainingProvidersUnifiedView,
} from "@/components/admin/admin-training-providers-view";
import type { PlatformTpRow } from "@/components/admin/admin-platform-tp-active-view";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-widgets";
import { PageHeaderIconList } from "@/components/dashboard/page-header-icons";
import type { ProvidersData } from "@/lib/training-providers";

export default function AdminTrainingProvidersPage() {
  const [hrdcData, setHrdcData] = useState<ProvidersData | null>(null);
  const [platformOrgs, setPlatformOrgs] = useState<PlatformTpRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setError(null);
    const [hrdcRes, tpRes] = await Promise.all([
      apiFetch("/api/admin/training-providers", { credentials: "include" }),
      apiFetch("/api/admin/tp-orgs", { credentials: "include" }),
    ]);

    if (hrdcRes.status === 404) {
      setHrdcData(null);
    } else if (!hrdcRes.ok) {
      const body = (await hrdcRes.json().catch(() => ({}))) as { error?: string };
      throw new Error(body.error ?? `Failed to load HRDC directory (${hrdcRes.status})`);
    } else {
      setHrdcData((await hrdcRes.json()) as ProvidersData);
    }

    if (tpRes.ok) {
      const tpBody = (await tpRes.json()) as { orgs: PlatformTpRow[] };
      setPlatformOrgs(tpBody.orgs ?? []);
    } else {
      setPlatformOrgs([]);
    }
  }, []);

  useEffect(() => {
    void loadData()
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => setLoading(false));
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center p-6 text-sm text-[color:var(--text-muted)]">
        Loading training providers…
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {error}
        </div>
      ) : null}

      <DashboardPageHeader
        title="Training Providers"
        description="Manage training providers accounts"
        icon={<PageHeaderIconList />}
      />

      <AdminTrainingProvidersUnifiedView platformOrgs={platformOrgs} hrdcData={hrdcData} />
    </div>
  );
}

/** Redirect legacy list URL to unified page. */
export function AdminTpOrgsRedirect() {
  return <Navigate to="/admin/training-providers" replace />;
}
