"use client";

import { type ReactNode } from "react";
import { ButtonLink } from "@/components/ui/button";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-widgets";
import { ProfilePhotoCircle } from "@/components/profile/profile-photo-circle";
import {
  clientDisplayName,
  parseProfileData,
  profileDisplayRows,
  profileTypeLabel,
  type ClientProfileData,
  type ClientProfileType,
} from "@/lib/client-profile";

export type CompanyProfileViewClient = {
  companyName: string;
  regNumber: string;
  industry: string;
  contactName: string;
  contactEmail: string | null;
  phone: string;
  address: string | null;
  profilePhoto: string | null;
  profileType?: string | null;
  profileData?: ClientProfileData | unknown;
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
  const profileType = (client.profileType ?? "COMPANY") as ClientProfileType;
  const profileData = parseProfileData(client.profileData);
  const displayName = clientDisplayName(
    profileType,
    client.companyName,
    client.contactName,
    profileData,
  );
  const initials = displayName
    .split(/\s+/)
    .filter((part) => /^[A-Za-z0-9]/.test(part))
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  const sections = profileDisplayRows(profileType, {
    companyName: client.companyName,
    regNumber: client.regNumber,
    industry: client.industry,
    contactName: client.contactName,
    contactEmail: client.contactEmail,
    phone: client.phone,
    address: client.address,
    userEmail: client.user.email,
  }, profileData);

  const dateRegistered = new Date(client.createdAt).toLocaleDateString("en-MY", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      <DashboardPageHeader title={title} icon={icon} />

      <div className="flex flex-col gap-5 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <ProfilePhotoCircle
            photoUrl={client.profilePhoto}
            fallback={initials || "C"}
            alt={displayName}
          />
          <div className="min-w-0">
            <h1 className="text-2xl font-bold leading-tight text-[color:var(--text)]">
              {displayName}
            </h1>
            <div className="mt-1 text-sm text-[color:var(--text-muted)]">
              {profileTypeLabel(profileType)}
            </div>
          </div>
        </div>

        <div className="shrink-0">
          <ButtonLink size="sm" variant="outline" href={editHref}>
            Edit profile
          </ButtonLink>
        </div>
      </div>

      {sections.map((section) => (
        <Section key={section.title} title={section.title}>
          <FieldGrid>
            {section.rows.map((row) => (
              <Field
                key={row.label}
                label={row.label}
                value={row.value}
                wide={row.wide}
                multiline={row.multiline}
              />
            ))}
            {section.title === "Account" ? (
              <Field label="Date registered" value={dateRegistered} />
            ) : null}
          </FieldGrid>
        </Section>
      ))}

      {footer}
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
