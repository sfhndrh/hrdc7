"use client";

import { type ReactNode } from "react";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-widgets";
import { ProfilePhotoCircle } from "@/components/profile/profile-photo-circle";
import { Badge } from "@/components/ui/badge";
import { apiAssetUrl } from "@/lib/api";
import { tpStatusLabel, type TpOrg } from "@/lib/tp-platform";

function displaySsmNumber(ssmNumber: string) {
  const v = ssmNumber?.trim();
  if (!v || v === "—") return "—";
  return v;
}

export function TpProfileView({
  org,
  title,
  icon,
  headerExtra,
}: {
  org: TpOrg;
  title: string;
  icon: ReactNode;
  headerExtra?: ReactNode;
}) {
  const initials = org.companyName
    .split(/\s+/)
    .filter((part) => /^[A-Za-z0-9]/.test(part))
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  const dateRegistered = org.createdAt
    ? new Date(org.createdAt).toLocaleDateString("en-MY", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

  const statusTone =
    org.status === "APPROVED" ? "green" : org.status === "REJECTED" ? "red" : "yellow";

  return (
    <div className="space-y-6">
      <DashboardPageHeader title={title} icon={icon} />

      <div className="flex flex-col gap-5 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <ProfilePhotoCircle
            photoUrl={org.logoUrl}
            fallback={initials || "TP"}
            alt={org.companyName}
          />
          <div className="min-w-0">
            <h1 className="text-2xl font-bold leading-tight text-[color:var(--text)]">
              {org.companyName}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge tone={statusTone}>{tpStatusLabel(org.status)}</Badge>
              {org.hrdcTpId ? (
                <span className="text-sm text-[color:var(--text-muted)]">
                  HRDC TP ID: {org.hrdcTpId}
                </span>
              ) : null}
            </div>
          </div>
        </div>
        {headerExtra ? <div className="shrink-0">{headerExtra}</div> : null}
      </div>

      <Section title="Company">
        <FieldGrid>
          <Field label="Company name" value={org.companyName} />
          <Field label="SSM registration number" value={displaySsmNumber(org.ssmNumber)} />
          <Field label="Company email" value={org.companyEmail} />
          <Field label="Phone number" value={org.phone} />
          <Field label="Company address" value={org.address} wide multiline />
          <Field label="Website" value={org.website ?? "—"} />
          <Field label="HRDC Training Provider ID" value={org.hrdcTpId ?? "—"} />
          <Field label="Company description" value={org.description ?? "—"} wide multiline />
        </FieldGrid>
      </Section>

      <Section title="Contact Person">
        <FieldGrid>
          <Field label="Name" value={org.picName} />
          {org.picPosition?.trim() ? <Field label="Position" value={org.picPosition} /> : null}
          <Field label="Email" value={org.picEmail} />
          <Field label="Phone number" value={org.picPhone} />
        </FieldGrid>
      </Section>

      <Section title="Account">
        <FieldGrid>
          <Field label="Login email" value={org.user?.email ?? "—"} />
          <Field label="Account status" value={org.accountStatus === "SUSPENDED" ? "Suspended" : "Active"} />
          <Field label="Date registered" value={dateRegistered} />
        </FieldGrid>
      </Section>

      <Section title="Verification documents">
        <FieldGrid>
          <DocField label="SSM Certificate" url={org.ssmCertUrl} />
          <DocField label="HRDC Training Provider Registration Certificate" url={org.hrdcDocUrl} />
        </FieldGrid>
      </Section>

      {org.adminNote ? (
        <Section title="Administrator note">
          <p className="text-sm whitespace-pre-line text-[color:var(--text)]">{org.adminNote}</p>
        </Section>
      ) : null}
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
      className={`rounded-xl border border-[color:var(--admin-search-border)] bg-[color:var(--admin-search-bg)] p-4 ${
        wide ? "md:col-span-2" : ""
      }`}
    >
      <div className="text-xs font-medium uppercase tracking-wide text-[color:var(--text-muted)]">
        {label}
      </div>
      <div
        className={`mt-2 text-sm font-medium text-[color:var(--text)] ${
          multiline ? "whitespace-pre-line" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function DocField({ label, url }: { label: string; url: string }) {
  return (
    <div className="rounded-xl border border-[color:var(--admin-search-border)] bg-[color:var(--admin-search-bg)] p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-[color:var(--text-muted)]">
        {label}
      </div>
      <div className="mt-2">
        <a
          href={apiAssetUrl(url)}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-medium text-sky-800 underline hover:text-sky-950"
        >
          View document
        </a>
      </div>
    </div>
  );
}
