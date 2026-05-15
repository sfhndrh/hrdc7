"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Navigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import {
  AnalyticsChartCard,
  GradientStatCard,
  StylizedDonutChart,
} from "@/components/dashboard/dashboard-widgets";
import { TrainerPageHeader } from "@/components/dashboard/trainer-page-header";
import { TrainerNavIconHome } from "@/components/dashboard/trainer-sidebar-icons";
import { useAuth } from "@/auth/AuthProvider";

type TrainerDash = {
  status: string;
  adminNote: string | null;
  bio: string;
  portfolioUrl: string | null;
  linkedIn: string | null;
  expertise: string[];
};

export default function TrainerDashboardPage() {
  const { user } = useAuth();
  const [trainer, setTrainer] = useState<TrainerDash | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (user?.role === "ADMIN") {
      setTrainer(null);
      setReady(true);
      return;
    }
    void apiFetch("/api/trainer/me", { credentials: "include" })
      .then((r) => r.json())
      .then((d: { trainer: TrainerDash | null }) => setTrainer(d.trainer))
      .finally(() => setReady(true));
  }, [user?.role]);

  if (user?.role === "ADMIN") {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 text-[color:var(--text-muted)]">
          Signed in as <strong className="text-[color:var(--text)]">admin</strong>. View this dashboard as a
          trainer account to see your personal analytics widgets.
        </div>
      </div>
    );
  }

  if (!ready) {
    return <div className="p-6 text-sm text-[color:var(--text-muted)]">Loading…</div>;
  }

  if (!trainer) {
    return <Navigate to="/" replace />;
  }

  const approved = trainer.status === "APPROVED";
  const completeness = estimateCompleteness(trainer);
  const statusBadge = statusTone(trainer.status);

  return (
    <div className="space-y-6 p-6">
      {!approved ? (
        <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4 text-sm shadow-sm">
          <span className="font-semibold text-[color:var(--text)]">Approval from administrator</span>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Badge tone={statusBadge}>{readableStatus(trainer.status)}</Badge>
            <span className="text-[color:var(--text-muted)]">
              You can update your profile and certificate from the sidebar. Marketplace features unlock after
              approval.
            </span>
          </div>
          {trainer.adminNote ? (
            <div className="mt-3 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] p-3 text-[color:var(--text-muted)]">
              <span className="font-medium text-[color:var(--text)]">Admin note:</span> {trainer.adminNote}
            </div>
          ) : null}
        </div>
      ) : null}

      <TrainerPageHeader title="Dashboard" icon={<TrainerNavIconHome />} />

      <div className="grid gap-4 md:grid-cols-2">
        <GradientStatCard
          title="Application status"
          value={readableStatus(trainer.status)}
          trend={applicationStatusTrend(trainer.status)}
          gradient="bg-gradient-to-br from-sky-400 via-blue-600 to-indigo-800"
          icon={<DocIcon />}
        />
        <GradientStatCard
          title="Profile strength"
          value={`${completeness}%`}
          trend="Complete your profile to stand out"
          gradient="bg-gradient-to-br from-orange-400 via-rose-500 to-pink-600"
          icon={<SparkIcon />}
        />
      </div>

      <div className="max-w-2xl">
        <AnalyticsChartCard title="My expertise">
          <StylizedDonutChart segments={expertisePieSegments(trainer.expertise)} />
        </AnalyticsChartCard>
      </div>

      {!approved ? (
        <Panel title="Next steps">
          <ol className="list-decimal space-y-2 pl-5 text-sm text-[color:var(--text)]">
            <li>Ensure your HRDC certificate is uploaded.</li>
            <li>Complete your profile accurately.</li>
            <li>Wait for administrator review—we’ll notify you by email.</li>
          </ol>
        </Panel>
      ) : null}
    </div>
  );
}

function SparkIcon() {
  return (
    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}

function DocIcon() {
  return (
    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function applicationStatusTrend(status: string) {
  switch (status) {
    case "APPROVED":
      return "Messages, calendar, and listings are available";
    case "REJECTED":
      return "Update your profile";
    case "UNDER_REVIEW":
      return "Reviewing your application";
    case "PENDING":
    default:
      return "Finish your profile";
  }
}

function readableStatus(s: string) {
  switch (s) {
    case "UNDER_REVIEW":
      return "Under review";
    case "REJECTED":
      return "Rejected";
    case "APPROVED":
      return "Approved";
    case "PENDING":
      return "Pending";
    default:
      return "Pending";
  }
}

function statusTone(s: string): "gray" | "yellow" | "green" | "red" {
  switch (s) {
    case "APPROVED":
      return "green";
    case "REJECTED":
      return "red";
    case "UNDER_REVIEW":
      return "yellow";
    default:
      return "gray";
  }
}

const EXPERTISE_PIE_COLORS = ["#6366f1", "#ec4899", "#14b8a6", "#f59e0b", "#8b5cf6", "#06b6d4", "#22c55e"];

function expertisePieSegments(expertise: string[]) {
  const trimmed = expertise.map((e) => e.trim()).filter(Boolean);
  if (trimmed.length === 0) {
    return [{ label: "Add areas in your profile", pct: 100, color: "#94a3b8" }];
  }
  const n = trimmed.length;
  const base = Math.floor(100 / n);
  const remainder = 100 - base * n;
  return trimmed.map((label, i) => ({
    label,
    pct: base + (i < remainder ? 1 : 0),
    color: EXPERTISE_PIE_COLORS[i % EXPERTISE_PIE_COLORS.length],
  }));
}

function estimateCompleteness(trainer: {
  bio: string;
  portfolioUrl: string | null;
  linkedIn: string | null;
  expertise: string[];
}) {
  let score = 0;
  if (trainer.bio && trainer.bio.length >= 20) score += 35;
  if (trainer.portfolioUrl) score += 25;
  if (trainer.linkedIn) score += 20;
  if (trainer.expertise.length >= 2) score += 20;
  return Math.min(100, score);
}

function Panel(props: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-sm">
      <div className="text-sm font-semibold">{props.title}</div>
      <div className="mt-3">{props.children}</div>
    </div>
  );
}
