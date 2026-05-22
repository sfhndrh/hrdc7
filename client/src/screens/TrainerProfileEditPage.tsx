"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Link } from "@/components/link";
import { Navigate } from "react-router-dom";

import {
  FormDeliveryModeCheckboxes,
  FormTagList,
  FormTravelWillingBlock,
} from "@/components/register/trainer-field-widgets";
import { TrainerPageHeader } from "@/components/dashboard/trainer-page-header";
import { TrainerNavIconProfile } from "@/components/dashboard/trainer-sidebar-icons";
import { ProfilePhotoBanner } from "@/components/profile/profile-photo-banner";
import { useAuth } from "@/auth/AuthProvider";

type TrainerMe = {
  fullName: string;
  phone: string;
  yearsExp: number;
  linkedIn: string | null;
  portfolioUrl: string | null;
  bio: string;
  stateOrLocation: string | null;
  languages: string | null;
  expertise: string[];
  deliveryModes: string[];
  willingToTravel: string | null;
  travelLocations: string[];
  profilePhoto: string | null;
};

export default function TrainerProfileEditPage() {
  const { user, loading: authLoading } = useAuth();
  const [trainer, setTrainer] = useState<TrainerMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  const isAdminViewer = user?.role === "ADMIN";

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    if (isAdminViewer) {
      setTrainer(null);
      setLoading(false);
      return;
    }
    void apiFetch("/api/trainer/me", { credentials: "include" })
      .then((r) => r.json())
      .then((d: { trainer: TrainerMe | null }) => {
        setTrainer(d.trainer);
        setProfilePhoto(d.trainer?.profilePhoto ?? null);
      })
      .finally(() => setLoading(false));
  }, [user, authLoading, isAdminViewer]);

  if (authLoading || loading) {
    return (
      <div className="p-6 text-sm text-[color:var(--text-muted)]">Loading…</div>
    );
  }

  if (!user) {
    return <Navigate to="/login?from=/trainer/profile/edit" replace />;
  }

  if (user.role !== "TRAINER" && user.role !== "ADMIN") {
    return <Navigate to="/" replace />;
  }

  if (!isAdminViewer && !trainer) {
    return <Navigate to="/trainer/dashboard" replace />;
  }

  const fullName = isAdminViewer ? "Trainer (Admin preview)" : trainer!.fullName;
  const phone = isAdminViewer ? "" : trainer!.phone;
  const yearsExp = isAdminViewer ? "" : String(trainer!.yearsExp);
  const linkedIn = isAdminViewer ? "" : trainer!.linkedIn ?? "";
  const portfolioUrl = isAdminViewer ? "" : trainer!.portfolioUrl ?? "";
  const bio = isAdminViewer ? "" : trainer!.bio;
  const stateOrLocation = isAdminViewer ? "" : trainer!.stateOrLocation ?? "";
  const languages = isAdminViewer ? "" : trainer!.languages ?? "";

  const initialExpertise = trainer?.expertise ?? [];
  const initialDeliveryModes = trainer?.deliveryModes ?? [];
  const rawWilling = trainer?.willingToTravel;
  const initialWilling: "Yes" | "No" | "" =
    rawWilling === "Yes" || rawWilling === "No" ? rawWilling : "";
  const initialTravelLocations = trainer?.travelLocations ?? [];

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isAdminViewer) return;
    const fd = new FormData(e.currentTarget);
    const payload = {
      fullName: String(fd.get("fullName") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      yearsExp: fd.get("yearsExp"),
      expertise: fd.getAll("expertise").map(String).filter(Boolean),
      bio: String(fd.get("bio") ?? ""),
      linkedIn: fd.get("linkedIn"),
      portfolioUrl: fd.get("portfolioUrl"),
      stateOrLocation: fd.get("stateOrLocation"),
      languages: fd.get("languages"),
      deliveryModes: fd.getAll("deliveryModes").map(String).filter(Boolean),
      willingToTravel: fd.get("willingToTravel") ?? "",
      travelLocations: fd.getAll("travelLocations").map(String).filter(Boolean),
      redirectTo: "/trainer/profile",
    };

    const res = await apiFetch("/api/trainer/profile", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      window.alert("Could not save your profile. Check the form and try again.");
      return;
    }

    const j = (await res.json()) as { redirectTo?: string };
    window.location.href = j.redirectTo ?? "/trainer/profile?saved=1";
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <Link
          href="/trainer/profile"
          className="inline-flex items-center gap-1 text-sm text-[color:var(--text-muted)] hover:text-[color:var(--text)]"
        >
          <span aria-hidden>←</span> Back to profile
        </Link>
      </div>

      <TrainerPageHeader
        title="Edit profile"
        icon={<TrainerNavIconProfile />}
        description="Changes will send your profile back for review."
      />

      {!isAdminViewer ? (
        <ProfilePhotoBanner
          name={fullName || "Trainer"}
          role="Trainer"
          initialPhoto={profilePhoto}
          fallback={trainerInitials(fullName)}
          uploadEndpoint="/api/uploads/trainer-profile-photo"
          saveEndpoint="/api/trainer/profile-photo"
          onPhotoUpdated={(url) => setProfilePhoto(url)}
        />
      ) : null}

      <form
        onSubmit={(ev) => void onSubmit(ev)}
        className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm"
      >
        <input type="hidden" name="redirectTo" value="/trainer/profile" />

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Full name">
            <input
              name="fullName"
              defaultValue={fullName}
              className="h-10 w-full rounded-md border border-[color:var(--border)] px-3 text-sm"
              placeholder="Your full name"
              required
              maxLength={120}
              disabled={isAdminViewer}
            />
          </Field>

          <Field label="Phone number">
            <input
              name="phone"
              defaultValue={phone}
              className="h-10 w-full rounded-md border border-[color:var(--border)] px-3 text-sm"
              placeholder="+60..."
              required
              maxLength={40}
              disabled={isAdminViewer}
            />
          </Field>

          <Field label="State / location" hint="Optional">
            <input
              name="stateOrLocation"
              defaultValue={stateOrLocation}
              className="h-10 w-full rounded-md border border-[color:var(--border)] px-3 text-sm"
              placeholder="e.g. Selangor, Kuala Lumpur"
              maxLength={200}
              disabled={isAdminViewer}
            />
          </Field>

          <Field label="Languages" hint="Optional">
            <input
              name="languages"
              defaultValue={languages}
              className="h-10 w-full rounded-md border border-[color:var(--border)] px-3 text-sm"
              placeholder="e.g. English, Bahasa Melayu"
              maxLength={500}
              disabled={isAdminViewer}
            />
          </Field>

          <Field label="Years of experience">
            <input
              name="yearsExp"
              defaultValue={yearsExp}
              type="number"
              min={0}
              max={80}
              className="h-10 w-full rounded-md border border-[color:var(--border)] px-3 text-sm"
              placeholder="0"
              required
              disabled={isAdminViewer}
            />
          </Field>

          <Field label="Training expertise" wide>
            <FormTagList
              name="expertise"
              initialTags={initialExpertise}
              disabled={isAdminViewer}
            />
          </Field>

          <Field label="Training delivery mode" wide>
            <p className="mb-2 text-xs text-[color:var(--text-muted)]">Select all that apply.</p>
            <FormDeliveryModeCheckboxes
              initialModes={initialDeliveryModes}
              disabled={isAdminViewer}
            />
          </Field>

          <Field label="Willing to travel" wide>
            <FormTravelWillingBlock
              initialWilling={initialWilling}
              initialLocations={initialTravelLocations}
              disabled={isAdminViewer}
            />
          </Field>

          <Field label="LinkedIn profile" hint="Optional">
            <input
              name="linkedIn"
              defaultValue={linkedIn}
              className="h-10 w-full rounded-md border border-[color:var(--border)] px-3 text-sm"
              placeholder="https://linkedin.com/in/..."
              disabled={isAdminViewer}
            />
          </Field>

          <Field label="Website / portfolio URL" hint="Optional">
            <input
              name="portfolioUrl"
              defaultValue={portfolioUrl}
              className="h-10 w-full rounded-md border border-[color:var(--border)] px-3 text-sm"
              placeholder="https://..."
              disabled={isAdminViewer}
            />
          </Field>

          <Field label="Bio" wide>
            <textarea
              name="bio"
              defaultValue={bio}
              className="min-h-40 w-full rounded-md border border-[color:var(--border)] p-3 text-sm leading-6"
              placeholder="Describe your background, achievements, and training style..."
              required
              maxLength={5000}
              disabled={isAdminViewer}
            />
          </Field>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
          <Link
            href="/trainer/profile"
            className="inline-flex h-10 items-center justify-center rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] px-4 text-sm font-medium text-[color:var(--text)] hover:bg-[color:var(--surface-muted)]"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center rounded-md bg-[color:var(--primary)] px-4 text-sm font-semibold text-[color:var(--primary-foreground)] hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isAdminViewer}
          >
            Save changes
          </button>
        </div>

        {isAdminViewer ? (
          <div className="mt-4 text-xs text-[color:var(--text-muted)]">
            Admin preview mode: editing is disabled.
          </div>
        ) : null}
      </form>
    </div>
  );
}

function trainerInitials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter((p) => /^[A-Za-z]/.test(p))
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "T"
  );
}

function Field({
  label,
  hint,
  wide,
  children,
}: {
  label: string;
  hint?: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-1 ${wide ? "md:col-span-2" : ""}`}>
      <div className="flex items-baseline justify-between gap-3">
        <label className="text-sm font-medium text-[color:var(--text)]">{label}</label>
        {hint ? <span className="text-xs text-[color:var(--text-muted)]">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}
