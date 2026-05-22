"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/components/ui/button";
import { formatRm, type TpCourse } from "@/lib/tp-platform";
import type { TrainingCourse } from "@/lib/training-providers";

const cardClass = cn(
  "flex h-full flex-col rounded-2xl border border-[color:var(--border)]",
  "bg-gradient-to-br from-[color:var(--card-gradient-from)] via-[color:var(--card-gradient-via)] to-[color:var(--card-gradient-to)]",
  "p-5 text-[color:var(--text)] shadow-[0_8px_22px_var(--shadow-color)]",
);

const interactiveCardClass = cn(
  cardClass,
  "cursor-pointer text-left transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_var(--shadow-elevated)]",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary)]/40",
);

export function AdminCourseCardsGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{children}</div>;
}

export function AdminPlatformCourseCard({
  course,
  onSelect,
}: {
  course: TpCourse;
  onSelect: () => void;
}) {
  const fee =
    Number(course.courseFee) > 0
      ? formatRm(Number(course.courseFee))
      : "Contact for pricing";

  return (
    <button type="button" onClick={onSelect} className={interactiveCardClass}>
      <CourseCardHeader title={course.title} subtitle={course.category} code={course.courseCode} />
      <div className="my-4 border-t border-[color:var(--border)]" />
      <div className="mt-auto grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <InfoCell label="Fee" value={fee} />
        <InfoCell label="Delivery" value={course.deliveryMode || "—"} />
        <InfoCell label="Duration" value={course.duration?.trim() || "—"} />
        <InfoCell label="Level" value={course.skillLevel || "—"} />
      </div>
      <div className="mt-3">
        <Badge tone={course.isPublished ? "green" : "gray"}>
          {course.isPublished ? "Published" : "Draft"}
        </Badge>
      </div>
    </button>
  );
}

export function AdminHrdcCourseCard({ course }: { course: TrainingCourse }) {
  return (
    <article className={cardClass}>
      <CourseCardHeader
        title={course.title || "Untitled course"}
        subtitle={course.scheme || "—"}
        code={course.code || undefined}
      />
      <div className="my-4 border-t border-[color:var(--border)]" />
      <div className="mt-auto grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <InfoCell label="Duration" value={course.duration || "—"} />
        <InfoCell label="Fee" value={course.fee || "—"} />
        <InfoCell label="Mode" value={course.mode || "—"} />
        <InfoCell label="Category" value={course.category || "—"} />
      </div>
      <div className="mt-3">
        {course.claimable ? (
          <Badge tone="green">HRDC Claimable</Badge>
        ) : (
          <Badge tone="gray">Not Claimable</Badge>
        )}
      </div>
    </article>
  );
}

function CourseCardHeader({
  title,
  subtitle,
  code,
}: {
  title: string;
  subtitle: string;
  code?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
        <BookIcon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-base font-semibold leading-tight text-[color:var(--text)]">{title}</h3>
        <p className="mt-1 text-sm text-[color:var(--text-muted)]">{subtitle}</p>
        {code ? (
          <div className="mt-2">
            <span className="inline-flex rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-2 py-0.5 text-[10px] font-medium text-[color:var(--text-muted)]">
              {code}
            </span>
          </div>
        ) : null}
      </div>
    </div>
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
