"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Navigate, useLocation, useParams } from "react-router-dom";

import { AdminCourseDetailContent } from "@/components/admin/admin-course-detail-content";
import {
  catalogCourseFromPlatform,
  platformCourseExtra,
} from "@/lib/admin-course-detail";
import type { CatalogCourse } from "@/lib/training-courses-catalog";
import type { PlatformCourseForCatalog } from "@/lib/training-courses-catalog";

type LocationState = {
  course?: CatalogCourse;
};

export default function AdminCourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const state = location.state as LocationState | null;

  const [loading, setLoading] = useState(Boolean(id));
  const [course, setCourse] = useState<CatalogCourse | null>(state?.course ?? null);
  const [extra, setExtra] = useState(
    state?.course?.source === "platform" ? null : undefined,
  );

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    void apiFetch(`/api/admin/tp-courses/${id}`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { course: PlatformCourseForCatalog } | null) => {
        if (!d?.course) {
          setCourse(null);
          return;
        }
        setCourse(catalogCourseFromPlatform(d.course));
        setExtra(platformCourseExtra(d.course));
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center p-6 text-sm text-[color:var(--text-muted)]">
        Loading course…
      </div>
    );
  }

  if (!course) {
    return <Navigate to="/admin/courses" replace />;
  }

  return <AdminCourseDetailContent course={course} extra={extra ?? undefined} />;
}
