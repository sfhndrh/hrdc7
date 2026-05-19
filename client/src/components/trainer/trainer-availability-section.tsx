"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";

import { Button } from "@/components/ui/button";

export type TrainerAvailabilityStatus = "AVAILABLE" | "LIMITED" | "UNAVAILABLE";

const STATUS_OPTIONS: Array<{ value: TrainerAvailabilityStatus; label: string; hint: string }> = [
  {
    value: "AVAILABLE",
    label: "Available",
    hint: "Open to new training engagements",
  },
  {
    value: "LIMITED",
    label: "Limited availability",
    hint: "Only select dates or projects",
  },
  {
    value: "UNAVAILABLE",
    label: "Not available",
    hint: "Not taking new bookings right now",
  },
];

export function TrainerAvailabilitySection({
  initialStatus,
  initialEarliestStartDate,
  onSaved,
}: {
  initialStatus: TrainerAvailabilityStatus | null;
  initialEarliestStartDate: string | null;
  onSaved?: () => void;
}) {
  const [status, setStatus] = useState<TrainerAvailabilityStatus>(
    initialStatus ?? "AVAILABLE",
  );
  const [earliestStartDate, setEarliestStartDate] = useState(
    initialEarliestStartDate ?? "",
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await apiFetch("/api/trainer/availability", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          availabilityStatus: status,
          earliestStartDate: earliestStartDate.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "Could not save availability.");
        return;
      }
      setSaved(true);
      onSaved?.();
    } catch {
      setError("Could not save availability.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-[color:var(--border)] bg-white p-6 shadow-sm">
      <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
        Availability
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-[color:var(--text-muted)]">
        Let companies know when you can take on training work. Subscribed clients can see this on
        your marketplace profile.
      </p>

      <form onSubmit={(e) => void onSubmit(e)} className="mt-5 space-y-5">
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-[color:var(--text)]">Current status</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            {STATUS_OPTIONS.map((opt) => {
              const selected = status === opt.value;
              return (
                <label
                  key={opt.value}
                  className={`flex cursor-pointer flex-col rounded-xl border p-4 transition ${
                    selected
                      ? "border-[color:var(--primary)] bg-sky-50 ring-1 ring-[color:var(--primary)]"
                      : "border-[color:var(--border)] hover:border-sky-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="availabilityStatus"
                    value={opt.value}
                    checked={selected}
                    onChange={() => setStatus(opt.value)}
                    className="sr-only"
                  />
                  <span className="text-sm font-semibold text-[color:var(--text)]">{opt.label}</span>
                  <span className="mt-1 text-xs text-[color:var(--text-muted)]">{opt.hint}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <label className="flex max-w-xs flex-col gap-2 text-sm">
          <span className="font-medium text-[color:var(--text)]">Earliest start date</span>
          <span className="text-xs text-[color:var(--text-muted)]">
            Optional — the soonest date you can begin a new engagement
          </span>
          <input
            type="date"
            value={earliestStartDate}
            onChange={(e) => setEarliestStartDate(e.target.value)}
            className="h-10 rounded-md border border-[color:var(--border)] px-3 text-sm"
          />
        </label>

        {error ? (
          <p className="text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}
        {saved ? (
          <p className="text-sm text-emerald-700">Availability saved.</p>
        ) : null}

        <div>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save availability"}
          </Button>
        </div>
      </form>
    </section>
  );
}

