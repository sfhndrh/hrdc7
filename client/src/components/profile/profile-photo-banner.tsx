"use client";

import { useEffect, useRef, useState } from "react";

import { apiAssetUrl, apiUrl } from "@/lib/api";

/**
 * Banner shown at the top of the trainer/employer edit profile pages.
 * The avatar is clickable: clicking it opens a file picker and uploads the
 * chosen image to the supplied endpoints. The new URL is reported to the
 * parent via `onPhotoUpdated` so the wider page state stays in sync.
 */
export function ProfilePhotoBanner({
  name,
  role,
  initialPhoto,
  uploadEndpoint,
  saveEndpoint,
  fallback,
  onPhotoUpdated,
}: {
  name: string;
  role: string;
  initialPhoto: string | null;
  /** Anonymous upload endpoint (returns `{ profilePhotoUrl }`). */
  uploadEndpoint: string;
  /** Authenticated endpoint that persists the new URL on the entity row. */
  saveEndpoint: string;
  /** Letter shown when no photo is uploaded yet. */
  fallback: string;
  onPhotoUpdated?: (url: string) => void;
}) {
  const [photo, setPhoto] = useState<string | null>(initialPhoto);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setPhoto(initialPhoto);
  }, [initialPhoto]);

  async function handleSelect(file: File | null) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("photo", file);
      const upRes = await fetch(apiUrl(uploadEndpoint), {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      const upData = (await upRes.json().catch(() => null)) as
        | { profilePhotoUrl?: string; error?: string }
        | null;
      if (!upRes.ok || !upData?.profilePhotoUrl) {
        setError(upData?.error || "Upload failed. Try a smaller image.");
        return;
      }
      const url = upData.profilePhotoUrl;
      const saveRes = await fetch(apiUrl(saveEndpoint), {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profilePhotoUrl: url }),
      });
      if (!saveRes.ok) {
        setError("Could not save the new profile photo.");
        return;
      }
      setPhoto(url);
      onPhotoUpdated?.(url);
    } catch {
      setError("Network error while uploading the photo.");
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
          className="group relative grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full bg-[color:var(--avatar-placeholder-bg)] text-lg font-semibold text-[color:var(--avatar-placeholder-text)] ring-1 ring-[color:var(--border)] transition hover:ring-[color:var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary)] disabled:cursor-wait disabled:opacity-70"
          aria-label="Change profile photo"
        >
          {photo ? (
            <img src={apiAssetUrl(photo)} alt="" className="h-full w-full object-cover" />
          ) : (
            <span>{fallback || "?"}</span>
          )}
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40 text-[10px] font-semibold uppercase tracking-wide text-white opacity-0 transition group-hover:opacity-100">
            {busy ? "Uploading…" : "Change"}
          </span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          onChange={(e) => void handleSelect(e.target.files?.[0] ?? null)}
        />
        <div className="min-w-0">
          <h2 className="truncate text-2xl font-bold leading-tight text-[color:var(--text)]">
            {name}
          </h2>
          <div className="mt-1 text-sm text-[color:var(--text-muted)]">{role}</div>
        </div>
      </div>
      {error ? (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}
    </div>
  );
}
