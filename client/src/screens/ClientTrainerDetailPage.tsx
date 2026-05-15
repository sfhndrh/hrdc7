"use client";

import { useEffect, useState } from "react";
import { apiAssetUrl, apiFetch } from "@/lib/api";
import { Navigate, useNavigate, useParams } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-widgets";
import { PageHeaderIconUser } from "@/components/dashboard/page-header-icons";
import { useAuth } from "@/auth/AuthProvider";

type TrainerDetail = {
  id: string;
  fullName: string;
  title: string;
  location: string;
  languages: string;
  email: string;
  phone: string;
  yearsExp: number;
  expertise: string[];
  deliveryModes: string;
  bio: string;
  certFileUrl: string;
  linkedIn: string;
  websiteUrl: string;
  profilePhoto: string | null;
};

type ApiTrainer = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  bio: string | null;
  expertise: string[];
  yearsExp: number;
  linkedIn: string | null;
  portfolioUrl: string | null;
  profilePhoto: string | null;
  stateOrLocation: string | null;
  languages: string | null;
  deliveryModes: string[];
  willingToTravel: string | null;
  travelLocations: string[];
  certFileUrl: string;
  approvedAt: string | null;
  createdAt: string;
};

function fromApi(t: ApiTrainer): TrainerDetail {
  const title = t.expertise.slice(0, 3).join(", ") || "Certified trainer";
  const deliveryModes = t.deliveryModes.join(", ");
  return {
    id: t.id,
    fullName: t.fullName,
    title,
    location: t.stateOrLocation ?? "",
    languages: t.languages ?? "",
    email: t.email,
    phone: t.phone,
    yearsExp: t.yearsExp,
    expertise: t.expertise,
    deliveryModes,
    bio: t.bio ?? "",
    certFileUrl: t.certFileUrl,
    linkedIn: t.linkedIn ?? "",
    websiteUrl: t.portfolioUrl ?? "",
    profilePhoto: t.profilePhoto,
  };
}

