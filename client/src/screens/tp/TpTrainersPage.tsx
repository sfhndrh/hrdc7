"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-widgets";
import { PageHeaderIconUsers } from "@/components/dashboard/page-header-icons";
import { Button, ButtonLink } from "@/components/ui/button";
import { useTpOutlet } from "@/hooks/use-tp-outlet";

type LinkedTrainer = {
  linkId: string;
  linkStatus: string;
  trainerId: string;
  fullName: string;
  phone: string;
  expertise: string;
  trainerStatus: string;
  trainerEmail: string;
};

export default function TpTrainersPage() {
  const { approved } = useTpOutlet();
  const [linked, setLinked] = useState<LinkedTrainer[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    void apiFetch("/api/tp/trainers", { credentials: "include" })
      .then((r) => r.json())
      .then((d: { trainers: LinkedTrainer[] }) => setLinked(d.trainers ?? []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function removeTrainer(trainerId: string) {
    if (!confirm("Remove this trainer from your organization?")) return;
    await apiFetch(`/api/tp/trainers/link/${trainerId}`, {
      method: "DELETE",
      credentials: "include",
    });
    load();
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
        title="Trainers"
        description="Invite, link, and manage certified trainers"
        icon={<PageHeaderIconUsers />}
        right={
          <ButtonLink href="/tp/trainers/link" size="sm">
            Link trainer
          </ButtonLink>
        }
      />

      {loading ? (
        <p className="text-sm text-[color:var(--text-muted)]">Loading…</p>
      ) : linked.length === 0 ? (
        <p className="text-sm text-[color:var(--text-muted)]">
          No linked trainers. Link approved marketplace trainers to assign them to courses.
        </p>
      ) : (
        <ul className="space-y-3">
          {linked.map((t) => (
            <li
              key={t.linkId}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 shadow-sm"
            >
              <div>
                <div className="font-semibold text-[color:var(--text)]">{t.fullName}</div>
                <div className="text-sm text-[color:var(--text-muted)]">
                  {t.trainerEmail} · {t.expertise || "—"}
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void removeTrainer(t.trainerId)}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
