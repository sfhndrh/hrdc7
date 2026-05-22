"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";

import { useAuth } from "@/auth/AuthProvider";
import { Link } from "@/components/link";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-widgets";
import { PageHeaderIconCourses } from "@/components/dashboard/page-header-icons";
import { ButtonLink, cn } from "@/components/ui/button";
import { TP_COURSE_CATEGORIES } from "@/lib/tp-platform";

type CourseCardData = {
  id: string;
  title: string;
  courseCode: string;
  category: string;
  description: string;
  learningOutcomes: string;
  duration: string;
  deliveryMode: string;
  hrdcClaimable: string;
  courseFee: number;
  maxParticipants: number;
  language: string;
  skillLevel: string;
  trainingLocation: string | null;
  materialsNote: string | null;
  providerName: string;
};

export default function ClientCoursesPage() {
  const { user } = useAuth();
  const [subscribed, setSubscribed] = useState(false);
  const [courses, setCourses] = useState<CourseCardData[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const isAdmin = user?.role === "ADMIN";
  const unlockContent = isAdmin || subscribed;

  useEffect(() => {
    void apiFetch("/api/client/me", { credentials: "include" })
      .then((r) => r.json())
      .then(
        (d: {
          client?: {
            subscription?: { status: string; expiresAt: string | null } | null;
          } | null;
        }) => {
          const sub = d.client?.subscription;
          const active =
            sub?.status === "ACTIVE" &&
            (!sub.expiresAt || new Date(sub.expiresAt) > new Date());
          setSubscribed(!!active);
        },
      );
  }, []);

  useEffect(() => {
    void apiFetch("/api/client/courses", { credentials: "include" })
      .then(async (r) => {
        if (!r.ok) throw new Error(`Request failed (${r.status})`);
        return (await r.json()) as { courses: CourseCardData[] };
      })
      .then((d) => setCourses(d.courses ?? []))
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Failed to load courses.";
        setLoadError(msg);
        setCourses([]);
      });
  }, []);

  const filtered = useMemo(() => {
    if (!courses) return [];
    const needle = q.trim().toLowerCase();
    const catNeedle = categoryFilter.trim().toLowerCase();
    if (!unlockContent && (needle || catNeedle)) {
      return [];
    }
    return courses.filter((c) => {
      if (catNeedle && c.category.trim().toLowerCase() !== catNeedle) return false;
      if (!needle) return true;
      const hay = `${c.title} ${c.category} ${c.courseCode} ${c.providerName} ${c.deliveryMode} ${c.skillLevel}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [courses, q, categoryFilter, unlockContent]);

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Browse Courses"
        description="Free tier shows limited info. Subscribe to unlock full course and provider details."
        icon={<PageHeaderIconCourses />}
        right={
          subscribed || isAdmin ? null : (
            <ButtonLink size="sm" href="/client/subscription">
              Subscribe
            </ButtonLink>
          )
        }
      />

      <section
        className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 shadow-sm"
        aria-label="Search courses"
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <label className="relative block min-w-0 flex-1">
            <span className="sr-only">Search courses</span>
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--text-muted)]" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by title, category, or provider…"
              className="h-10 w-full rounded-xl border border-[color:var(--admin-search-border)] bg-[color:var(--admin-search-bg)] py-2 pl-10 pr-4 text-sm text-[color:var(--text)] placeholder:text-[color:var(--text-muted)] focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]/30"
            />
          </label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-10 shrink-0 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 text-sm text-[color:var(--text)] focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]/30 md:min-w-[200px]"
            aria-label="Filter by category"
          >
            <option value="">All categories</option>
            {TP_COURSE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </section>

      {loadError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </div>
      ) : null}

      {courses === null ? (
        <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-8 text-center text-sm text-[color:var(--text-muted)] shadow-sm">
          Loading courses…
        </div>
      ) : courses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[color:var(--border)] bg-[color:var(--surface)] p-10 text-center shadow-sm">
          <div className="text-base font-semibold text-[color:var(--text)]">No courses available yet</div>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-[color:var(--text-muted)]">
            Training providers will list courses here after their accounts are approved.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[color:var(--border)] bg-[color:var(--surface)] p-10 text-center shadow-sm">
          <div className="text-base font-semibold text-[color:var(--text)]">No courses match your search</div>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-[color:var(--text-muted)]">
            Try a different title, category, or provider name.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <CourseCard key={c.id} course={c} unlockContent={unlockContent} />
          ))}
        </div>
      )}
    </div>
  );
}

function CourseCard({
  course,
  unlockContent,
}: {
  course: CourseCardData;
  unlockContent: boolean;
}) {
  const locked = !unlockContent;
  const feeLabel =
    course.courseFee > 0 ? `RM ${course.courseFee.toLocaleString("en-MY")}` : "Contact for pricing";

  return (
    <Link
      href={`/client/courses/${course.id}`}
      className="flex flex-col rounded-2xl border border-[color:var(--border)] bg-gradient-to-br from-[color:var(--card-gradient-from)] via-[color:var(--card-gradient-via)] to-[color:var(--card-gradient-to)] p-5 text-[color:var(--text)] shadow-[0_8px_22px_var(--shadow-color)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_var(--shadow-elevated)]"
    >
      <div className="flex items-start gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
          <BookIcon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div
            className={cn(
              "text-base font-semibold leading-tight text-[color:var(--text)]",
              locked ? "select-none blur-sm pointer-events-none" : "",
            )}
            aria-hidden={locked ? true : undefined}
          >
            {course.title}
          </div>
          <div
            className={cn(
              "mt-1 text-sm text-[color:var(--text-muted)]",
              locked ? "select-none blur-sm pointer-events-none" : "",
            )}
            aria-hidden={locked ? true : undefined}
          >
            {course.category}
          </div>
          <div
            className={cn("mt-2", locked ? "select-none blur-sm pointer-events-none" : "")}
            aria-hidden={locked ? true : undefined}
          >
            <div className="text-sm font-medium text-[color:var(--text)]">{course.providerName}</div>
            {course.trainingLocation ? (
              <div className="mt-2">
                <Pill tone="white">{course.trainingLocation}</Pill>
              </div>
            ) : null}
          </div>
          {locked ? (
            <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">
              <LockIcon className="h-3 w-3" />
              Subscribe to view
            </div>
          ) : null}
        </div>
      </div>

      <div className="my-4 border-t border-[color:var(--border)]" />

      <div
        className={locked ? "select-none blur-sm pointer-events-none" : ""}
        aria-hidden={locked ? true : undefined}
      >
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <InfoCell label="Course ID" value={course.courseCode || "—"} />
          <InfoCell label="Duration" value={course.duration || "—"} />
          <InfoCell label="Fee" value={feeLabel} />
          <InfoCell label="Delivery" value={course.deliveryMode || "—"} />
        </div>
      </div>
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

function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <circle cx="11" cy="11" r="7" />
      <path strokeLinecap="round" d="M20 20l-3.3-3.3" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className={className}
      aria-hidden
    >
      <rect x="4" y="11" width="16" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function Pill({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "green" | "white";
}) {
  const toneClass: Record<typeof tone, string> = {
    green: "border-emerald-300 bg-emerald-100 text-emerald-700",
    white: "border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text)]",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${toneClass[tone]}`}
    >
      {children}
    </span>
  );
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13" />
    </svg>
  );
}
