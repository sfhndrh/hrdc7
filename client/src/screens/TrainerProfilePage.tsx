"use client";

import { useEffect, useState, type ReactNode } from "react";
import { apiFetch } from "@/lib/api";
import { Navigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { TrainerPageHeader } from "@/components/dashboard/trainer-page-header";
import { TrainerNavIconProfile } from "@/components/dashboard/trainer-sidebar-icons";
import { ProfilePhotoCircle } from "@/components/profile/profile-photo-circle";
import { useAuth } from "@/auth/AuthProvider";

function trainerIsApproved(status: string) {
  return String(status).toUpperCase() === "APPROVED";
}

type TrainerRow = {
  fullName: string;
  profilePhoto: string | null;
  phone: string;
  bio: string;
  expertise: string[];
  yearsExp: number;
  linkedIn: string | null;
  portfolioUrl: string | null;
  certFileUrl: string;
  stateOrLocation: string | null;
  languages: string | null;
  deliveryModes: string[];
  willingToTravel: string | null;
  travelLocations: string[];
  status: string;
  aiVerification: {
    validCert: boolean;
    certNumber: string | null;
    issueDate: string | null;
    expiryDate: string | null;
  } | null;
};

export default function TrainerProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const [trainer, setTrainer] = useState<TrainerRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    if (user.role === "ADMIN") {
      setTrainer(null);
      setLoading(false);
      return;
    }
    void apiFetch("/api/trainer/me", { credentials: "include" })
      .then((r) => r.json())
      .then((d: { trainer: TrainerRow | null }) => setTrainer(d.trainer))
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  if (authLoading || loading) {
    return <div className="p-6 text-sm text-[color:var(--text-muted)]">Loading…</div>;
  }

  if (!user) return <Navigate to="/login?from=/trainer/profile" replace />;
  if (user.role !== "TRAINER" && user.role !== "ADMIN") return <Navigate to="/" replace />;

  const isAdminViewer = user.role === "ADMIN";
  if (!isAdminViewer && !trainer) return <Navigate to="/trainer/dashboard" replace />;

  const fullName = isAdminViewer ? "Trainer (Admin preview)" : trainer!.fullName;
  const initials = fullName
    .split(" ")
    .filter((part) => /^[A-Za-z]/.test(part))
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  const approved = isAdminViewer ? true : trainerIsApproved(trainer!.status);
  const statusBadge: { tone: "gray" | "yellow"; text: string } | null = isAdminViewer
    ? { tone: "gray", text: "Admin preview" }
    : approved
      ? null
      : { tone: "yellow", text: "Awaiting verification" };

  const ai = isAdminViewer ? null : trainer!.aiVerification;
  const certificateId = ai?.certNumber?.trim() || "—";
  const certPeriod =
    ai?.issueDate?.trim() || ai?.expiryDate?.trim()
      ? `${ai?.issueDate?.trim() || "—"} → ${ai?.expiryDate?.trim() || "—"}`
      : "—";

  return (
    <div className="space-y-6 p-6">
      <TrainerPageHeader title="Profile" icon={<TrainerNavIconProfile />} />

      <div className="flex flex-col gap-5 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <ProfilePhotoCircle
            photoUrl={isAdminViewer ? null : trainer!.profilePhoto}
            fallback={initials || "T"}
            alt={fullName}
          />
          <div className="min-w-0">
            <h1 className="text-2xl font-bold leading-tight text-[color:var(--text)]">{fullName}</h1>
            <div className="mt-1 text-sm text-[color:var(--text-muted)]">Trainer</div>
          </div>
        </div>

        <div className="shrink-0">
          <div className="flex flex-col items-end gap-2">
            {statusBadge ? <Badge tone={statusBadge.tone}>{statusBadge.text}</Badge> : null}
            <div className="flex items-center gap-2">
              <ButtonLink size="sm" variant="outline" href="/trainer/profile/edit">
                Edit profile
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>

      <Section title="Personal info">
        <FieldGrid>
          <Field label="Full name" value={fullName} />
          <Field label="Email address" value={user.email ?? "—"} />
          <Field label="Phone number" value={isAdminViewer ? "—" : trainer!.phone} />
          <Field
            label="State / location"
            value={isAdminViewer ? "—" : trainer!.stateOrLocation?.trim() || "—"}
          />
          <Field label="Languages" value={isAdminViewer ? "—" : trainer!.languages?.trim() || "—"} />
        </FieldGrid>
      </Section>

      <Section title="Professional background">
        <FieldGrid>
          <Field label="Years of experience" value={isAdminViewer ? "—" : `${trainer!.yearsExp} years`} />
          <Field label="Training expertise" value={isAdminViewer ? "—" : trainer!.expertise.join(", ")} />
          <Field
            label="Training delivery mode"
            value={
              isAdminViewer
                ? "—"
                : trainer!.deliveryModes?.length
                  ? trainer!.deliveryModes.join(", ")
                  : "—"
            }
          />
          <Field
            label="Willing to travel"
            value={
              isAdminViewer
                ? "—"
                : trainer!.willingToTravel === "Yes"
                  ? `Yes — ${trainer!.travelLocations?.length ? trainer!.travelLocations.join(", ") : "—"}`
                  : trainer!.willingToTravel === "No"
                    ? "No"
                    : "—"
            }
          />
          <Field label="LinkedIn profile" value={isAdminViewer ? "—" : trainer!.linkedIn ?? "—"} />
          <Field label="Website / portfolio URL" value={isAdminViewer ? "—" : trainer!.portfolioUrl ?? "—"} />
          <Field label="Professional bio" value={isAdminViewer ? "—" : trainer!.bio} wide multiline />
        </FieldGrid>
      </Section>

      <Section title="HRDC certification">
        <FieldGrid>
          <Field label="Certificate ID">
            <div className="break-all font-mono text-sm font-medium text-[color:var(--text)]">
              {certificateId}
            </div>
          </Field>
          <Field label="Cert validity period" value={certPeriod} />
          <Field label="HRDC cert file" wide>
            {isAdminViewer ? (
              <div className="text-sm font-medium text-[color:var(--text)]">—</div>
            ) : (
              <ButtonLink size="sm" variant="outline" href="/trainer/certificate">
                <DocIcon className="h-4 w-4" />
                Open certificate
              </ButtonLink>
            )}
          </Field>
        </FieldGrid>
      </Section>

      <Section title="Portfolio & social proof">
        <FieldGrid>
          <Field label="LinkedIn profile" value={isAdminViewer ? "—" : trainer!.linkedIn ?? "—"} />
          <Field label="Website / portfolio URL" value={isAdminViewer ? "—" : trainer!.portfolioUrl ?? "—"} />
        </FieldGrid>
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm">
      <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">{title}</h2>
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
  children,
  wide,
  multiline,
}: {
  label: string;
  value?: string;
  children?: ReactNode;
  wide?: boolean;
  multiline?: boolean;
}) {
  const body = children ?? (
    <div className={`text-sm font-medium text-[color:var(--text)] ${multiline ? "leading-6" : ""}`}>{value}</div>
  );
  return (
    <div
      className={`rounded-xl border border-[color:var(--admin-search-border)] bg-[color:var(--admin-search-bg)] p-4 ${wide ? "md:col-span-2" : ""}`}
    >
      <div className="text-xs font-medium uppercase tracking-wide text-[color:var(--text-muted)]">{label}</div>
      <div className="mt-2">{body}</div>
    </div>
  );
}

function DocIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M9 13h6" />
      <path d="M9 17h6" />
    </svg>
  );
}

