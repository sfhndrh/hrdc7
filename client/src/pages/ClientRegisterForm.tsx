"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";

import { Link } from "@/components/link";
import {
  RegisterField,
  RegisterFieldGrid,
  RegisterSection,
  registerInputClass,
} from "@/components/register/register-form-primitives";
import { cn } from "@/components/ui/button";
import { MALAYSIA_STATES } from "@/lib/malaysia-states";

export function ClientRegisterForm() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);
  const [photoLocalName, setPhotoLocalName] = useState<string | null>(null);
  const [photoPreviewBlobUrl, setPhotoPreviewBlobUrl] = useState<string | null>(null);
  const photoBlobUnmountRef = useRef<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    email: "",
    password: "",
    companyName: "",
    industry: "",
    contactEmail: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    profilePhoto: null as string | null,
  });

  function revokeBlobPreview(url: string | null | undefined) {
    if (!url) return;
    URL.revokeObjectURL(url);
    if (photoBlobUnmountRef.current === url) {
      photoBlobUnmountRef.current = null;
    }
  }

  useEffect(() => {
    return () => {
      revokeBlobPreview(photoBlobUnmountRef.current);
    };
  }, []);

  async function onProfilePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setPhotoUploadError(null);
    if (!file) return;

    revokeBlobPreview(photoPreviewBlobUrl);
    const blobUrl = URL.createObjectURL(file);
    photoBlobUnmountRef.current = blobUrl;
    setPhotoPreviewBlobUrl(blobUrl);
    setPhotoLocalName(file.name);

    setPhotoUploading(true);
    const fd = new FormData();
    fd.append("photo", file);
    try {
      const res = await apiFetch("/api/uploads/client-profile-photo", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const j = (await res.json().catch(() => ({}))) as { profilePhotoUrl?: string; error?: string };
      if (!res.ok) {
        setPhotoUploadError(j.error ?? "Upload failed.");
        setForm((f) => ({ ...f, profilePhoto: null }));
        setPhotoLocalName(null);
        revokeBlobPreview(blobUrl);
        setPhotoPreviewBlobUrl(null);
        return;
      }
      if (!j.profilePhotoUrl) {
        setPhotoUploadError("Upload did not return a URL.");
        setForm((f) => ({ ...f, profilePhoto: null }));
        setPhotoLocalName(null);
        revokeBlobPreview(blobUrl);
        setPhotoPreviewBlobUrl(null);
        return;
      }
      revokeBlobPreview(blobUrl);
      photoBlobUnmountRef.current = null;
      setPhotoPreviewBlobUrl(null);
      setForm((f) => ({ ...f, profilePhoto: j.profilePhotoUrl! }));
      setPhotoLocalName(file.name);
    } catch {
      setPhotoUploadError("Network error while uploading.");
      setForm((f) => ({ ...f, profilePhoto: null }));
      setPhotoLocalName(null);
      revokeBlobPreview(blobUrl);
      setPhotoPreviewBlobUrl(null);
    } finally {
      setPhotoUploading(false);
      e.target.value = "";
    }
  }

  function clearProfilePhoto() {
    revokeBlobPreview(photoPreviewBlobUrl);
    photoBlobUnmountRef.current = null;
    setPhotoPreviewBlobUrl(null);
    setForm((f) => ({ ...f, profilePhoto: null }));
    setPhotoLocalName(null);
    setPhotoUploadError(null);
    if (photoInputRef.current) {
      photoInputRef.current.value = "";
    }
  }

  const profilePhotoPreviewSrc = photoPreviewBlobUrl ?? form.profilePhoto ?? null;

  return (
    <form
      className="space-y-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setErr(null);
        setOk(null);
        setLoading(true);

        const res = await apiFetch("/api/register/client", {
          method: "POST",
          headers: { "content-type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            email: form.email,
            password: form.password,
            companyName: form.companyName,
            industry: form.industry,
            contactEmail: form.contactEmail.trim(),
            phone: form.phone,
            street: form.street.trim(),
            city: form.city.trim(),
            state: form.state,
            profilePhoto: form.profilePhoto,
          }),
        });

        setLoading(false);
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          setErr(j?.error ?? "Registration failed");
          return;
        }
        setOk("Account created. You can now login.");
      }}
    >
      <RegisterSection title="Add profile photo" titleClassName="text-left">
        <div className="flex flex-col items-stretch gap-4">
          <div className="flex justify-center">
            <div className="relative">
              <input
                ref={photoInputRef}
                id="co-profile-photo"
                type="file"
                accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                disabled={loading || photoUploading}
                onChange={onProfilePhotoChange}
                className="peer sr-only"
              />
              <label
                htmlFor="co-profile-photo"
                aria-label={profilePhotoPreviewSrc ? "Change profile photo" : "Add profile photo"}
                className={cn(
                  "relative flex h-28 w-28 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 transition-[border-color,background-color,ring-color]",
                  profilePhotoPreviewSrc
                    ? "border-[color:var(--border)] bg-[color:var(--surface-muted)] hover:ring-2 hover:ring-gray-300"
                    : "border-dashed border-gray-300 bg-[color:var(--surface-muted)]/50 hover:border-gray-400 hover:bg-gray-100",
                  (loading || photoUploading) && "pointer-events-none opacity-60",
                )}
              >
                {profilePhotoPreviewSrc ? (
                  <img
                    src={profilePhotoPreviewSrc}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex flex-col items-center gap-1 text-[color:var(--text-muted)]">
                    <span
                      className="grid h-10 w-10 place-items-center rounded-full bg-white text-xl font-light leading-none text-[color:var(--text)] shadow-inner ring-1 ring-gray-200"
                      aria-hidden
                    >
                      +
                    </span>
                    <span className="text-[10px] font-medium uppercase tracking-wide">Add photo</span>
                  </span>
                )}
              </label>
              {photoUploading ? (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-white/65 text-xs font-medium text-[color:var(--text)] backdrop-blur-[2px]">
                  Uploading…
                </div>
              ) : null}
            </div>
          </div>

          <p className="text-center text-xs text-[color:var(--text-muted)]">
            Optional. PNG or JPEG · max 5MB. Tap the circle to add or change photo.
          </p>

          <div className="flex flex-col items-center gap-2 text-center">
            {photoUploadError ? (
              <p className="text-xs text-red-600">{photoUploadError}</p>
            ) : profilePhotoPreviewSrc ? (
              <>
                {photoLocalName ? (
                  <p className="max-w-[18rem] text-xs text-[color:var(--text-muted)]">
                    <span className="font-semibold text-[color:var(--text)]">{photoLocalName}</span>
                    {photoUploading ? " · finishing upload…" : null}
                  </p>
                ) : form.profilePhoto ? (
                  <p className="text-xs text-[color:var(--text-muted)]">Tap circle to replace</p>
                ) : null}
                <button
                  type="button"
                  onClick={clearProfilePhoto}
                  disabled={loading || photoUploading}
                  className="rounded-lg border border-[color:var(--border)] bg-white px-3 py-1.5 text-sm font-medium text-[color:var(--text)] hover:bg-gray-100 disabled:opacity-50"
                >
                  Remove photo
                </button>
              </>
            ) : null}
          </div>
        </div>
      </RegisterSection>

      <RegisterSection title="Account credentials">
        <RegisterFieldGrid>
          <RegisterField label="Email" htmlFor="co-email">
            <input
              id="co-email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={registerInputClass}
            />
          </RegisterField>
          <RegisterField label="Password" htmlFor="co-password">
            <input
              id="co-password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className={registerInputClass}
            />
          </RegisterField>
        </RegisterFieldGrid>
      </RegisterSection>

      <RegisterSection title="Company information">
        <RegisterFieldGrid>
          <RegisterField label="Company name" htmlFor="co-company">
            <input
              id="co-company"
              required
              minLength={2}
              placeholder="e.g. Acme Solutions Sdn Bhd"
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              className={registerInputClass}
            />
          </RegisterField>
          <RegisterField label="Industry" htmlFor="co-industry">
            <input
              id="co-industry"
              required
              minLength={2}
              placeholder="e.g. Information technology, manufacturing"
              value={form.industry}
              onChange={(e) => setForm({ ...form, industry: e.target.value })}
              className={registerInputClass}
            />
          </RegisterField>
        </RegisterFieldGrid>
      </RegisterSection>

      <RegisterSection title="Contact">
        <RegisterFieldGrid>
          <RegisterField label="Company Email" htmlFor="co-contact-email">
            <input
              id="co-contact-email"
              type="email"
              required
              autoComplete="email"
              placeholder="contact@company.com"
              value={form.contactEmail}
              onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
              className={registerInputClass}
            />
          </RegisterField>
          <RegisterField label="Phone number" htmlFor="co-phone">
            <input
              id="co-phone"
              required
              minLength={5}
              placeholder="+60123456789"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className={registerInputClass}
            />
          </RegisterField>
        </RegisterFieldGrid>
      </RegisterSection>

      <RegisterSection title="Company address">
        <RegisterFieldGrid>
          <RegisterField label="Street address" htmlFor="co-street" wide>
            <input
              id="co-street"
              required
              minLength={2}
              placeholder="e.g. Unit 5-2, Menara ABC, Jalan Ampang"
              autoComplete="street-address"
              value={form.street}
              onChange={(e) => setForm({ ...form, street: e.target.value })}
              className={registerInputClass}
            />
          </RegisterField>
          <RegisterField label="City" htmlFor="co-city">
            <input
              id="co-city"
              required
              minLength={2}
              placeholder="e.g. Kuala Lumpur"
              autoComplete="address-level2"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className={registerInputClass}
            />
          </RegisterField>
          <RegisterField label="State" htmlFor="co-state">
            <select
              id="co-state"
              required
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              className={registerInputClass}
            >
              <option value="">Select state</option>
              {MALAYSIA_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </RegisterField>
        </RegisterFieldGrid>
      </RegisterSection>

      {err ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {err}
        </div>
      ) : null}
      {ok ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          {ok}{" "}
          <Link href="/login" className="font-medium underline hover:text-green-950">
            Go to login
          </Link>
          .
        </div>
      ) : null}

      <button
        type="submit"
        disabled={loading || photoUploading}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[color:var(--primary)] to-[#163a66] px-4 text-sm font-semibold text-[color:var(--primary-foreground)] shadow-md transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Creating…" : "Create company account"}
      </button>
    </form>
  );
}
