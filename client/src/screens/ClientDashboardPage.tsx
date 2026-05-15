"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

import {
  DashboardBanner,
  DashboardPageHeader,
  GradientStatCard,
} from "@/components/dashboard/dashboard-widgets";
import { PageHeaderIconHome } from "@/components/dashboard/page-header-icons";
import { useAuth } from "@/auth/AuthProvider";

export default function ClientDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<{
    isAdmin: boolean;
    companyName: string | null;
    subscriptionLabel: string | null;
    subscriptionExpiresAt?: string | null;
    profileLabel: string | null;
    trainersListed: number | null;
    subActive: boolean;
  } | null>(null);

  useEffect(() => {
    void apiFetch("/api/client/dashboard", { credentials: "include" })
      .then((r) => r.json())
      .then(setData);
  }, []);

  const isAdmin = data?.isAdmin ?? user?.role === "ADMIN";
  const companyName = data?.companyName ?? user?.email ?? "Company";
  const subscriptionLabel = data?.subscriptionLabel ?? "—";
  const profileLabel = data?.profileLabel ?? "—";
  const trainersListed = data?.trainersListed ?? 0;
  const subActive = data?.subActive ?? false;
  const subExpiresAt = data?.subscriptionExpiresAt ?? null;
  const subValidUntil = formatExpiryDate(subExpiresAt);

  return (
    <div className="space-y-6">
      {subActive ? null : (
        <DashboardBanner
          message="Subscribe to unlock phone, email, portfolio, and certificates for each trainer."
          secondaryHref="/client/trainers"
          secondaryLabel="Browse trainers"
          primaryHref="/client/subscription"
          primaryLabel="Subscribe"
        />
      )}

      <DashboardPageHeader title="Dashboard" icon={<PageHeaderIconHome />} />

      <div className="grid gap-4 md:grid-cols-3">
        <GradientStatCard
          title="Subscription"
          value={isAdmin ? "—" : subscriptionLabel}
          trend={
            subActive
              ? subValidUntil
                ? `Valid until ${subValidUntil}`
                : "Valid until —"
              : "Subscribe to unlock full trainer details"
          }
          gradient="bg-gradient-to-br from-orange-400 via-rose-500 to-pink-600"
          icon={<StarIcon />}
        />
        <GradientStatCard
          title="Total Certified Trainers"
          value={isAdmin ? "—" : String(trainersListed)}
          trend={isAdmin ? "Sign in as a company to see totals" : "Approved trainers you can discover"}
          gradient="bg-gradient-to-br from-sky-400 via-blue-600 to-indigo-800"
          icon={<PeopleIcon />}
        />
        <GradientStatCard
          title="Company profile"
          value={isAdmin ? "—" : profileLabel}
          trend="Complete registration details to browse"
          gradient="bg-gradient-to-br from-teal-400 via-emerald-500 to-cyan-700"
          icon={<BuildingIcon />}
        />
      </div>

      <Panel title="Recent activity">
        <div className="text-sm text-[color:var(--text-muted)]">No activity yet.</div>
      </Panel>
    </div>
  );
}

function Panel(props: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-sm">
      <div className="text-sm font-semibold">{props.title}</div>
      <div className="mt-3">{props.children}</div>
    </div>
  );
}

function formatExpiryDate(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function StarIcon() {
  return (
    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}
