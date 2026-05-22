"use client";

import { useEffect, useMemo, useState } from "react";
import { apiAssetUrl, apiFetch } from "@/lib/api";

import { useAuth } from "@/auth/AuthProvider";
import { Link } from "@/components/link";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-widgets";
import { PageHeaderIconSearch } from "@/components/dashboard/page-header-icons";
import { ButtonLink } from "@/components/ui/button";
import { MALAYSIA_STATES } from "@/lib/malaysia-states";

type TrainerCardData = {
  id: string;
  fullName: string;
  title: string;
  location: string;
  languages: string;
  yearsExp: number;
  deliveryModes: string;
  profilePhoto: string | null;
  topics: string[];
};

export default function ClientTrainersPage() {
  const { user } = useAuth();
  const [subscribed, setSubscribed] = useState(false);
  const [trainers, setTrainers] = useState<TrainerCardData[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [locationFilter, setLocationFilter] = useState("");

  const isAdmin = user?.role === "ADMIN";
  const unlockContent = isAdmin || subscribed;

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
    void apiFetch("/api/client/trainers", { credentials: "include" })
      .then(async (r) => {
        if (!r.ok) throw new Error(`Request failed (${r.status})`);
        return (await r.json()) as { trainers: TrainerCardData[] };
      })
      .then((d) => setTrainers(d.trainers ?? []))
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Failed to load trainers.";
        setLoadError(msg);
        setTrainers([]);
      });
  }, []);

  const filtered = useMemo(() => {
    if (!trainers) return [];
    const needle = q.trim().toLowerCase();
    const stateNeedle = locationFilter.trim().toLowerCase();
    return trainers.filter((t) => {
      if (stateNeedle && (t.location?.trim().toLowerCase() ?? "") !== stateNeedle) return false;
      if (!needle) return true;
      const hay = `${t.fullName} ${t.title} ${t.location} ${t.languages} ${t.deliveryModes} ${t.topics.join(" ")}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [trainers, q, locationFilter]);

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Browse trainers"
        description="Free tier shows limited info. Subscribe to unlock full profiles."
        icon={<PageHeaderIconSearch />}
        right={
          subscribed || isAdmin ? null : (
            <ButtonLink size="sm" href="/client/subscription">
              Subscribe
            </ButtonLink>
          )
        }
      />

      <section
        className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 shadow-sm"
        aria-label="Search trainers"
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <label className="relative block min-w-0 flex-1">
            <span className="sr-only">Search trainers</span>
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--text-muted)]" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name or expertise…"
              className="h-10 w-full rounded-xl border border-[color:var(--admin-search-border)] bg-[color:var(--admin-search-bg)] py-2 pl-10 pr-4 text-sm text-[color:var(--text)] placeholder:text-[color:var(--text-muted)] focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]/30"
            />
          </label>
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="h-10 shrink-0 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 text-sm text-[color:var(--text)] focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]/30 md:min-w-[180px]"
            aria-label="Filter by state"
          >
            <option value="">All locations</option>
            {MALAYSIA_STATES.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </div>
      </section>

      {loadError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </div>
      ) : null}

      {trainers === null ? (
        <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-8 text-center text-sm text-[color:var(--text-muted)] shadow-sm">
          Loading approved trainers…
        </div>
      ) : trainers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[color:var(--border)] bg-[color:var(--surface)] p-10 text-center shadow-sm">
          <div className="text-base font-semibold text-[color:var(--text)]">
            No approved trainers yet
          </div>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-[color:var(--text-muted)]">
            Once trainers complete registration and an administrator approves
            their HRDC certificate, they'll appear here for you to browse.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[color:var(--border)] bg-[color:var(--surface)] p-10 text-center shadow-sm">
          <div className="text-base font-semibold text-[color:var(--text)]">
            No trainers match your search
          </div>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-[color:var(--text-muted)]">
            Try a different name, expertise topic, or state.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => (
            <TrainerCard key={t.id} trainer={t} unlockContent={unlockContent} />
          ))}
        </div>
      )}
    </div>
  );
}

function TrainerCard({
  trainer,
  unlockContent,
}: {
  trainer: TrainerCardData;
  unlockContent: boolean;
}) {
  const locked = !unlockContent;
  const initials = trainer.fullName
    .split(" ")
    .filter((part) => /^[A-Za-z]/.test(part))
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <Link
      href={`/client/trainers/${trainer.id}`}
      className="flex flex-col rounded-2xl border border-[color:var(--border)] bg-gradient-to-br from-[color:var(--card-gradient-from)] via-[color:var(--card-gradient-via)] to-[color:var(--card-gradient-to)] p-5 text-[color:var(--text)] shadow-[0_8px_22px_var(--shadow-color)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_var(--shadow-elevated)]"
    >
      <div className="flex items-start gap-3">
        <div
          className={`shrink-0 ${locked ? "select-none blur-sm pointer-events-none" : ""}`}
          aria-hidden={locked ? true : undefined}
        >
          {trainer.profilePhoto ? (
            <img
              src={apiAssetUrl(trainer.profilePhoto)}
              alt=""
              className="h-12 w-12 rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] object-cover shadow-sm"
            />
          ) : (
            <div className="grid h-12 w-12 place-items-center rounded-full bg-[color:var(--avatar-placeholder-bg)] text-sm font-semibold text-[color:var(--avatar-placeholder-text)] shadow-sm">
              {initials || "T"}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div
            className={
              locked ? "select-none blur-sm pointer-events-none" : ""
            }
            aria-hidden={locked ? true : undefined}
          >
            <div className="text-base font-semibold leading-tight">
              {trainer.fullName}
            </div>
            <div className="mt-0.5 line-clamp-2 text-sm leading-snug text-[color:var(--text-muted)]">
              {trainer.title}
            </div>
            {trainer.location ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Pill tone="white">{trainer.location}</Pill>
              </div>
            ) : null}
          </div>
          {locked ? (
            <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">
              <LockIcon className="h-3 w-3" />
              Subscribe to view
            </div>
          ) : null}
        </div>
      </div>

      <div className="my-4 border-t border-[color:var(--border)]" />

      <div
        className={locked ? "select-none blur-sm pointer-events-none" : ""}
        aria-hidden={locked ? true : undefined}
      >
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <InfoCell label="Experience" value={`${trainer.yearsExp} years`} />
          <InfoCell label="Languages" value={trainer.languages || "—"} />
          <InfoCell
            label="Delivery modes"
            value={trainer.deliveryModes || "—"}
            className="col-span-2"
          />
        </div>

        {trainer.topics.length > 0 ? (
          <div className="mt-4">
            <div className="text-xs text-[color:var(--text-muted)]">
              Training topics
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {trainer.topics.slice(0, 6).map((topic) => (
                <span
                  key={topic}
                  className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface)]/70 px-2 py-0.5 text-xs text-[color:var(--text)]"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </Link>
  );
}

function InfoCell({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="text-xs text-[color:var(--text-muted)]">{label}</div>
      <div className="mt-0.5 text-sm font-semibold text-[color:var(--text)]">
        {value}
      </div>
    </div>
  );
}

function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <circle cx="11" cy="11" r="7" />
      <path strokeLinecap="round" d="M20 20l-3.3-3.3" />
    </svg>
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
      aria-hidden
    >
      <rect x="4" y="11" width="16" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
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
    white:
      "border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text)]",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${toneClass[tone]}`}
    >
      {children}
    </span>
  );
}
