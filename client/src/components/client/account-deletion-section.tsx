"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "@/lib/api";

import { useAuth } from "@/auth/AuthProvider";
import { Button } from "@/components/ui/button";

type AccountDeletionSectionProps = {
  apiPath: "/api/client/account" | "/api/trainer/account";
  description: string;
  confirmDescription: string;
};

export function AccountDeletionSection({
  apiPath,
  description,
  confirmDescription,
}: AccountDeletionSectionProps) {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onConfirmDelete() {
    setDeleting(true);
    setError(null);
    try {
      const res = await apiFetch(apiPath, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "Could not delete your account. Please try again.");
        setDeleting(false);
        return;
      }
      await apiFetch("/api/auth/logout", { method: "POST", credentials: "include" });
      await refresh();
      navigate("/", { replace: true });
    } catch {
      setError("Could not delete your account. Please try again.");
      setDeleting(false);
    }
  }

  return (
    <>
      <section className="rounded-2xl border border-red-200/80 bg-red-50/40 p-6 shadow-sm">
        <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-red-800/90">
          Account deletion
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[color:var(--text-muted)]">
          {description}
        </p>
        {error ? (
          <p className="mt-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}
        <div className="mt-4">
          <Button
            type="button"
            variant="outline"
            className="border-red-300 text-red-700 hover:bg-red-100/80"
            onClick={() => {
              setError(null);
              setConfirmOpen(true);
            }}
          >
            Delete account
          </Button>
        </div>
      </section>

      {confirmOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="presentation"
          onClick={() => {
            if (!deleting) setConfirmOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
            className="w-full max-w-md rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              id="delete-account-title"
              className="text-lg font-semibold text-[color:var(--text)]"
            >
              Delete your account?
            </h3>
            <p className="mt-2 text-sm text-[color:var(--text-muted)]">{confirmDescription}</p>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={deleting}
                onClick={() => setConfirmOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="bg-red-600 text-white hover:bg-red-700"
                disabled={deleting}
                onClick={() => void onConfirmDelete()}
              >
                {deleting ? "Deleting…" : "Yes, delete my account"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
