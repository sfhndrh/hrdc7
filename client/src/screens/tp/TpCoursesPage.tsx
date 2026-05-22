"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

import { Link } from "@/components/link";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-widgets";
import { PageHeaderIconTpCourses } from "@/components/dashboard/page-header-icons";
import { ButtonLink, cn } from "@/components/ui/button";
import { formatRm, type TpCourse } from "@/lib/tp-platform";
import { useTpOutlet } from "@/hooks/use-tp-outlet";

export default function TpCoursesPage() {
  const { approved } = useTpOutlet();
  const [courses, setCourses] = useState<TpCourse[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    void apiFetch("/api/tp/courses", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { courses: [] }))
      .then((d: { courses: TpCourse[] }) => setCourses(d.courses ?? []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!approved) {
    return (
      <div className="p-6 text-sm text-[color:var(--text-muted)]">
        Course management unlocks after your training provider account is approved.
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <DashboardPageHeader
        title="Courses"
        description="Create and manage your training programmes"
        icon={<PageHeaderIconTpCourses />}
        right={
          <ButtonLink href="/tp/courses/new" size="sm">
            Create course
          </ButtonLink>
        }
      />

      {loading ? (
        <p className="text-sm text-[color:var(--text-muted)]">Loading…</p>
      ) : courses.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[color:var(--border)] p-8 text-center text-sm text-[color:var(--text-muted)]">
          No courses yet. Create your first course to offer training to employers.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {courses.map((c) => (
            <TpCourseCard key={c.id} course={c} />
          ))}
        </div>
      )}
    </div>
  );
}

function TpCourseCard({ course }: { course: TpCourse }) {
  const fee =
    Number(course.courseFee) > 0
      ? formatRm(Number(course.courseFee))
      : "Contact for pricing";

  return (
    <Link
      href={`/tp/courses/${course.id}`}
      className={cn(
        "flex h-full flex-col rounded-2xl border border-[color:var(--border)]",
        "bg-gradient-to-br from-[color:var(--card-gradient-from)] via-[color:var(--card-gradient-via)] to-[color:var(--card-gradient-to)]",
        "p-5 text-[color:var(--text)] shadow-[0_8px_22px_var(--shadow-color)]",
        "transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_var(--shadow-elevated)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary)]/40",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
          <BookIcon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold leading-tight text-[color:var(--text)]">
            {course.title}
          </h3>
          <p className="mt-1 text-sm text-[color:var(--text-muted)]">{course.category}</p>
          {course.courseCode ? (
            <div className="mt-2">
              <span className="inline-flex rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-2 py-0.5 text-[10px] font-medium text-[color:var(--text-muted)]">
                {course.courseCode}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="my-4 border-t border-[color:var(--border)]" />

      <div className="mt-auto grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <InfoCell label="Fee" value={fee} />
        <InfoCell label="Delivery" value={course.deliveryMode || "—"} />
        <InfoCell label="Duration" value={course.duration?.trim() || "—"} />
        <InfoCell label="Level" value={course.skillLevel || "—"} />
      </div>

      {course.trainingLocation?.trim() ? (
        <p className="mt-3 text-xs text-[color:var(--text-muted)]">
          <span className="font-medium text-[color:var(--text)]">Location:</span>{" "}
          {course.trainingLocation}
        </p>
      ) : null}
    </Link>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-[color:var(--text-muted)]">{label}</div>
      <div className="mt-0.5 text-sm font-semibold text-[color:var(--text)]">{value}</div>
    </div>
  );
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 4.5A2.5 2.5 0 0 1 6.5 7H20v13H6.5A2.5 2.5 0 0 1 4 17.5v-13z"
      />
    </svg>
  );
}
