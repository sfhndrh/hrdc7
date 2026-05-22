"use client";

import { useNavigate } from "react-router-dom";
import { apiFetch } from "@/lib/api";
import { useMemo, useState, type ReactNode } from "react";

import { Link } from "@/components/link";
import { ClientProfileDetailFields } from "@/components/client/client-profile-detail-fields";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-widgets";
import { PageHeaderIconBuilding } from "@/components/dashboard/page-header-icons";
import { ProfilePhotoBanner } from "@/components/profile/profile-photo-banner";
import { Button } from "@/components/ui/button";
import {
  RegisterField,
  RegisterFieldGrid,
  RegisterSection,
  registerInputClass,
} from "@/components/register/register-form-primitives";
import {
  clientDisplayName,
  describesYouDisplayLabel,
  hydrateProfileDataForEdit,
  parseProfileData,
  profileDetailsSectionTitle,
  validateProfileDetailFields,
  type ClientProfileData,
  type ClientProfileType,
} from "@/lib/client-profile";

export type CompanyProfileInitial = {
  companyName: string;
  regNumber: string;
  industry: string;
  contactName: string;
  contactEmail: string;
  email: string;
  phone: string;
  address: string;
  profileType: ClientProfileType;
  profileData: ClientProfileData;
  profilePhoto: string | null;
  profileComplete: boolean;
  createdAt: string;
  updatedAt: string;
};

function buildRowFromInitial(initial: CompanyProfileInitial) {
  return {
    companyName: initial.companyName,
    regNumber: initial.regNumber,
    industry: initial.industry,
    address: initial.address || null,
  };
}

export function CompanyProfileForm({
  initial,
  pageTitle = "Edit profile",
  backHref = "/client/profile",
  backLabel = "Back to profile",
  saveRedirectTo = "/client/profile",
  headerIcon = <PageHeaderIconBuilding />,
  afterForm,
}: {
  initial: CompanyProfileInitial;
  pageTitle?: string;
  backHref?: string;
  backLabel?: string;
  saveRedirectTo?: string;
  headerIcon?: ReactNode;
  afterForm?: ReactNode;
}) {
  const navigate = useNavigate();
  const profileType = initial.profileType;
  const row = useMemo(() => buildRowFromInitial(initial), [initial]);

  const hydratedInitial = useMemo(
    () =>
      hydrateProfileDataForEdit(
        profileType,
        row,
        parseProfileData(initial.profileData),
      ),
    [profileType, row, initial.profileData],
  );

  const [profileData, setProfileData] = useState<ClientProfileData>(hydratedInitial);
  const [fullName, setFullName] = useState(initial.contactName);
  const [contactEmail, setContactEmail] = useState(initial.contactEmail);
  const [phone, setPhone] = useState(initial.phone);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(initial.profilePhoto);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);

  const profileTypeLabel = describesYouDisplayLabel(profileData, profileType);
  const detailsTitle = profileDetailsSectionTitle(profileType);

  const bannerName = clientDisplayName(profileType, initial.companyName, fullName, profileData);
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
    const validationError = validateProfileDetailFields(profileType, profileData);
    if (validationError) {
      setError(validationError);
      setMessage(null);
      return;
    }

    setSaving(true);
    setMessage(null);
    setError(null);
    const res = await apiFetch("/api/client/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        fullName: fullName.trim(),
        contactEmail: contactEmail.trim(),
        phone: phone.trim(),
        profileType,
        profileData,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setError(j.error ?? "Could not save. Check your details and try again.");
      return;
    }
    setMessage("Profile saved.");
    navigate(saveRedirectTo, { replace: true });
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm text-[color:var(--text-muted)] hover:text-[color:var(--text)]"
        >
          <span aria-hidden>←</span> {backLabel}
        </Link>
      </div>

      <DashboardPageHeader title={pageTitle} icon={headerIcon} />

      <ProfilePhotoBanner
        name={bannerName}
        role={profileTypeLabel}
        initialPhoto={profilePhoto}
        fallback={bannerFallback}
        uploadEndpoint="/api/uploads/client-profile-photo"
        saveEndpoint="/api/client/profile-photo"
        onPhotoUpdated={(url) => setProfilePhoto(url)}
      />

      <form onSubmit={onSubmit} className="space-y-6">
        <RegisterSection title="Basic account">
          <RegisterFieldGrid>
            <RegisterField label="Profile type" htmlFor="edit-profile-type">
              <div
                id="edit-profile-type"
                className="flex h-10 items-center rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)]/60 px-3 text-sm text-[color:var(--text)]"
                aria-readonly="true"
              >
                {profileTypeLabel}
              </div>
            </RegisterField>
            <RegisterField label="Date registered">
              <div className="flex h-10 items-center text-sm font-medium text-[color:var(--text)]">
                {dateRegistered}
              </div>
            </RegisterField>
            <RegisterField label="Full name" htmlFor="fullName" required>
              <input
                id="fullName"
                required
                minLength={2}
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={registerInputClass}
              />
            </RegisterField>
            <RegisterField label="Email" htmlFor="login-email">
              <div
                id="login-email"
                className="flex h-10 items-center text-sm text-[color:var(--text-muted)]"
              >
                {initial.email}
              </div>
            </RegisterField>
            <RegisterField label="Contact email" htmlFor="contactEmail" required>
              <input
                id="contactEmail"
                type="email"
                required
                autoComplete="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className={registerInputClass}
              />
            </RegisterField>
            <RegisterField label="Phone number" htmlFor="phone" required>
              <input
                id="phone"
                required
                minLength={5}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={registerInputClass}
              />
            </RegisterField>
          </RegisterFieldGrid>
        </RegisterSection>

        <RegisterSection title={detailsTitle}>
          <ClientProfileDetailFields
            profileType={profileType}
            profileData={profileData}
            onChange={setProfileData}
            idPrefix="edit"
          />
        </RegisterSection>

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
            disabled={saving}
            onClick={() => setDiscardConfirmOpen(true)}
          >
            Discard changes
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>

      {discardConfirmOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="presentation"
          onClick={() => setDiscardConfirmOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="discard-changes-title"
            className="w-full max-w-md rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              id="discard-changes-title"
              className="text-lg font-semibold text-[color:var(--text)]"
            >
              Discard changes?
            </h3>
            <p className="mt-2 text-sm text-[color:var(--text-muted)]">
              Any edits you made on this page will be lost. You will return to your profile without
              saving.
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDiscardConfirmOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setDiscardConfirmOpen(false);
                  navigate(saveRedirectTo, { replace: true });
                }}
              >
                Yes, discard
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {afterForm}
    </div>
  );
}
