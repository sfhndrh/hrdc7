"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import { DashboardPageHeader, GradientStatCard } from "@/components/dashboard/dashboard-widgets";
import { cn } from "@/components/ui/button";
import {
  buildCoursesCatalog,
  buildPlatformCoursesCatalog,
  filterCoursesCatalog,
  mergeCourseCatalogs,
  type CatalogCourse,
  type CatalogCategory,
  type PlatformCourseForCatalog,
} from "@/lib/training-courses-catalog";
import type { ProvidersData } from "@/lib/training-providers";

export function AdminCoursesView({
  hrdcData,
  platformCourses,
  pageIcon,
}: {
  hrdcData: ProvidersData | null;
  platformCourses: PlatformCourseForCatalog[];
  pageIcon: ReactNode;
}) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const catalog = useMemo(() => {
    const hrdc = hrdcData ? buildCoursesCatalog(hrdcData.providers) : [];
    const platform = buildPlatformCoursesCatalog(platformCourses);
    return mergeCourseCatalogs(hrdc, platform);
  }, [hrdcData, platformCourses]);

  const filtered = useMemo(() => filterCoursesCatalog(catalog, q), [catalog, q]);

  const stats = useMemo(() => {
    const totalCourses = catalog.reduce((n, c) => n + c.courses.length, 0);
    const categories = catalog.length;
    const claimable = catalog.reduce(
      (n, c) => n + c.courses.filter((course) => course.claimable).length,
      0,
    );
    return { totalCourses, categories, claimable };
  }, [catalog]);

  const hasAnyCourses = catalog.some((c) => c.courses.length > 0);

  if (!hasAnyCourses && !hrdcData) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader
          title="Courses"
          description="Courses and programmes listed in the platform"
          icon={pageIcon}
        />
        <div className="rounded-2xl border border-dashed border-[color:var(--border)] bg-[color:var(--surface)] px-6 py-12 text-center text-sm text-[color:var(--text-muted)]">
          No course data yet. Import HRDC providers or wait for training providers to publish courses on the platform.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Courses"
        description="Courses and programmes listed in the platform"
        icon={pageIcon}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <GradientStatCard
          title="Total courses"
          value={String(stats.totalCourses)}
          trend="All courses in the catalog"
          gradient="bg-gradient-to-br from-sky-400 via-blue-600 to-indigo-800"
          icon={<BookStatIcon />}
        />
        <GradientStatCard
          title="Categories"
          value={String(stats.categories)}
          trend="Course groupings by category"
          gradient="bg-gradient-to-br from-orange-400 via-rose-500 to-pink-600"
          icon={<GridStatIcon />}
        />
        <GradientStatCard
          title="HRDC claimable"
          value={String(stats.claimable)}
          trend="Courses claimable under HRD Corp"
          gradient="bg-gradient-to-br from-teal-400 via-emerald-500 to-cyan-700"
          icon={<CheckStatIcon />}
        />
      </div>

      <section
        className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 shadow-sm"
        aria-label="Search courses"
      >
        <label className="relative block">
          <span className="sr-only">Search courses by title, category, or code</span>
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--text-muted)]" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search courses by title, category, or code…"
            className="w-full rounded-xl border border-[color:var(--admin-search-border)] bg-[color:var(--admin-search-bg)] py-2.5 pl-10 pr-4 text-sm text-[color:var(--text)] placeholder:text-[color:var(--text-muted)] focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]/30"
          />
        </label>
      </section>

      <section
        className="overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] shadow-sm"
        aria-label="Course catalog"
      >
        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-[color:var(--text-muted)]">
            {q.trim() ? "No courses match your search." : "No courses listed yet."}
          </div>
        ) : (
          <div className="space-y-8 p-4 sm:p-6">
            {filtered.map((category) => (
              <CategorySection
                key={category.name}
                category={category}
                onSelectCourse={(course) => {
                  if (course.source === "platform" && course.platformId) {
                    navigate(`/admin/courses/p/${course.platformId}`);
                  } else {
                    navigate("/admin/courses/view", { state: { course } });
                  }
                }}
              />
            ))}
          </div>
        )}
      </section>

    </div>
  );
}

function CategorySection({
  category,
  onSelectCourse,
}: {
  category: CatalogCategory;
  onSelectCourse: (course: CatalogCourse) => void;
}) {
  return (
    <section aria-labelledby={`category-${category.name}`}>
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300">
          <CategoryIcon name={category.name} />
        </span>
        <h2
          id={`category-${category.name}`}
          className="text-lg font-bold text-[color:var(--text)]"
        >
          {category.name}{" "}
          <span className="font-normal text-[color:var(--text-muted)]">
            ({category.courses.length})
          </span>
        </h2>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {category.courses.map((course) => (
          <li key={`${category.name}-${course.platformId ?? course.title}-${course.code}`}>
            <CourseCard course={course} onSelect={() => onSelectCourse(course)} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function CourseCard({
  course,
  onSelect,
}: {
  course: CatalogCourse;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-start gap-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-3 text-left shadow-sm transition-colors",
        "hover:border-sky-200 hover:bg-[color:var(--surface-muted)]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/60",
      )}
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
        <CourseIcon title={course.title} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 text-sm font-semibold leading-snug text-[color:var(--text)]">
          {course.title}
        </span>
        <span className="mt-1 block text-xs text-[color:var(--text-muted)]">
          {course.source === "platform"
            ? course.providerNames[0] ?? "Platform provider"
            : `${course.providerCount} provider${course.providerCount === 1 ? "" : "s"}`}
        </span>
      </span>
    </button>
  );
}

function CategoryIcon({ name }: { name: string }) {
  const n = name.toLowerCase();
  if (n.includes("ai")) return <SparkIcon className="h-5 w-5" />;
  if (n.includes("microsoft") || n.includes("office") || n.includes("365")) {
    return <MonitorIcon className="h-5 w-5" />;
  }
  if (n.includes("leadership") || n.includes("management")) {
    return <UsersIcon className="h-5 w-5" />;
  }
  return <BookIcon className="h-5 w-5" />;
}

function CourseIcon({ title }: { title: string }) {
  const t = title.toLowerCase();
  if (t.includes("ai") || t.includes("chatgpt") || t.includes("copilot")) {
    return <SparkIcon className="h-4 w-4" />;
  }
  if (t.includes("excel") || t.includes("power bi") || t.includes("outlook")) {
    return <ChartIcon className="h-4 w-4" />;
  }
  if (t.includes("team")) return <UsersIcon className="h-4 w-4" />;
  return <BookIcon className="h-4 w-4" />;
}

function BookStatIcon() {
  return (
    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      />
    </svg>
  );
}

function GridStatIcon() {
  return (
    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h7v7H4V6zm9 0h7v7h-7V6zM4 15h7v7H4v-7zm9 0h7v7h-7v-7z" />
    </svg>
  );
}

function CheckStatIcon() {
  return (
    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13" />
    </svg>
  );
}

function SparkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3l1.5 5L12 4l-1.5 5L5 13l5-1.5L12 4 9.5 9.5 5 3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l.75 2.5L20 17l-2.25.5L17 20l-.75-2.5L14 17l2.25-.5L17 14z" />
    </svg>
  );
}

function MonitorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path strokeLinecap="round" d="M8 20h8" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-1a4 4 0 00-4-4H5a4 4 0 00-4 4v1" />
      <circle cx="9" cy="7" r="4" />
      <path strokeLinecap="round" d="M23 21v-1a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 19h16M7 16V8m5 8V5m5 11v-3" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path strokeLinecap="round" d="M20 20l-3-3" />
    </svg>
  );
}
