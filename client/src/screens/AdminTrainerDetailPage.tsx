"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { ReactNode } from "react";
import { Link } from "@/components/link";
import { Navigate, useParams } from "react-router-dom";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-widgets";
import { PageHeaderIconUsers } from "@/components/dashboard/page-header-icons";
import { cn } from "@/components/ui/button";

type TrainerDetailRow = {
  id: string;
  fullName: string;
  phone: string;
  bio: string;
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
  status: string;
  adminNote: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user: { email: string };
};

export default function AdminTrainerDetailPage() {
  const { id } = useParams();
  const [row, setRow] = useState<TrainerDetailRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (!id) return;
    void apiFetch(`/api/admin/trainers/${id}`, { credentials: "include" })
      .then((r) => {
        if (r.status === 404) {
          setMissing(true);
          return null;
        }
        return r.json() as Promise<{ trainer: TrainerDetailRow }>;
      })
      .then((d) => {
        if (d?.trainer) setRow(d.trainer);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (!id) return null;
  if (loading) {
    return <div className="p-6 text-sm text-[color:var(--text-muted)]">Loading…</div>;
  }
  if (missing || !row) {
    return <Navigate to="/admin/trainers" replace />;
  }

  const statusLabel = formatTrainerStatus(row.status);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/trainers"
          className="inline-flex items-center gap-1 text-sm text-[color:var(--text-muted)] hover:text-[color:var(--text)]"
        >
          <span aria-hidden>←</span> Back to trainers
        </Link>
      </div>

      <DashboardPageHeader
        title={row.fullName}
        description="Trainer"
        icon={<PageHeaderIconUsers />}
      />
      <div className="flex flex-wrap gap-1.5">
        {row.expertise.slice(0, 6).map((e) => (
          <Pill key={e} tone="white">
            {e}
          </Pill>
        ))}
        {row.status === "APPROVED" ? <Pill tone="green">HRD Corp verified</Pill> : null}
      </div>

      <Section title="Personal info">
        <FieldGrid>
          <ReadOnlyField label="Full name" value={row.fullName} />
          <ReadOnlyField label="Email address" value={row.user.email} />
          <ReadOnlyField label="Phone number" value={row.phone} />
          <ReadOnlyField label="State / location" value={row.stateOrLocation?.trim() || "—"} />
          <ReadOnlyField label="Languages" value={row.languages?.trim() || "—"} />
        </FieldGrid>
      </Section>

      <Section title="Professional background">
        <FieldGrid>
          <ReadOnlyField label="Years of experience" value={`${row.yearsExp} years`} />
          <ReadOnlyField
            label="Training expertise"
            value={row.expertise.length ? row.expertise.join(", ") : "—"}
            wide
          />
          <ReadOnlyField
            label="Training delivery mode"
            value={row.deliveryModes?.length ? row.deliveryModes.join(", ") : "—"}
          />
          <ReadOnlyField
            label="Willing to travel"
            value={
              row.willingToTravel === "Yes"
                ? `Yes — ${row.travelLocations?.length ? row.travelLocations.join(", ") : "—"}`
                : row.willingToTravel === "No"
                  ? "No"
                  : row.willingToTravel === "Within state" ||
                      row.willingToTravel === "Nationwide" ||
                      row.willingToTravel === "Overseas"
                    ? `${row.willingToTravel}${row.travelLocations?.length ? ` · ${row.travelLocations.join(", ")}` : ""}`
                    : row.willingToTravel?.trim() || "—"
            }
          />
          <ReadOnlyField label="Professional bio" value={row.bio} wide multiline />
        </FieldGrid>
      </Section>

      <Section title="Links & certification">
        <FieldGrid>
          <ReadOnlyField
            label="LinkedIn profile"
            value={row.linkedIn?.trim() || "—"}
          />
          <ReadOnlyField
            label="Website / portfolio URL"
            value={row.portfolioUrl?.trim() || "—"}
          />
          <ReadOnlyField label="HRDC cert file" wide>
            {row.certFileUrl ? (
              <a
                href={row.certFileUrl}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  "inline-flex h-9 items-center justify-center rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] px-3 text-sm font-medium text-[color:var(--text)] transition-colors hover:bg-[color:var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400",
                )}
              >
                Open certificate
              </a>
            ) : (
              <span className="text-sm font-medium text-[color:var(--text)]">—</span>
            )}
          </ReadOnlyField>
        </FieldGrid>
      </Section>

      <Section title="Account & verification">
        <FieldGrid>
          <ReadOnlyField label="Application status" value={statusLabel} />
          <ReadOnlyField
            label="Admin note"
            value={row.adminNote?.trim() || "—"}
            multiline
            wide
          />
          <ReadOnlyField
            label="Created"
            value={new Date(row.createdAt).toLocaleString("en-MY", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          />
          <ReadOnlyField
            label="Approved at"
            value={
              row.approvedAt
                ? new Date(row.approvedAt).toLocaleString("en-MY", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "—"
            }
          />
        </FieldGrid>
      </Section>
    </div>
  );
}

function formatTrainerStatus(status: string) {
  return status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
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

function ReadOnlyField({
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
      className={`rounded-xl border border-sky-100 bg-sky-50/70 p-4 ${wide ? "md:col-span-2" : ""}`}
    >
      <div className="text-xs font-medium uppercase tracking-wide text-[color:var(--text-muted)]">
        {label}
      </div>
      <div className="mt-2">{body}</div>
    </div>
  );
}

function Pill({ children, tone }: { children: ReactNode; tone: "green" | "white" }) {
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
