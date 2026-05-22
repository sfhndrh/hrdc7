"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

import { TpPendingBanner } from "@/components/tp/tp-pending-banner";
import {
  TpNavIconCalendar,
  TpNavIconCourses,
  TpNavIconRatings,
} from "@/components/tp/tp-nav-icons";
import { DashboardPageHeader, GradientStatCard } from "@/components/dashboard/dashboard-widgets";
import type { TpDashboard } from "@/lib/tp-platform";
import { useTpOutlet } from "@/hooks/use-tp-outlet";

const statIconClass = "h-5 w-5 text-white";

export default function TpDashboardPage() {
  const { org, isAdmin } = useTpOutlet();
  const [stats, setStats] = useState<TpDashboard | null>(null);

  useEffect(() => {
    if (isAdmin) return;
    void apiFetch("/api/tp/dashboard", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setStats(d as TpDashboard | null));
  }, [isAdmin]);

  if (isAdmin) {
    return (
      <div className="space-y-6 p-6">
        <DashboardPageHeader title="Training provider dashboard" description="Preview as admin" />
        <p className="text-sm text-[color:var(--text-muted)]">
          Sign in as a training provider to see courses and schedules.
        </p>
      </div>
    );
  }

  if (!org) return null;

  return (
    <div className="space-y-6 p-6">
      <DashboardPageHeader
        title="Dashboard"
        description="Overview of your courses, schedules, and ratings"
      />
      <TpPendingBanner org={org} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <GradientStatCard
          title="Courses"
          value={String(stats?.courses ?? 0)}
          trend="Training programmes"
          gradient="bg-gradient-to-br from-sky-500 to-indigo-700"
          icon={<TpNavIconCourses className={statIconClass} />}
          href="/tp/courses"
        />
        <GradientStatCard
          title="Upcoming trainings"
          value={String(stats?.upcomingTrainings ?? 0)}
          trend="Scheduled sessions"
          gradient="bg-gradient-to-br from-teal-500 to-cyan-700"
          icon={<TpNavIconCalendar className={statIconClass} />}
          href="/tp/schedules"
        />
        <GradientStatCard
          title="Average rating"
          value={stats?.averageRating != null ? `${stats.averageRating} ★` : "—"}
          trend={`${stats?.ratingCount ?? 0} reviews`}
          gradient="bg-gradient-to-br from-rose-400 to-pink-600"
          icon={<TpNavIconRatings className={statIconClass} />}
          href="/tp/ratings"
        />
      </div>
    </div>
  );
}
