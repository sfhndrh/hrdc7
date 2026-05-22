"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

import {
  AdminUserManagementAnalytics,
  AnalyticsChartCard,
  DashboardPageHeader,
  CategoryVerticalBarChart,
  GradientStatCard,
  type UserManagementAnalytics,
} from "@/components/dashboard/dashboard-widgets";
import { PageHeaderIconHome } from "@/components/dashboard/page-header-icons";

type DashboardAnalytics = {
  userManagement: UserManagementAnalytics;
  coursesByCategory: Array<{ label: string; value: number; color: string }>;
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<{
    pendingApprovals: number;
    activeSubscriptions: number;
    pendingPaymentApprovals: number;
  } | null>(null);
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);

  useEffect(() => {
    void apiFetch("/api/admin/dashboard-stats", { credentials: "include" })
      .then((r) => r.json())
      .then(setStats);
    void apiFetch("/api/admin/dashboard-analytics", { credentials: "include" })
      .then((r) => r.json())
      .then((d: DashboardAnalytics) => setAnalytics(d));
  }, []);

  const coursesByCategory = analytics?.coursesByCategory ?? [];
  const hasCoursesByCategory =
    coursesByCategory.length > 0 && coursesByCategory.some((c) => c.value > 0);

  const pendingApprovals = stats?.pendingApprovals ?? "—";
  const activeSubscriptions = stats?.activeSubscriptions ?? "—";
  const pendingPaymentApprovals = stats?.pendingPaymentApprovals ?? "—";

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Dashboard" icon={<PageHeaderIconHome />} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <GradientStatCard
          title="Pending approvals"
          value={String(pendingApprovals)}
          trend="Items in your approval queue"
          gradient="bg-gradient-to-br from-orange-400 via-rose-500 to-pink-600"
          icon={<QueueIcon />}
          href="/admin/approval"
        />
        <GradientStatCard
          title="Active subscriptions"
          value={String(activeSubscriptions)}
          trend="Employers with full trainer access"
          gradient="bg-gradient-to-br from-sky-400 via-blue-600 to-indigo-800"
          icon={<SubIcon />}
          href="/admin/clients"
        />
        <GradientStatCard
          title="Payment approval"
          value={String(pendingPaymentApprovals)}
          trend="Subscriptions awaiting your approve or reject"
          gradient="bg-gradient-to-br from-violet-400 via-purple-600 to-indigo-900"
          icon={<PaymentApprovalIcon />}
          href="/admin/payments"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AnalyticsChartCard title="User Management">
          <AdminUserManagementAnalytics data={analytics?.userManagement ?? null} />
        </AnalyticsChartCard>
        <AnalyticsChartCard title="Courses by Category">
          {analytics === null ? (
            <EmptyChartState message="Loading…" />
          ) : !hasCoursesByCategory ? (
            <EmptyChartState message="No courses in the catalog yet." />
          ) : (
            <CategoryVerticalBarChart items={coursesByCategory} />
          )}
        </AnalyticsChartCard>
      </div>
    </div>
  );
}

function EmptyChartState({ message }: { message: string }) {
  return (
    <div className="flex h-52 items-center justify-center text-sm text-[color:var(--text-muted)]">
      {message}
    </div>
  );
}

function QueueIcon() {
  return (
    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function SubIcon() {
  return (
    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A2 2 0 0122 9.527V19a2 2 0 01-2 2H8a3 3 0 003-3M6 21H4a2 2 0 01-2-2v-9a2 2 0 014.563-6.943M12 21a3 3 0 119-9 11.962 11.962 0 00-7.11 2H9" />
    </svg>
  );
}

function PaymentApprovalIcon() {
  return (
    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
      />
    </svg>
  );
}
