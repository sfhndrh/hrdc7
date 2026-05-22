"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { ReactNode } from "react";
import { Link } from "@/components/link";
import { Navigate, useParams } from "react-router-dom";

import { AdminClientActionsSection } from "@/components/admin/admin-client-actions";
import { SubscriptionPlanPill } from "@/components/admin/admin-accounts-chrome";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-widgets";
import { PageHeaderIconBuilding } from "@/components/dashboard/page-header-icons";
function subscriptionIsPro(status: string, expiresAt: string | null): boolean {
  if (status !== "ACTIVE") return false;
  if (expiresAt && new Date(expiresAt).getTime() < Date.now()) return false;
  return true;
}

type ClientDetail = {
  id: string;
  companyName: string;
  regNumber: string;
  industry: string;
  contactName: string;
  contactEmail: string | null;
  phone: string;
  address: string | null;
  profileComplete: boolean;
  accountStatus: "ACTIVE" | "SUSPENDED";
  suspensionReason: string | null;
  suspendedAt: string | null;
  createdAt: string;
  user: { email: string };
  subscription: {
    status: string;
    planType: string;
    amount: string | number;
    expiresAt: string | null;
  } | null;
};

export default function AdminCompanyDetailPage() {
  const { id } = useParams();
  const [row, setRow] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  const loadClient = useCallback(() => {
    if (!id) return;
    setLoading(true);
    void apiFetch(`/api/admin/clients/${id}`, { credentials: "include" })
      .then((r) => {
        if (r.status === 404) {
          setMissing(true);
          return null;
        }
        return r.json() as Promise<{ client: ClientDetail }>;
      })
      .then((d) => {
        if (d?.client) setRow(d.client);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    loadClient();
  }, [loadClient]);

  if (!id) return null;
  if (loading) {
    return <div className="p-6 text-sm text-[color:var(--text-muted)]">Loading…</div>;
  }
  if (missing || !row) {
    return <Navigate to="/admin/clients" replace />;
  }

  const planTier = subscriptionIsPro(
    row.subscription?.status ?? "PENDING_PAYMENT",
    row.subscription?.expiresAt ?? null,
  )
    ? "pro"
    : "free";

  const memberSince = new Date(row.createdAt).toLocaleDateString("en-MY", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/clients"
          className="inline-flex items-center gap-1 text-sm text-[color:var(--text-muted)] hover:text-[color:var(--text)]"
        >
          <span aria-hidden>←</span> Back to employers
        </Link>
      </div>

      <DashboardPageHeader
        title={row.companyName}
        description="Employer account"
        icon={<PageHeaderIconBuilding />}
      />

      <Section title="Employer information">
        <FieldGrid>
          <ReadOnlyField label="Employer name" value={row.companyName} />
          <ReadOnlyField label="Registration number (SSM / BRN)" value={row.regNumber} />
          <ReadOnlyField label="Industry" value={row.industry} />
          <ReadOnlyField label="Member since" value={memberSince} />
        </FieldGrid>
      </Section>

      <Section title="Contact & account">
        <FieldGrid>
          <ReadOnlyField label="Primary contact name" value={row.contactName?.trim() || "—"} />
          <ReadOnlyField label="Contact email" value={row.contactEmail?.trim() || "—"} />
          <ReadOnlyField label="Sign-in email" value={row.user.email} />
          <ReadOnlyField label="Phone number" value={row.phone} />
          <ReadOnlyField
            label="Business address"
            value={row.address?.trim() || "—"}
            wide
            multiline
          />
        </FieldGrid>
      </Section>

      <Section title="Subscription">
        <FieldGrid>
          <ReadOnlyField label="Plan">
            <SubscriptionPlanPill tier={planTier} />
          </ReadOnlyField>
          <ReadOnlyField
            label="Subscription status"
            value={row.subscription?.status?.replace(/_/g, " ") ?? "No subscription record"}
          />
          {row.subscription ? (
            <>
              <ReadOnlyField
                label="Amount"
                value={`MYR ${Number(row.subscription.amount).toFixed(2)}`}
              />
              <ReadOnlyField
                label="Expires"
                value={
                  row.subscription.expiresAt
                    ? new Date(row.subscription.expiresAt).toLocaleDateString("en-MY", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "—"
                }
              />
            </>
          ) : null}
        </FieldGrid>
      </Section>

      <AdminClientActionsSection
        clientId={row.id}
        accountStatus={row.accountStatus}
        suspensionReason={row.suspensionReason}
        suspendedAt={row.suspendedAt}
        onUpdated={loadClient}
      />
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm">
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

function ReadOnlyField({
  label,
  value,
  children,
  wide,
  multiline,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
  wide?: boolean;
  multiline?: boolean;
}) {
  const body =
    children ??
    (
      <div
        className={`text-sm font-medium text-[color:var(--text)] ${
          multiline ? "whitespace-pre-wrap leading-6" : ""
        }`}
      >
        {value}
      </div>
    );

  return (
    <div
      className={`rounded-xl border border-[color:var(--admin-search-border)] bg-[color:var(--admin-search-bg)] p-4 ${wide ? "md:col-span-2" : ""}`}
    >
      <div className="text-xs font-medium uppercase tracking-wide text-[color:var(--text-muted)]">
        {label}
      </div>
      <div className="mt-2">{body}</div>
    </div>
  );
}