export default function TrainerDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [subscribed, setSubscribed] = useState(false);
  const [trainer, setTrainer] = useState<TrainerDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void apiFetch("/api/client/me", { credentials: "include" })
      .then((r) => r.json())
      .then(
        (d: {
          client?: {
            subscription?: { status: string; expiresAt: string | null } | null;
          } | null;
        }) => {
          const sub = d.client?.subscription;
          const active =
            sub?.status === "ACTIVE" &&
            (!sub.expiresAt || new Date(sub.expiresAt) > new Date());
          setSubscribed(!!active);
        },
      );
  }, []);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    void apiFetch(`/api/client/trainers/${encodeURIComponent(id)}`, {
      credentials: "include",
    })
      .then(async (r) => {
        if (r.status === 404) {
          setNotFound(true);
          return null;
        }
        if (!r.ok) throw new Error(`Request failed (${r.status})`);
        return (await r.json()) as { trainer: ApiTrainer };
      })
      .then((d) => {
        if (d?.trainer) setTrainer(fromApi(d.trainer));
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (!id) return null;
  if (notFound) return <Navigate to="/client/trainers" replace />;
  if (loading || !trainer) {
    return (
      <div className="rounded-2xl border border-[color:var(--border)] bg-white p-8 text-center text-sm text-[color:var(--text-muted)] shadow-sm">
        Loading trainer profile…
      </div>
    );
  }

  const certFileLabel = trainer.certFileUrl
    ? trainer.certFileUrl.split("/").pop() ?? "HRDC certificate"
    : "HRDC certificate";

  const isAdmin = user?.role === "ADMIN";
  const unlockContent = isAdmin || subscribed;

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Trainer Details" icon={<PageHeaderIconUser />} />

      <ProfileHeader
        trainer={trainer}
        unlockContent={unlockContent}
        subscribed={subscribed}
        isAdmin={isAdmin}
      />

      <StatsStrip locked={!unlockContent} />

      <Section title="Personal info">
        <FieldGrid>
          <Field label="Full name" value={trainer.fullName} locked={!unlockContent} />
          <Field label="Email address" value={trainer.email} locked={!unlockContent} />
          <Field label="Phone number" value={trainer.phone} locked={!unlockContent} />
          <Field label="State / location" value={trainer.location || "—"} locked={!unlockContent} />
          <Field label="Languages" value={trainer.languages || "—"} locked={!unlockContent} />
        </FieldGrid>
      </Section>

      <Section title="Professional background">
        <FieldGrid>
          <Field
            label="Years of experience"
            value={`${trainer.yearsExp} years`}
            locked={!unlockContent}
          />
          <Field
            label="Training expertise"
            value={trainer.expertise.join(", ") || "—"}
            locked={!unlockContent}
          />
          <Field
            label="Training delivery mode"
            value={trainer.deliveryModes || "—"}
            locked={!unlockContent}
          />
          <Field
            label="Professional bio"
            value={trainer.bio || "—"}
            locked={!unlockContent}
            wide
            multiline
          />
        </FieldGrid>
      </Section>

      <Section title="HRDC certification">
        <FieldGrid>
          <Field label="HRDC cert file" locked={!unlockContent}>
            <a
              href={trainer.certFileUrl || "#"}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-[color:var(--border)] bg-white px-3 py-1.5 text-sm font-medium text-[color:var(--text)] hover:bg-[color:var(--surface-muted)]"
            >
              <DocIcon className="h-4 w-4" />
              {certFileLabel}
            </a>
          </Field>
        </FieldGrid>
      </Section>

      <Section title="Portfolio & social proof">
        <FieldGrid>
          <Field
            label="LinkedIn profile"
            value={trainer.linkedIn || "—"}
            locked={!unlockContent}
          />
          <Field
            label="Website / portfolio URL"
            value={trainer.websiteUrl || "—"}
            locked={!unlockContent}
          />
        </FieldGrid>
      </Section>

      {!subscribed && !isAdmin ? <SubscribeCallout /> : null}
    </div>
  );
}

