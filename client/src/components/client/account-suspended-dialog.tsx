"use client";

import { Button } from "@/components/ui/button";

export function AccountSuspendedDialog({
  suspensionReason,
  description = "Your employer account has been suspended by an administrator.",
  onDismiss,
}: {
  suspensionReason: string;
  description?: string;
  onDismiss?: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4"
      role="presentation"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="account-suspended-title"
        aria-describedby="account-suspended-desc"
        className="w-full max-w-md rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="account-suspended-title"
          className="text-lg font-semibold text-[color:var(--text)]"
        >
          Account suspended
        </h2>
        <p id="account-suspended-desc" className="mt-2 text-sm text-[color:var(--text-muted)]">
          {description}
        </p>
        {suspensionReason.trim() ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-red-800">
              Reason
            </div>
            <p className="mt-1 whitespace-pre-wrap text-sm text-red-900">{suspensionReason}</p>
          </div>
        ) : null}
        {onDismiss ? (
          <div className="mt-6 flex justify-end">
            <Button type="button" onClick={onDismiss}>
              OK
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
