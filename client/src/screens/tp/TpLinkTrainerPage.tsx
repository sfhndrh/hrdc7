"use client";

import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "@/lib/api";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-widgets";
import { PageHeaderIconUsers } from "@/components/dashboard/page-header-icons";
import { Button, ButtonLink } from "@/components/ui/button";
import { useTpOutlet } from "@/hooks/use-tp-outlet";

type AvailableTrainer = {
  id: string;
  fullName: string;
  expertise: string;
  email: string;
};

export default function TpLinkTrainerPage() {
  const navigate = useNavigate();
  const { approved } = useTpOutlet();
  const [available, setAvailable] = useState<AvailableTrainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    void apiFetch("/api/tp/trainers/available", { credentials: "include" })
      .then((r) => r.json())
      .then((d: { trainers: AvailableTrainer[] }) => setAvailable(d.trainers ?? []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function linkTrainer(trainerId: string) {
    setBusy(trainerId);
    const res = await apiFetch("/api/tp/trainers/link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ trainerId }),
    });
    setBusy(null);
    if (res.ok) navigate("/tp/trainers");
  }

  if (!approved) {
    return (
      <div className="p-6 text-sm text-[color:var(--text-muted)]">
        Trainer management unlocks after approval.
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <DashboardPageHeader
        title="Link trainer"
        description="Connect an approved marketplace trainer to your organization"
        icon={<PageHeaderIconUsers />}
        right={
          <ButtonLink href="/tp/trainers" variant="outline" size="sm">
            Back to trainers
          </ButtonLink>
        }
      />

      <div className="mx-auto max-w-2xl rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm">
        {loading ? (
          <p className="text-sm text-[color:var(--text-muted)]">Loading…</p>
        ) : available.length === 0 ? (
          <p className="text-sm text-[color:var(--text-muted)]">
            No additional approved trainers available to link.
          </p>
        ) : (
          <ul className="space-y-3">
            {available.map((t) => (
              <li
                key={t.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)]/40 p-4"
              >
                <div>
                  <div className="font-semibold text-[color:var(--text)]">{t.fullName}</div>
                  <div className="text-sm text-[color:var(--text-muted)]">{t.email}</div>
                  {t.expertise ? (
                    <div className="mt-1 text-xs text-[color:var(--text-muted)]">{t.expertise}</div>
                  ) : null}
                </div>
                <Button
                  type="button"
                  size="sm"
                  disabled={busy !== null}
                  onClick={() => void linkTrainer(t.id)}
                >
                  {busy === t.id ? "Linking…" : "Link trainer"}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
