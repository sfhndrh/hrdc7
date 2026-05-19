"use client";

import { type ReactNode } from "react";
import { ButtonLink } from "@/components/ui/button";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-widgets";
import { ProfilePhotoCircle } from "@/components/profile/profile-photo-circle";

export type CompanyProfileViewClient = {
  companyName: string;
  regNumber: string;
  industry: string;
  contactName: string;
  contactEmail: string | null;
  phone: string;
  address: string | null;
  profilePhoto: string | null;
  createdAt: string;
  user: { email: string };
};

export function CompanyProfileView({
  client,
  title,
  icon,
  editHref = "/client/profile/edit",
  footer,
}: {
  client: CompanyProfileViewClient;
  title: string;
  icon: ReactNode;
  editHref?: string;
  footer?: ReactNode;
}) {
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
      <DashboardPageHeader title={title} icon={icon} />

      <div className="flex flex-col gap-5 rounded-2xl border border-[color:var(--border)] bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <ProfilePhotoCircle
            photoUrl={client.profilePhoto}
            fallback={initials || "C"}
            alt={companyName}
          />
          <div className="min-w-0">
            <h1 className="text-2xl font-bold leading-tight text-[color:var(--text)]">
              {companyName}
            </h1>
            <div className="mt-1 text-sm text-[color:var(--text-muted)]">Company</div>
          </div>
        </div>

        <div className="shrink-0">
          <ButtonLink size="sm" variant="outline" href={editHref}>
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

      {footer}
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


