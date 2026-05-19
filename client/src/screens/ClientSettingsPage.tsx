"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Navigate } from "react-router-dom";

import { useAuth } from "@/auth/AuthProvider";
import { AccountDeletionSection } from "@/components/client/account-deletion-section";
import {
  CompanyProfileView,
  type CompanyProfileViewClient,
} from "@/components/client/company-profile-view";
import { PageHeaderIconSettings } from "@/components/dashboard/page-header-icons";

export default function ClientSettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const [client, setClient] = useState<CompanyProfileViewClient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    if (user.role === "ADMIN") {
      setClient(null);
      setLoading(false);
      return;
    }
    void apiFetch("/api/client/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { client?: CompanyProfileViewClient | null } | null) => {
        setClient(d?.client ?? null);
      })
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  if (authLoading || loading) {
    return <div className="p-6 text-sm text-[color:var(--text-muted)]">Loading…</div>;
  }

  if (!user) return <Navigate to="/login?from=/client/settings" replace />;

  if (user.role === "ADMIN") {
    return (
      <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 text-sm text-[color:var(--text-muted)]">
        Signed in as <strong className="text-[color:var(--text)]">admin</strong>. Open the company
        portal as a client to manage company settings.
      </div>
    );
  }

  if (user.role !== "CLIENT") return <Navigate to="/" replace />;
  if (!client) return <Navigate to="/client/dashboard" replace />;

  return (
    <CompanyProfileView
      client={client}
      title="Settings"
      icon={<PageHeaderIconSettings />}
      footer={
        <AccountDeletionSection
          apiPath="/api/client/account"
          description="Permanently remove your company account from MY Certified Trainer. This deletes your profile, subscription records, payment submissions, and uploaded files. This action cannot be undone."
          confirmDescription="All company data will be permanently removed from our system. You will be signed out immediately."
        />
      }
    />
  );
}
