"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import {
  AdminCategoryIcon,
  AdminCourseIcon,
  adminCourseIconBadgeClass,
  AdminStatIconCategories,
  AdminStatIconClaimable,
  AdminStatIconTotalCourses,
} from "@/components/admin/admin-course-icons";
import { DashboardPageHeader, GradientStatCard } from "@/components/dashboard/dashboard-widgets";
import { cn } from "@/components/ui/button";
import {
  buildCoursesCatalog,
  buildPlatformCoursesCatalog,
  filterCoursesCatalog,
  mergeCourseCatalogs,
  type CatalogCourse,
  type CatalogCategory,
  type CoursesClaimableFilter,
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
  const [claimableFilter, setClaimableFilter] = useState<CoursesClaimableFilter>("all");

  const catalog = useMemo(() => {
    const hrdc = hrdcData ? buildCoursesCatalog(hrdcData.providers) : [];
    const platform = buildPlatformCoursesCatalog(platformCourses);
    return mergeCourseCatalogs(hrdc, platform);
  }, [hrdcData, platformCourses]);

  const filtered = useMemo(
    () => filterCoursesCatalog(catalog, q, claimableFilter),
    [catalog, q, claimableFilter],
  );

  const hasActiveFilters = q.trim().length > 0 || claimableFilter !== "all";

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
          icon={<AdminStatIconTotalCourses />}
        />
        <GradientStatCard
          title="Categories"
          value={String(stats.categories)}
          trend="Course groupings by category"
          gradient="bg-gradient-to-br from-orange-400 via-rose-500 to-pink-600"
          icon={<AdminStatIconCategories />}
        />
        <GradientStatCard
          title="HRDC claimable"
          value={String(stats.claimable)}
          trend="Courses claimable under HRD Corp"
          gradient="bg-gradient-to-br from-teal-400 via-emerald-500 to-cyan-700"
          icon={<AdminStatIconClaimable />}
        />
      </div>

      <section
        className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 shadow-sm"
        aria-label="Filter courses"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative block min-w-0 flex-1">
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
          <label className="block shrink-0 sm:w-52">
            <span className="sr-only">Filter by HRDC claimable status</span>
            <select
              value={claimableFilter}
              onChange={(e) =>
                setClaimableFilter(e.target.value as CoursesClaimableFilter)
              }
              className="w-full rounded-xl border border-[color:var(--admin-search-border)] bg-[color:var(--admin-search-bg)] px-3 py-2.5 text-sm text-[color:var(--text)] focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]/30"
            >
              <option value="all">All courses</option>
              <option value="claimable">HRDC claimable only</option>
              <option value="not_claimable">Not HRDC claimable</option>
            </select>
          </label>
        </div>
      </section>

      <section
        className="overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] shadow-sm"
        aria-label="Course catalog"
      >
        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-[color:var(--text-muted)]">
            {hasActiveFilters
              ? "No courses match your filters."
              : "No courses listed yet."}
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
      <span
        className={cn(
          "grid h-9 w-9 shrink-0 place-items-center rounded-lg",
          adminCourseIconBadgeClass(course.category, course.title),
        )}
      >
        <AdminCourseIcon category={course.category} title={course.title} className="h-4 w-4" />
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
  return <AdminCategoryIcon category={name} className="h-5 w-5" />;
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path strokeLinecap="round" d="M20 20l-3-3" />
    </svg>
  );
}
