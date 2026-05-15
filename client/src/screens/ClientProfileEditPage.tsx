"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Navigate } from "react-router-dom";

import { useAuth } from "@/auth/AuthProvider";
import { CompanyProfileForm, type CompanyProfileInitial } from "@/pages/company-profile-form";

export default function ClientProfileEditPage() {
  const { user, loading } = useAuth();
  const [initial, setInitial] = useState<CompanyProfileInitial | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user || user.role === "ADMIN") return;
    void apiFetch("/api/client/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then(
        (d: {
          client?: {
            companyName: string;
            regNumber: string;
            industry: string;
            contactName: string;
            contactEmail: string | null;
            phone: string;
            address: string | null;
            profilePhoto: string | null;
            profileComplete: boolean;
            createdAt: string;
            updatedAt: string;
            user: { email: string };
          } | null;
        } | null) => {
          const row = d?.client;
          if (!row) {
            setLoadError(true);
            return;
          }
          setInitial({
            companyName: row.companyName,
            regNumber: row.regNumber,
            industry: row.industry,
            contactName: row.contactName,
            contactEmail: row.contactEmail ?? "",
            email: row.user.email,
            phone: row.phone,
            address: row.address ?? "",
            profilePhoto: row.profilePhoto ?? null,
            profileComplete: row.profileComplete,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
          });
        },
      );
  }, [user, loading]);

  if (loading) {
    return <div className="p-6 text-sm text-[color:var(--text-muted)]">Loading…</div>;
  }

  if (!user) return <Navigate to="/login?from=/client/profile/edit" replace />;

  if (user.role === "ADMIN") {
    return (
      <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 text-sm text-[color:var(--text-muted)]">
        Signed in as <strong className="text-[color:var(--text)]">admin</strong>. Open the company portal as
        a client to edit company profile details.
      </div>
    );
  }

  if (user.role !== "CLIENT") return <Navigate to="/" replace />;
  if (loadError) return <Navigate to="/client/profile" replace />;
  if (!initial) return <div className="p-6 text-sm text-[color:var(--text-muted)]">Loading…</div>;

  return <CompanyProfileForm key={initial.updatedAt} initial={initial} />;
}
