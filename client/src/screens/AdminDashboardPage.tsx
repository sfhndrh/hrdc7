"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";

import {
  AnalyticsChartCard,
  DashboardPageHeader,
  DualSeriesBarChart,
  GradientStatCard,
  StylizedDonutChart,
} from "@/components/dashboard/dashboard-widgets";
import { PageHeaderIconHome } from "@/components/dashboard/page-header-icons";

type DashboardAnalytics = {
  registrations: { labels: string[]; trainers: number[]; companies: number[] };
  expertise: Array<{ label: string; value: number; color: string }>;
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

  const expertisePctSegments = useMemo(() => {
    const items = analytics?.expertise ?? [];
    const total = items.reduce((a, s) => a + s.value, 0);
    if (!total) return [];
    const segments = items.map((s) => ({
      label: s.label,
      pct: Math.max(1, Math.round((s.value / total) * 100)),
      color: s.color,
    }));
    const pctSum = segments.reduce((a, s) => a + s.pct, 0);
    if (pctSum !== 100 && segments[0]) {
      segments[0] = {
        ...segments[0],
        pct: Math.max(1, segments[0].pct + (100 - pctSum)),
      };
    }
    return segments;
  }, [analytics]);

  const regSeries = analytics?.registrations ?? {
    labels: [],
    trainers: [],
    companies: [],
  };

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
        <AnalyticsChartCard title="Total Registered Users">
          {analytics === null ? (
            <EmptyChartState message="Loading…" />
          ) : regSeries.labels.length === 0 ||
            regSeries.trainers.every((v) => v === 0) &&
              regSeries.companies.every((v) => v === 0) ? (
            <EmptyChartState message="No registrations yet." />
          ) : (
            <DualSeriesBarChart
              xLabels={regSeries.labels}
              seriesA={{ label: "Trainers", values: regSeries.trainers, colorClass: "bg-indigo-600" }}
              seriesB={{ label: "Employers", values: regSeries.companies, colorClass: "bg-pink-500" }}
            />
          )}
        </AnalyticsChartCard>
        <AnalyticsChartCard title="Trainers by Expertise Category">
          {analytics === null ? (
            <EmptyChartState message="Loading…" />
          ) : expertisePctSegments.length === 0 ? (
            <EmptyChartState message="No trainer expertise data yet." />
          ) : (
            <StylizedDonutChart segments={expertisePctSegments} />
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
