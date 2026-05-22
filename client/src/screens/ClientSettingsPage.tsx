"use client";

import { Navigate } from "react-router-dom";

import { useAuth } from "@/auth/AuthProvider";
import { AccountDeletionSection } from "@/components/client/account-deletion-section";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-widgets";
import { PageHeaderIconSettings } from "@/components/dashboard/page-header-icons";

export default function ClientSettingsPage() {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) {
    return <div className="p-6 text-sm text-[color:var(--text-muted)]">Loading…</div>;
  }

  if (!user) return <Navigate to="/login?from=/client/settings" replace />;

  if (user.role === "ADMIN") {
    return (
      <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 text-sm text-[color:var(--text-muted)]">
        Signed in as <strong className="text-[color:var(--text)]">admin</strong>. Open the employer
        portal as a client to manage employer settings.
      </div>
    );
  }

  if (user.role !== "CLIENT") return <Navigate to="/" replace />;

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Settings" icon={<PageHeaderIconSettings />} />

      <AccountDeletionSection
        apiPath="/api/client/account"
        description="Permanently remove your employer account from MY Certified Trainer. This deletes your profile, subscription records, payment submissions, and uploaded files. This action cannot be undone."
        confirmDescription="All employer data will be permanently removed from our system. You will be signed out immediately."
      />
    </div>
  );
}
