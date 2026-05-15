"use client";

import { useEffect, useState, type ReactNode } from "react";
import { apiAssetUrl, apiFetch } from "@/lib/api";
import { Navigate } from "react-router-dom";

import { ButtonLink } from "@/components/ui/button";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-widgets";
import { PageHeaderIconBuilding } from "@/components/dashboard/page-header-icons";
import { useAuth } from "@/auth/AuthProvider";

type ClientRow = {
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
};

export default function ClientProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const [client, setClient] = useState<ClientRow | null>(null);
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
      .then((d: { client?: ClientRow | null } | null) => {
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
        Signed in as <strong className="text-[color:var(--text)]">admin</strong>. Open the company portal as
        a client to manage company profile details.
      </div>
    );
  }

  if (user.role !== "CLIENT") return <Navigate to="/" replace />;
  if (!client) return <Navigate to="/" replace />;

  const companyName = client.companyName?.trim() || "Your company";
  const initials = companyName
    .split(/\s+/)
    .filter((part) => /^[A-Za-z0-9]/.test(part))
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  const dateRegistered = new Date(client.createdAt).toLocaleDateString("en-MY", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Profile" icon={<PageHeaderIconBuilding />} />

      <div className="flex flex-col gap-5 rounded-2xl border border-[color:var(--border)] bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full bg-sky-100 text-lg font-semibold text-sky-700">
            {client.profilePhoto ? (
              <img
                src={apiAssetUrl(client.profilePhoto)}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              initials || "C"
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold leading-tight text-[color:var(--text)]">
              {companyName}
            </h1>
            <div className="mt-1 text-sm text-[color:var(--text-muted)]">Company</div>
          </div>
        </div>

        <div className="shrink-0">
          <ButtonLink size="sm" variant="outline" href="/client/profile/edit">
            Edit profile
          </ButtonLink>
        </div>
      </div>

      <Section title="Company information">
        <FieldGrid>
          <Field label="Company name" value={companyName} />
          <Field label="Industry" value={client.industry?.trim() || "—"} />
          <Field label="Date Registered" value={dateRegistered} />
        </FieldGrid>
      </Section>

      <Section title="Contact & account">
        <FieldGrid>
          <Field
            label="Contact email"
            value={client.contactEmail?.trim() || client.user.email || "—"}
          />
          <Field label="Phone number" value={client.phone?.trim() || "—"} />
          <Field
            label="Business address"
            value={client.address?.trim() || "—"}
            wide
            multiline
          />
        </FieldGrid>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-[color:var(--border)] bg-white p-6 shadow-sm">
      <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function FieldGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2">{children}</div>;
}

function Field({
  label,
  value,
  wide,
  multiline,
}: {
  label: string;
  value: string;
  wide?: boolean;
  multiline?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border border-sky-100 bg-sky-50/70 p-4 ${
        wide ? "md:col-span-2" : ""
      }`}
    >
      <div className="text-xs font-medium uppercase tracking-wide text-[color:var(--text-muted)]">
        {label}
      </div>
      <div
        className={`mt-2 text-sm font-medium text-[color:var(--text)] ${
          multiline ? "whitespace-pre-line leading-6" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}
