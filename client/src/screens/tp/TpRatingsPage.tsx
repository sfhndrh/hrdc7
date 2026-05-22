"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-widgets";
import { PageHeaderIconRatings } from "@/components/dashboard/page-header-icons";

type RatingRow = {
  id: string;
  score: number;
  comment: string | null;
  companyName: string | null;
  createdAt: string;
};

export default function TpRatingsPage() {
  const [ratings, setRatings] = useState<RatingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void apiFetch("/api/tp/ratings", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { ratings: [] }))
      .then((d: { ratings: RatingRow[] }) => setRatings(d.ratings ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 p-6">
      <DashboardPageHeader
        title="Ratings"
        description="Feedback from employers after completed trainings"
        icon={<PageHeaderIconRatings />}
      />
      {loading ? (
        <p className="text-sm text-[color:var(--text-muted)]">Loading…</p>
      ) : ratings.length === 0 ? (
        <p className="text-sm text-[color:var(--text-muted)]">No ratings yet.</p>
      ) : (
        <ul className="space-y-3">
          {ratings.map((r) => (
            <li key={r.id} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-[color:var(--text)]">{r.companyName ?? "Employer"}</span>
                <span className="text-amber-600">{r.score} ★</span>
              </div>
              {r.comment ? <p className="mt-2 text-sm text-[color:var(--text-muted)]">{r.comment}</p> : null}
              <p className="mt-1 text-xs text-[color:var(--text-muted)]">{new Date(r.createdAt).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
