"use client";

import { useNavigate } from "react-router-dom";
import { apiFetch } from "@/lib/api";
import { useState } from "react";

import { Link } from "@/components/link";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-widgets";
import { PageHeaderIconBuilding } from "@/components/dashboard/page-header-icons";
import { ProfilePhotoBanner } from "@/components/profile/profile-photo-banner";
import { Button } from "@/components/ui/button";

export type CompanyProfileInitial = {
  companyName: string;
  regNumber: string;
  industry: string;
  contactName: string;
  contactEmail: string;
  email: string;
  phone: string;
  address: string;
  profilePhoto: string | null;
  profileComplete: boolean;
  createdAt: string;
  updatedAt: string;
};

export function CompanyProfileForm({ initial }: { initial: CompanyProfileInitial }) {
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState(initial.companyName);
  const [regNumber, setRegNumber] = useState(initial.regNumber);
  const [industry, setIndustry] = useState(initial.industry);
  const [contactName, setContactName] = useState(initial.contactName);
  const [contactEmail, setContactEmail] = useState(initial.contactEmail);
  const [phone, setPhone] = useState(initial.phone);
  const [address, setAddress] = useState(initial.address);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(initial.profilePhoto);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const bannerName = companyName.trim() || "Your company";
  const bannerFallback =
    bannerName
      .split(/\s+/)
      .filter((p) => /^[A-Za-z0-9]/.test(p))
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "C";

  const dateRegistered = new Date(initial.createdAt).toLocaleDateString("en-MY", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    const res = await apiFetch("/api/client/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        companyName,
        regNumber,
        industry,
        contactName,
        contactEmail,
        phone,
        address: address.trim() || null,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setError("Could not save. Check your details and try again.");
      return;
    }
    setMessage("Profile saved.");
    navigate("/client/profile", { replace: true });
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/client/profile"
          className="inline-flex items-center gap-1 text-sm text-[color:var(--text-muted)] hover:text-[color:var(--text)]"
        >
          <span aria-hidden>←</span> Back to profile
        </Link>
      </div>

      <DashboardPageHeader title="Edit profile" icon={<PageHeaderIconBuilding />} />

      <ProfilePhotoBanner
        name={bannerName}
        role="Company"
        initialPhoto={profilePhoto}
        fallback={bannerFallback}
        uploadEndpoint="/api/uploads/client-profile-photo"
        saveEndpoint="/api/client/profile-photo"
        onPhotoUpdated={(url) => setProfilePhoto(url)}
      />

      <form onSubmit={onSubmit} className="space-y-6">
        <Section title="Company information">
          <FieldGrid>
            <CompanyField label="Company name" htmlFor="companyName">
              <input
                id="companyName"
                required
                minLength={2}
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="mt-2 h-10 w-full rounded-md border border-sky-200/80 bg-white px-3 text-sm text-[color:var(--text)]"
              />
            </CompanyField>
            <CompanyField label="Industry" htmlFor="industry">
              <input
                id="industry"
                required
                minLength={2}
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="mt-2 h-10 w-full rounded-md border border-sky-200/80 bg-white px-3 text-sm text-[color:var(--text)]"
              />
            </CompanyField>
            <CompanyField label="Date Registered" htmlFor="dateRegistered">
              <div
                id="dateRegistered"
                className="mt-2 text-sm font-medium text-[color:var(--text)]"
              >
                {dateRegistered}
              </div>
            </CompanyField>
          </FieldGrid>
        </Section>

        <Section title="Contact & account">
          <FieldGrid>
            <CompanyField label="Contact email" htmlFor="contactEmail">
              <input
                id="contactEmail"
                type="email"
                required
                autoComplete="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="mt-2 h-10 w-full rounded-md border border-sky-200/80 bg-white px-3 text-sm text-[color:var(--text)]"
              />
            </CompanyField>
            <CompanyField label="Phone number" htmlFor="phone">
              <input
                id="phone"
                required
                minLength={5}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-2 h-10 w-full rounded-md border border-sky-200/80 bg-white px-3 text-sm text-[color:var(--text)]"
              />
            </CompanyField>
            <CompanyField label="Business address" htmlFor="address" wide>
              <textarea
                id="address"
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street, city, state, postcode"
                className="mt-2 w-full rounded-md border border-sky-200/80 bg-white px-3 py-2 text-sm text-[color:var(--text)] placeholder:text-[color:var(--text-muted)]"
              />
            </CompanyField>
          </FieldGrid>
        </Section>

        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}
        {message ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {message}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            variant="outline"
            type="button"
            onClick={() => {
              setCompanyName(initial.companyName);
              setRegNumber(initial.regNumber);
              setIndustry(initial.industry);
              setContactName(initial.contactName);
              setContactEmail(initial.contactEmail);
              setPhone(initial.phone);
              setAddress(initial.address);
              setMessage(null);
              setError(null);
            }}
          >
            Discard changes
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[color:var(--border)] bg-white p-6 shadow-sm">
      <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function FieldGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2">{children}</div>;
}

function CompanyField({
  label,
  htmlFor,
  children,
  wide,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border border-sky-100 bg-sky-50/70 p-4 ${
        wide ? "md:col-span-2" : ""
      }`}
    >
      <label
        htmlFor={htmlFor}
        className="text-xs font-medium uppercase tracking-wide text-[color:var(--text-muted)]"
      >
        {label}
      </label>
      <div className="mt-0">{children}</div>
    </div>
  );
}

