"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "@/lib/api";

import {
  AdminCourseCardsGrid,
  AdminPlatformCourseCard,
} from "@/components/admin/admin-course-cards";
import type { TpCourse } from "@/lib/tp-platform";

export function AdminTpPlatformCoursesTable({ tpOrgId }: { tpOrgId: string }) {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<TpCourse[] | null>(null);

  useEffect(() => {
    void apiFetch(`/api/admin/tp-orgs/${tpOrgId}/courses`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { courses: [] }))
      .then((d: { courses: TpCourse[] }) => setCourses(d.courses ?? []));
  }, [tpOrgId]);

  if (courses === null) {
    return <p className="text-sm text-[color:var(--text-muted)]">Loading courses…</p>;
  }

  if (courses.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-[color:var(--border)] px-6 py-10 text-center text-sm text-[color:var(--text-muted)]">
        No courses listed.
      </p>
    );
  }

  return (
    <AdminCourseCardsGrid>
      {courses.map((c) => (
        <AdminPlatformCourseCard
          key={c.id}
          course={c}
          onSelect={() => navigate(`/admin/courses/p/${c.id}`)}
        />
      ))}
    </AdminCourseCardsGrid>
  );
}
