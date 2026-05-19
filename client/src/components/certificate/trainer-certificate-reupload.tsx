"use client";

import { useRef, useState } from "react";
import { apiFetch } from "@/lib/api";

import { Button } from "@/components/ui/button";

export function TrainerCertificateReupload({
  disabled,
  onUpdated,
}: {
  disabled?: boolean;
  onUpdated: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [localName, setLocalName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const busy = uploading || applying || disabled;

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setError(null);
    setSuccess(null);
    if (!file) return;

    setLocalName(file.name);
    setUploading(true);

    const fd = new FormData();
    fd.append("cert", file);

    let certFileUrl: string;
    try {
      const uploadRes = await apiFetch("/api/uploads/trainer-hrdc-cert", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const uploadJson = (await uploadRes.json().catch(() => ({}))) as {
        certFileUrl?: string;
        error?: string;
      };
      if (!uploadRes.ok || !uploadJson.certFileUrl) {
        setError(uploadJson.error ?? "Upload failed.");
        setLocalName(null);
        setFileInputKey((k) => k + 1);
        return;
      }
      certFileUrl = uploadJson.certFileUrl;
    } catch {
      setError("Network error while uploading.");
      setLocalName(null);
      setFileInputKey((k) => k + 1);
      return;
    } finally {
      setUploading(false);
    }

    setApplying(true);
    try {
      const applyRes = await apiFetch("/api/trainer/certificate", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ certFileUrl }),
      });
      const applyJson = (await applyRes.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
      };
      if (!applyRes.ok) {
        setError(applyJson.error ?? "Could not save the new certificate.");
        setLocalName(null);
        setFileInputKey((k) => k + 1);
        return;
      }
      setSuccess(
        applyJson.message ??
          "Certificate uploaded. AI verification is running — refresh in a moment.",
      );
      onUpdated();
    } catch {
      setError("Network error while saving certificate.");
      setLocalName(null);
      setFileInputKey((k) => k + 1);
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)]/40 p-4">
      <div className="text-sm font-semibold text-[color:var(--text)]">Replace certificate</div>
      <p className="mt-2 text-xs leading-relaxed text-[color:var(--text-muted)]">
        Upload a new HRD Corp trainer certificate (PDF, PNG, or JPEG, max 10MB). We will run AI
        verification on the new file and set your account to under review.
      </p>
      <input
        ref={inputRef}
        key={fileInputKey}
        type="file"
        accept=".pdf,application/pdf,image/png,image/jpeg"
        disabled={busy}
        className="sr-only"
        onChange={(e) => void onFileChange(e)}
      />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? "Uploading…" : applying ? "Verifying…" : "Choose new file"}
        </Button>
        {localName && !error ? (
          <span className="text-xs text-[color:var(--text-muted)]">{localName}</span>
        ) : null}
      </div>
      {error ? (
        <p className="mt-2 text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="mt-2 text-xs text-emerald-700" role="status">
          {success}
        </p>
      ) : null}
    </div>
  );
}
