"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";

import { EmployerAccountStatusPill } from "@/components/admin/admin-accounts-chrome";
import { Button } from "@/components/ui/button";
import { registerTextareaClass } from "@/components/register/register-form-primitives";

export function AdminTrainerActionsSection({
  trainerId,
  accountStatus,
  suspensionReason,
  suspendedAt,
  onUpdated,
}: {
  trainerId: string;
  accountStatus: "ACTIVE" | "SUSPENDED";
  suspensionReason: string | null;
  suspendedAt: string | null;
  onUpdated: () => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reactivating, setReactivating] = useState(false);

  async function handleSuspend() {
    const trimmed = reason.trim();
    if (trimmed.length < 3) {
      setError("Enter a suspension reason (at least 3 characters).");
      return;
    }
    setSubmitting(true);
    setError(null);
    const res = await apiFetch(`/api/admin/trainers/${trainerId}/suspend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ reason: trimmed }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setError(j.error ?? "Could not suspend trainer.");
      return;
    }
    setConfirmOpen(false);
    setReason("");
    onUpdated();
  }

  async function handleReactivate() {
    setReactivating(true);
    setError(null);
    const res = await apiFetch(`/api/admin/trainers/${trainerId}/reactivate`, {
      method: "POST",
      credentials: "include",
    });
    setReactivating(false);
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setError(j.error ?? "Could not reactivate trainer.");
      return;
    }
    onUpdated();
  }

  const suspendedDate =
    suspendedAt &&
    new Date(suspendedAt).toLocaleDateString("en-MY", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <section className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm">
      <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
        Admin actions
      </h2>
      <div className="mt-4 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-[color:var(--text-muted)]">Account status</span>
          <EmployerAccountStatusPill status={accountStatus} />
        </div>

        {accountStatus === "SUSPENDED" ? (
          <>
            {suspensionReason?.trim() ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-red-800">
                  Suspension reason
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-red-900">
                  {suspensionReason}
                </p>
                {suspendedDate ? (
                  <p className="mt-2 text-xs text-red-700">Suspended {suspendedDate}</p>
                ) : null}
              </div>
            ) : null}
            <Button
              type="button"
              variant="outline"
              disabled={reactivating}
              onClick={() => void handleReactivate()}
            >
              {reactivating ? "Reactivating…" : "Reactivate account"}
            </Button>
          </>
        ) : (
          <Button type="button" variant="outline" onClick={() => setConfirmOpen(true)}>
            Suspend trainer
          </Button>
        )}

        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}
      </div>

      {confirmOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="presentation"
          onClick={() => {
            if (!submitting) setConfirmOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="suspend-trainer-title"
            className="w-full max-w-md rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              id="suspend-trainer-title"
              className="text-lg font-semibold text-[color:var(--text)]"
            >
              Suspend trainer account?
            </h3>
            <p className="mt-2 text-sm text-[color:var(--text-muted)]">
              The trainer will not be able to sign in until the account is reactivated. Enter the
              reason shown to them when they try to log in.
            </p>
            <label className="mt-4 block">
              <span className="text-sm font-semibold text-[color:var(--text)]">
                Reason for suspension <span className="font-normal text-red-600">*</span>
              </span>
              <textarea
                className={`mt-2 ${registerTextareaClass}`}
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Violation of platform terms…"
                disabled={submitting}
              />
            </label>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={() => {
                  setConfirmOpen(false);
                  setReason("");
                  setError(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="bg-red-600 text-white hover:bg-red-700"
                disabled={submitting}
                onClick={() => void handleSuspend()}
              >
                {submitting ? "Suspending…" : "Confirm suspension"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
