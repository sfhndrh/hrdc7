"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

import { AdminCoursesView } from "@/components/admin/admin-courses-view";
import { PageHeaderIconCourses } from "@/components/dashboard/page-header-icons";
import type { PlatformCourseForCatalog } from "@/lib/training-courses-catalog";
import type { ProvidersData } from "@/lib/training-providers";

export default function AdminCoursesPage() {
  const [hrdcData, setHrdcData] = useState<ProvidersData | null>(null);
  const [platformCourses, setPlatformCourses] = useState<PlatformCourseForCatalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setError(null);
    const [hrdcRes, platformRes] = await Promise.all([
      apiFetch("/api/admin/training-providers", { credentials: "include" }),
      apiFetch("/api/admin/tp-courses", { credentials: "include" }),
    ]);

    if (hrdcRes.status === 404) {
      setHrdcData(null);
    } else if (!hrdcRes.ok) {
      const body = (await hrdcRes.json().catch(() => ({}))) as { error?: string };
      throw new Error(body.error ?? `Failed to load HRDC courses (${hrdcRes.status})`);
    } else {
      setHrdcData((await hrdcRes.json()) as ProvidersData);
    }

    if (platformRes.ok) {
      const body = (await platformRes.json()) as { courses: PlatformCourseForCatalog[] };
      setPlatformCourses(body.courses ?? []);
    } else {
      setPlatformCourses([]);
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
      <div className="flex min-h-[320px] items-center justify-center text-sm text-[color:var(--text-muted)]">
        Loading courses…
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
      <AdminCoursesView
        hrdcData={hrdcData}
        platformCourses={platformCourses}
        pageIcon={<PageHeaderIconCourses />}
      />
    </div>
  );
}
