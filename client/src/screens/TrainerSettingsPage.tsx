"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Navigate } from "react-router-dom";

import { useAuth } from "@/auth/AuthProvider";
import { AccountDeletionSection } from "@/components/client/account-deletion-section";
import { TrainerPageHeader } from "@/components/dashboard/trainer-page-header";
import { TrainerNavIconSettings } from "@/components/dashboard/trainer-sidebar-icons";
import {
  TrainerAvailabilitySection,
  type TrainerAvailabilityStatus,
} from "@/components/trainer/trainer-availability-section";

type TrainerSettings = {
  availabilityStatus: TrainerAvailabilityStatus | null;
  earliestStartDate: string | null;
};

export default function TrainerSettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const [settings, setSettings] = useState<TrainerSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(() => {
    if (!user || user.role !== "TRAINER") return;
    void apiFetch("/api/trainer/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then(
        (
          d: {
            trainer?: {
              availabilityStatus?: TrainerAvailabilityStatus | null;
              earliestStartDate?: string | null;
            } | null;
          } | null,
        ) => {
          const t = d?.trainer;
          if (!t) {
            setSettings(null);
            return;
          }
          setSettings({
            availabilityStatus: t.availabilityStatus ?? null,
            earliestStartDate: t.earliestStartDate ?? null,
          });
        },
      )
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    if (user.role === "ADMIN") {
      setSettings(null);
      setLoading(false);
      return;
    }
    loadSettings();
  }, [user, authLoading, loadSettings]);

  if (authLoading || loading) {
    return <div className="text-sm text-[color:var(--text-muted)]">Loading…</div>;
  }

  if (!user) return <Navigate to="/login?from=/trainer/settings" replace />;

  if (user.role === "ADMIN") {
    return (
      <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 text-sm text-[color:var(--text-muted)]">
        Signed in as <strong className="text-[color:var(--text)]">admin</strong>. Open the trainer
        portal as a trainer to manage settings.
      </div>
    );
  }

  if (user.role !== "TRAINER") return <Navigate to="/" replace />;
  if (!settings) return <Navigate to="/trainer/dashboard" replace />;

  return (
    <div className="space-y-6">
      <TrainerPageHeader
        title="Settings"
        icon={<TrainerNavIconSettings />}
        description="Manage your availability and account."
      />

      <TrainerAvailabilitySection
        initialStatus={settings.availabilityStatus}
        initialEarliestStartDate={settings.earliestStartDate}
        onSaved={loadSettings}
      />

      <AccountDeletionSection
        apiPath="/api/trainer/account"
        description="Permanently remove your trainer account from MY Certified Trainer. This deletes your profile, certificate uploads, verification records, and messages. This action cannot be undone."
        confirmDescription="All trainer data will be permanently removed from our system. You will be signed out immediately."
      />
    </div>
  );
}
