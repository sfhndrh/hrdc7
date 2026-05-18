"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

import { AdminTrainingProvidersView } from "@/components/admin/admin-training-providers-view";
import { PageHeaderIconList } from "@/components/dashboard/page-header-icons";
import type { ProvidersData } from "@/lib/training-providers";

export default function AdminTrainingProvidersPage() {
  const [data, setData] = useState<ProvidersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setError(null);
    const res = await apiFetch("/api/admin/training-providers", { credentials: "include" });
    if (res.status === 404) {
      setData(null);
      return;
    }
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(body.error ?? `Failed to load providers (${res.status})`);
    }
    setData((await res.json()) as ProvidersData);
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
      <div className="flex min-h-[320px] items-center justify-center text-sm text-[color:var(--text-muted)]">
        Loading training providers…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {error}
        </div>
      ) : null}
      <AdminTrainingProvidersView data={data} pageIcon={<PageHeaderIconList />} />
    </div>
  );
}
