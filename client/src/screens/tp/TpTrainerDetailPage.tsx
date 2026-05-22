"use client";

import { useEffect, useState } from "react";
import { apiAssetUrl, apiFetch } from "@/lib/api";
import { Navigate, useNavigate, useParams } from "react-router-dom";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-widgets";
import { PageHeaderIconUser } from "@/components/dashboard/page-header-icons";
import { Button, ButtonLink } from "@/components/ui/button";
import { useTpOutlet } from "@/hooks/use-tp-outlet";

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
  willingToTravel: string;
  travelLocations: string[];
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
};

function fromApi(t: ApiTrainer): TrainerDetail {
  return {
    id: t.id,
    fullName: t.fullName,
    title: t.expertise.slice(0, 3).join(", ") || "Certified trainer",
    location: t.stateOrLocation ?? "",
    languages: t.languages ?? "",
    email: t.email,
    phone: t.phone,
    yearsExp: t.yearsExp,
    expertise: t.expertise,
    deliveryModes: t.deliveryModes.join(", "),
    bio: t.bio ?? "",
    certFileUrl: t.certFileUrl,
    linkedIn: t.linkedIn ?? "",
    websiteUrl: t.portfolioUrl ?? "",
    profilePhoto: t.profilePhoto,
    willingToTravel: t.willingToTravel ?? "",
    travelLocations: t.travelLocations ?? [],
  };
}

export default function TpTrainerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { approved } = useTpOutlet();
  const [trainer, setTrainer] = useState<TrainerDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !approved) return;
    setLoading(true);
    void apiFetch(`/api/tp/trainers/${encodeURIComponent(id)}`, { credentials: "include" })
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
  }, [id, approved]);

  if (!approved) {
    return (
      <div className="p-6 text-sm text-[color:var(--text-muted)]">
        Trainer profiles unlock after approval.
      </div>
    );
  }

  if (!id) return null;
  if (notFound) return <Navigate to="/tp/trainers" replace />;
  if (loading || !trainer) {
    return (
      <div className="p-6 text-sm text-[color:var(--text-muted)]">Loading trainer profile…</div>
    );
  }

  const certFileLabel = trainer.certFileUrl
    ? trainer.certFileUrl.split("/").pop() ?? "HRDC certificate"
    : "HRDC certificate";

  const initials = trainer.fullName
    .split(" ")
    .filter((part) => /^[A-Za-z]/.test(part))
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  function openMessages() {
    navigate("/tp/messages", {
      state: {
        startPeer: {
          id: trainer.id,
          name: trainer.fullName,
          subtitle: trainer.title,
        },
      },
    });
  }

  return (
    <div className="space-y-6 p-6">
      <DashboardPageHeader
        title="Trainer details"
        icon={<PageHeaderIconUser />}
        right={
          <ButtonLink href="/tp/trainers" variant="outline" size="sm">
            Back to trainers
          </ButtonLink>
        }
      />

      <div className="flex flex-col gap-5 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          {trainer.profilePhoto ? (
            <img
              src={apiAssetUrl(trainer.profilePhoto)}
              alt=""
              className="h-16 w-16 shrink-0 rounded-full border border-[color:var(--border)] object-cover"
            />
          ) : (
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-[color:var(--avatar-placeholder-bg)] text-lg font-semibold text-[color:var(--avatar-placeholder-text)]">
              {initials || "T"}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-[color:var(--text)]">{trainer.fullName}</h1>
            <p className="mt-1 text-sm text-[color:var(--text-muted)]">{trainer.title}</p>
            {trainer.location ? (
              <p className="mt-2 text-xs text-[color:var(--text-muted)]">{trainer.location}</p>
            ) : null}
          </div>
        </div>
        <Button type="button" variant="primary" onClick={openMessages}>
          Message trainer
        </Button>
      </div>

      <Section title="Contact">
        <FieldGrid>
          <Field label="Email" value={trainer.email} />
          <Field label="Phone" value={trainer.phone || "—"} />
          <Field label="State / location" value={trainer.location || "—"} />
          <Field label="Languages" value={trainer.languages || "—"} />
        </FieldGrid>
      </Section>

      <Section title="Professional background">
        <FieldGrid>
          <Field label="Years of experience" value={`${trainer.yearsExp} years`} />
          <Field label="Training expertise" value={trainer.expertise.join(", ") || "—"} wide />
          <Field label="Delivery modes" value={trainer.deliveryModes || "—"} />
          <Field
            label="Willing to travel"
            value={
              trainer.willingToTravel
                ? `${trainer.willingToTravel}${trainer.travelLocations.length ? ` · ${trainer.travelLocations.join(", ")}` : ""}`
                : "—"
            }
            wide
          />
          <Field label="Bio" value={trainer.bio || "—"} wide multiline />
        </FieldGrid>
      </Section>

      <Section title="HRDC certification">
        <Field label="Certificate file">
          {trainer.certFileUrl ? (
            <a
              href={apiAssetUrl(trainer.certFileUrl)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1.5 text-sm font-medium text-[color:var(--text)] hover:bg-[color:var(--surface-muted)]"
            >
              {certFileLabel}
            </a>
          ) : (
            <span className="text-sm text-[color:var(--text-muted)]">—</span>
          )}
        </Field>
      </Section>

      <Section title="Portfolio">
        <FieldGrid>
          <Field label="LinkedIn" value={trainer.linkedIn || "—"} />
          <Field label="Website / portfolio" value={trainer.websiteUrl || "—"} />
        </FieldGrid>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm">
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
  wide,
  multiline,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
  wide?: boolean;
  multiline?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border border-[color:var(--admin-search-border)] bg-[color:var(--admin-search-bg)] p-4 ${
        wide ? "md:col-span-2" : ""
      }`}
    >
      <div className="text-xs font-semibold uppercase tracking-wide text-[color:var(--text-muted)]">
        {label}
      </div>
      <div className="mt-2">
        {children ??
          (multiline ? (
            <p className="whitespace-pre-line text-sm font-medium text-[color:var(--text)]">{value}</p>
          ) : (
            <p className="text-sm font-medium text-[color:var(--text)]">{value}</p>
          ))}
      </div>
    </div>
  );
}
