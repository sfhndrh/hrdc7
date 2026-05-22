"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiAssetUrl, apiFetch } from "@/lib/api";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-widgets";
import { PageHeaderIconUsers } from "@/components/dashboard/page-header-icons";
import { Button } from "@/components/ui/button";
import { useTpOutlet } from "@/hooks/use-tp-outlet";
import { MALAYSIA_STATES } from "@/lib/malaysia-states";

type BrowseTrainer = {
  id: string;
  fullName: string;
  email: string;
  title: string;
  location: string;
  languages: string;
  yearsExp: number;
  deliveryModes: string;
  profilePhoto: string | null;
  topics: string[];
};

export default function TpTrainersPage() {
  const navigate = useNavigate();
  const { approved } = useTpOutlet();
  const [trainers, setTrainers] = useState<BrowseTrainer[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [locationFilter, setLocationFilter] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    void apiFetch("/api/tp/trainers/browse", { credentials: "include" })
      .then(async (r) => {
        if (!r.ok) {
          const j = (await r.json().catch(() => ({}))) as { error?: string };
          throw new Error(j.error ?? `Failed to load (${r.status})`);
        }
        return (await r.json()) as { trainers: BrowseTrainer[] };
      })
      .then((d) => setTrainers(d.trainers ?? []))
      .catch((err: unknown) => {
        setLoadError(err instanceof Error ? err.message : "Failed to load trainers.");
        setTrainers([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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

  function openMessages(trainer: BrowseTrainer, e: React.MouseEvent) {
    e.stopPropagation();
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

  if (!approved) {
    return (
      <div className="p-6 text-sm text-[color:var(--text-muted)]">
        Trainer search unlocks after approval.
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <DashboardPageHeader
        title="Trainers"
        description="Browse certified trainers on the platform and message them"
        icon={<PageHeaderIconUsers />}
      />

      <div
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
      </div>

      {loadError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </div>
      ) : null}

      {loading || trainers === null ? (
        <p className="text-sm text-[color:var(--text-muted)]">Loading trainers…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-[color:var(--text-muted)]">
          {trainers.length === 0
            ? "No approved trainers on the platform yet."
            : "No trainers match your search."}
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => (
            <TrainerCard
              key={t.id}
              trainer={t}
              onOpen={() => navigate(`/tp/trainers/${t.id}`)}
              onMessage={(e) => openMessages(t, e)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TrainerCard({
  trainer,
  onOpen,
  onMessage,
}: {
  trainer: BrowseTrainer;
  onOpen: () => void;
  onMessage: (e: React.MouseEvent) => void;
}) {
  const initials = trainer.fullName
    .split(" ")
    .filter((part) => /^[A-Za-z]/.test(part))
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className="flex cursor-pointer flex-col rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-sm transition hover:border-[color:var(--primary)]/40 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]/30"
    >
      <div className="flex items-start gap-3">
        {trainer.profilePhoto ? (
          <img
            src={apiAssetUrl(trainer.profilePhoto)}
            alt=""
            className="h-12 w-12 shrink-0 rounded-full border border-[color:var(--border)] object-cover"
          />
        ) : (
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[color:var(--avatar-placeholder-bg)] text-sm font-semibold text-[color:var(--avatar-placeholder-text)]">
            {initials || "T"}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-[color:var(--text)]">{trainer.fullName}</div>
          <div className="mt-0.5 line-clamp-2 text-sm text-[color:var(--text-muted)]">{trainer.title}</div>
          {trainer.location ? (
            <div className="mt-2 text-xs text-[color:var(--text-muted)]">{trainer.location}</div>
          ) : null}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[color:var(--text-muted)]">
        <span>{trainer.yearsExp} yrs exp.</span>
        <span className="truncate">{trainer.deliveryModes || "—"}</span>
      </div>
      <div className="mt-4 border-t border-[color:var(--border)] pt-4">
        <Button type="button" variant="primary" size="sm" onClick={onMessage}>
          Message
        </Button>
      </div>
    </article>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}