function ProfileHeader({
  trainer,
  unlockContent,
  subscribed,
  isAdmin,
}: {
  trainer: TrainerDetail;
  unlockContent: boolean;
  subscribed: boolean;
  isAdmin: boolean;
}) {
  const navigate = useNavigate();
  const initials = trainer.fullName
    .split(" ")
    .filter((part) => /^[A-Za-z]/.test(part))
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-[color:var(--border)] bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
      <div className="flex items-start gap-4">
        <div
          className={`shrink-0 ${!unlockContent ? "select-none blur-sm pointer-events-none" : ""}`}
          aria-hidden={!unlockContent ? true : undefined}
        >
          {trainer.profilePhoto ? (
            <img
              src={apiAssetUrl(trainer.profilePhoto)}
              alt=""
              className="h-16 w-16 rounded-full border border-[color:var(--border)] bg-white object-cover"
            />
          ) : (
            <div className="grid h-16 w-16 place-items-center rounded-full bg-sky-100 text-lg font-semibold text-sky-700">
              {initials || "T"}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <div
            className={unlockContent ? "" : "select-none blur-sm pointer-events-none"}
            aria-hidden={!unlockContent ? true : undefined}
          >
            <h1 className="text-2xl font-bold leading-tight text-[color:var(--text)]">
              {trainer.fullName}
            </h1>
            <div className="mt-1 text-sm text-[color:var(--text-muted)]">{trainer.title}</div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {trainer.location ? <Pill tone="white">{trainer.location}</Pill> : null}
              <Pill tone="white">{trainer.yearsExp} years experience</Pill>
            </div>
          </div>
          {!unlockContent ? (
            <div className="-mt-1 flex flex-wrap items-center gap-2 pt-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">
                <LockIcon className="h-3 w-3" />
                Subscribe to view name and highlights
              </span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="shrink-0">
        {isAdmin ? (
          <Badge tone="gray">Admin preview</Badge>
        ) : subscribed ? (
          <Button
            size="sm"
            variant="outline"
            type="button"
            onClick={() =>
              navigate("/client/messages", {
                state: {
                  startTrainer: {
                    id: trainer.id,
                    name: trainer.fullName,
                    title: trainer.title,
                  },
                },
              })
            }
          >
            Message trainer
          </Button>
        ) : (
          <div className="flex flex-col items-end gap-2">
            <Badge tone="yellow">Free tier — limited details</Badge>
            <ButtonLink size="sm" href="/client/subscription">
              Subscribe to unlock
            </ButtonLink>
          </div>
        )}
      </div>
    </div>
  );
}

function StatsStrip({ locked }: { locked?: boolean }) {
  return (
    <div className="relative">
      <div
        className={`grid grid-cols-2 gap-3 sm:grid-cols-4 ${
          locked ? "select-none blur-sm pointer-events-none" : ""
        }`}
        aria-hidden={locked ? true : undefined}
      >
        <StatTile label="Companies hired" value="—" />
        <StatTile label="Avg rating" value="—" />
        <StatTile label="Pax trained" value="—" />
        <StatTile label="Repeat clients" value="—" />
      </div>
      {locked ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-100/95 px-3 py-1 text-xs font-medium text-amber-800 shadow-sm">
            <LockIcon className="h-3.5 w-3.5" />
            Subscribe to view performance stats
          </span>
        </div>
      ) : null}
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[color:var(--border)] bg-white p-4 shadow-sm">
      <div className="text-xl font-semibold text-[color:var(--text)]">{value}</div>
      <div className="mt-0.5 text-xs text-[color:var(--text-muted)]">{label}</div>
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

function Field({
  label,
  value,
  children,
  locked,
  wide,
  multiline,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
  locked?: boolean;
  wide?: boolean;
  multiline?: boolean;
}) {
  const body = children ?? (
    <div
      className={`text-sm font-medium text-[color:var(--text)] ${
        multiline ? "leading-6 whitespace-pre-line" : ""
      }`}
    >
      {value}
    </div>
  );

  return (
    <div
      className={`rounded-xl border border-sky-100 bg-sky-50/70 p-4 ${
        wide ? "md:col-span-2" : ""
      }`}
    >
      <div className="flex items-center gap-2">
        <div className="text-xs font-medium uppercase tracking-wide text-[color:var(--text-muted)]">
          {label}
        </div>
        {locked ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">
            <LockIcon className="h-3 w-3" />
            Subscribe to view
          </span>
        ) : null}
      </div>
      <div
        className={`mt-2 ${
          locked ? "select-none blur-sm pointer-events-none" : ""
        }`}
        aria-hidden={locked ? true : undefined}
      >
        {body}
      </div>
    </div>
  );
}

function SubscribeCallout() {
  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-gradient-to-br from-orange-50 via-amber-50 to-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-base font-semibold text-[color:var(--text)]">
            Unlock the full trainer profile
          </div>
          <p className="mt-1 max-w-2xl text-sm text-[color:var(--text-muted)]">
            Subscribe to see contact details, professional bio, certifications,
            portfolio links, and performance stats.
          </p>
        </div>
        <ButtonLink size="lg" href="/client/subscription">
          Subscribe to unlock
        </ButtonLink>
      </div>
    </div>
  );
}

function Pill({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "green" | "white";
}) {
  const toneClass: Record<typeof tone, string> = {
    green: "border-emerald-300 bg-emerald-100 text-emerald-700",
    white: "border-[color:var(--border)] bg-white text-[color:var(--text)]",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${toneClass[tone]}`}
    >
      {children}
    </span>
  );
}

function LockIcon({ className }: { className?: string }) {
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
      <rect x="4" y="11" width="16" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
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
