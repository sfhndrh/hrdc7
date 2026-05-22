"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Navigate } from "react-router-dom";

import {
  CompanyProfileView,
  type CompanyProfileViewClient,
} from "@/components/client/company-profile-view";
import { PageHeaderIconBuilding } from "@/components/dashboard/page-header-icons";
import { useAuth } from "@/auth/AuthProvider";

export default function ClientProfilePage() {
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

  if (!user) return <Navigate to="/login?from=/client/profile" replace />;

  if (user.role === "ADMIN") {
    return (
      <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 text-sm text-[color:var(--text-muted)]">
        Signed in as <strong className="text-[color:var(--text)]">admin</strong>. Open the employer portal as
        a client to manage employer profile details.
      </div>
    );
  }

  if (user.role !== "CLIENT") return <Navigate to="/" replace />;
  if (!client) return <Navigate to="/" replace />;

  return (
    <CompanyProfileView
      client={client}
      title="Profile"
      icon={<PageHeaderIconBuilding />}
    />
  );
}
