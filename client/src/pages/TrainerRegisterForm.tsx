"use client";

import { useNavigate } from "react-router-dom";
import { apiFetch } from "@/lib/api";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  RegisterField,
  RegisterFieldGrid,
  RegisterSection,
  registerInputClass,
  registerTextareaClass,
} from "@/components/register/register-form-primitives";
import { DELIVERY_MODE_OPTIONS, TagListEditor } from "@/components/register/trainer-field-widgets";
import { MALAYSIA_TRAINING_LANGUAGES } from "@/lib/malaysia-training-languages";
import { MALAYSIA_STATES } from "@/lib/malaysia-states";
import { cn } from "@/components/ui/button";

export function TrainerRegisterForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [certUploading, setCertUploading] = useState(false);
  const [certUploadError, setCertUploadError] = useState<string | null>(null);
  const [certLocalName, setCertLocalName] = useState<string | null>(null);
  const [certFileInputKey, setCertFileInputKey] = useState(0);

  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);
  const [photoLocalName, setPhotoLocalName] = useState<string | null>(null);
  const [photoPreviewBlobUrl, setPhotoPreviewBlobUrl] = useState<string | null>(null);
  const photoBlobUnmountRef = useRef<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    email: "",
    password: "",
    fullName: "",
    phone: "",
    stateOrLocation: "",
    yearsExp: 1,
    linkedIn: "",
    portfolioUrl: "",
    bio: "",
    certFileUrl: "",
    profilePhoto: null as string | null,
  });

  const [expertiseTags, setExpertiseTags] = useState<string[]>([]);
  const [languagesSelected, setLanguagesSelected] = useState<Set<string>>(() => new Set());
  const [deliveryModes, setDeliveryModes] = useState<Set<string>>(() => new Set());
  const [willingToTravel, setWillingToTravel] = useState<"" | "Yes" | "No">("");
  const [travelLocations, setTravelLocations] = useState<string[]>([]);

  const deliveryList = useMemo(() => [...deliveryModes], [deliveryModes]);
  const languagesJoined = useMemo(() => [...languagesSelected].sort().join(", "), [languagesSelected]);

  function toggleDelivery(opt: string) {
    setDeliveryModes((prev) => {
      const n = new Set(prev);
      if (n.has(opt)) n.delete(opt);
      else n.add(opt);
      return n;
    });
  }

  function toggleLanguage(lang: string) {
    setLanguagesSelected((prev) => {
      const n = new Set(prev);
      if (n.has(lang)) n.delete(lang);
      else n.add(lang);
      return n;
    });
  }

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
      const res = await apiFetch("/api/uploads/trainer-profile-photo", {
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

  async function onHrdcCertFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setCertUploadError(null);
    if (!file) return;
    setCertUploading(true);
    const fd = new FormData();
    fd.append("cert", file);
    try {
      const res = await apiFetch("/api/uploads/trainer-hrdc-cert", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const j = (await res.json().catch(() => ({}))) as { certFileUrl?: string; error?: string };
      if (!res.ok) {
        setCertUploadError(j.error ?? "Upload failed.");
        setForm((f) => ({ ...f, certFileUrl: "" }));
        setCertLocalName(null);
        return;
      }
      if (!j.certFileUrl) {
        setCertUploadError("Upload did not return a file URL.");
        setForm((f) => ({ ...f, certFileUrl: "" }));
        setCertLocalName(null);
        return;
      }
      setForm((f) => ({ ...f, certFileUrl: j.certFileUrl! }));
      setCertLocalName(file.name);
    } catch {
      setCertUploadError("Network error while uploading.");
      setForm((f) => ({ ...f, certFileUrl: "" }));
      setCertLocalName(null);
    } finally {
      setCertUploading(false);
    }
  }

  function clearHrdcCert() {
    setForm((f) => ({ ...f, certFileUrl: "" }));
    setCertLocalName(null);
    setCertUploadError(null);
    setCertFileInputKey((k) => k + 1);
  }

  return (
    <form
      className="space-y-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setErr(null);

        if (expertiseTags.length === 0) {
          setErr("Add at least one training expertise.");
          return;
        }
        if (deliveryList.length === 0) {
          setErr("Select at least one training delivery mode.");
          return;
        }
        if (willingToTravel !== "Yes" && willingToTravel !== "No") {
          setErr("Please choose Yes or No for willing to travel.");
          return;
        }
        if (willingToTravel === "Yes" && travelLocations.length === 0) {
          setErr("Add at least one location you can travel to.");
          return;
        }
        if (!form.stateOrLocation) {
          setErr("Select your state.");
          return;
        }
        if (!form.certFileUrl) {
          setErr("Upload your HRDC certificate (PDF, PNG, or JPEG).");
          return;
        }

        setLoading(true);

        const payload = {
          email: form.email,
          password: form.password,
          fullName: form.fullName,
          phone: form.phone,
          bio: form.bio,
          expertise: expertiseTags,
          yearsExp: Number(form.yearsExp),
          linkedIn: form.linkedIn || undefined,
          portfolioUrl: form.portfolioUrl || undefined,
          certFileUrl: form.certFileUrl,
          stateOrLocation: form.stateOrLocation || undefined,
          languages: languagesJoined || undefined,
          deliveryModes: deliveryList,
          willingToTravel,
          travelLocations: willingToTravel === "Yes" ? travelLocations : [],
          profilePhoto: form.profilePhoto,
        };

        const res = await apiFetch("/api/register/trainer", {
          method: "POST",
          headers: { "content-type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });

        setLoading(false);
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          setErr(j?.error ?? "Registration failed");
          return;
        }

        const loginRes = await apiFetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email: form.email, password: form.password }),
        });
        if (!loginRes.ok) {
          setErr("Account created but sign-in failed. Try logging in manually.");
          return;
        }

        navigate("/trainer/dashboard", { replace: true });
      }}
    >
      <RegisterSection title="Add profile photo" titleClassName="text-left">
        <div className="flex flex-col items-stretch gap-4">
          <div className="flex justify-center">
            <div className="relative">
              <input
                ref={photoInputRef}
                id="tr-profile-photo"
                type="file"
                accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                disabled={loading || photoUploading}
                onChange={onProfilePhotoChange}
                className="peer sr-only"
              />
              <label
                htmlFor="tr-profile-photo"
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
          <RegisterField label="Email" htmlFor="reg-email">
            <input
              id="reg-email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={registerInputClass}
            />
          </RegisterField>
          <RegisterField label="Password" htmlFor="reg-password">
            <input
              id="reg-password"
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

      <RegisterSection title="Personal info">
        <RegisterFieldGrid>
          <RegisterField label="Full name" htmlFor="reg-fullName">
            <input
              id="reg-fullName"
              required
              minLength={2}
              placeholder="e.g. Ahmad bin Abdullah"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className={registerInputClass}
            />
          </RegisterField>
          <RegisterField label="Phone number" htmlFor="reg-phone">
            <input
              id="reg-phone"
              required
              minLength={5}
              placeholder="+60123456789"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className={registerInputClass}
            />
          </RegisterField>
          <RegisterField label="State" htmlFor="reg-state">
            <select
              id="reg-state"
              required
              value={form.stateOrLocation}
              onChange={(e) => setForm({ ...form, stateOrLocation: e.target.value })}
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
          <RegisterField label="Languages" wide>
            <p className="mb-3 text-xs text-[color:var(--text-muted)]">
              Select all languages or dialects you can deliver training in.
            </p>
            <div className="grid gap-2 sm:grid-cols-2" role="group" aria-label="Training languages">
              {MALAYSIA_TRAINING_LANGUAGES.map((lang) => (
                <label
                  key={lang}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-sky-100 bg-white px-3 py-2 text-sm text-[color:var(--text)] hover:bg-sky-50/60"
                >
                  <input
                    type="checkbox"
                    checked={languagesSelected.has(lang)}
                    onChange={() => toggleLanguage(lang)}
                    className="h-4 w-4 shrink-0 rounded border-[color:var(--border)] text-sky-600"
                  />
                  {lang}
                </label>
              ))}
            </div>
          </RegisterField>
        </RegisterFieldGrid>
      </RegisterSection>

      <RegisterSection title="Professional background">
        <RegisterFieldGrid>
          <RegisterField label="Years of experience" htmlFor="reg-years">
            <input
              id="reg-years"
              type="number"
              required
              min={0}
              max={80}
              value={form.yearsExp}
              onChange={(e) => setForm({ ...form, yearsExp: Number(e.target.value) })}
              className={registerInputClass}
            />
          </RegisterField>

          <RegisterField label="Training expertise" htmlFor="reg-expertise-draft" wide>
            <p className="mb-3 text-xs text-[color:var(--text-muted)]">
              Add the topics, skills, or programme areas you are qualified to train (for example: leadership, HR
              compliance, digital skills, or safety)
            </p>
            <TagListEditor
              tags={expertiseTags}
              onChange={setExpertiseTags}
              placeholder="e.g. Digital Skills"
            />
          </RegisterField>

          <RegisterField label="Training delivery mode" wide>
            <p className="mb-3 text-xs text-[color:var(--text-muted)]">
              Select all that apply.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {DELIVERY_MODE_OPTIONS.map((opt) => (
                <label
                  key={opt}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-sky-100 bg-white px-3 py-2 text-sm text-[color:var(--text)] hover:bg-sky-50/60"
                >
                  <input
                    type="checkbox"
                    checked={deliveryModes.has(opt)}
                    onChange={() => toggleDelivery(opt)}
                    className="h-4 w-4 rounded border-[color:var(--border)] text-sky-600"
                  />
                  {opt}
                </label>
              ))}
            </div>
          </RegisterField>

          <RegisterField label="Willing to travel" wide>
            <div className="flex flex-wrap gap-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[color:var(--text)]">
                <input
                  type="radio"
                  name="reg-willing"
                  checked={willingToTravel === "Yes"}
                  onChange={() => setWillingToTravel("Yes")}
                  className="h-4 w-4 border-[color:var(--border)] text-sky-600"
                />
                Yes
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[color:var(--text)]">
                <input
                  type="radio"
                  name="reg-willing"
                  checked={willingToTravel === "No"}
                  onChange={() => {
                    setWillingToTravel("No");
                    setTravelLocations([]);
                  }}
                  className="h-4 w-4 border-[color:var(--border)] text-sky-600"
                />
                No
              </label>
            </div>
            {willingToTravel === "Yes" ? (
              <div
                className={cn(
                  "mt-4 rounded-lg border border-dashed border-sky-200 bg-sky-50/50 p-3",
                )}
              >
                <div className="text-xs font-medium uppercase tracking-wide text-[color:var(--text-muted)]">
                  Where can you travel?
                </div>
                <p className="mt-1 text-xs text-[color:var(--text-muted)]">
                  Add regions or cities (e.g. Klang Valley, Penang).
                </p>
                <div className="mt-3">
                  <TagListEditor
                    tags={travelLocations}
                    onChange={setTravelLocations}
                    placeholder="Add a location and press Enter"
                  />
                </div>
              </div>
            ) : null}
          </RegisterField>

          <RegisterField label="LinkedIn profile" htmlFor="reg-li">
            <input
              id="reg-li"
              type="text"
              inputMode="url"
              placeholder="https://linkedin.com/in/…"
              value={form.linkedIn}
              onChange={(e) => setForm({ ...form, linkedIn: e.target.value })}
              className={registerInputClass}
            />
          </RegisterField>
          <RegisterField label="Website / portfolio URL" htmlFor="reg-portfolio">
            <input
              id="reg-portfolio"
              type="text"
              inputMode="url"
              placeholder="https://…"
              value={form.portfolioUrl}
              onChange={(e) => setForm({ ...form, portfolioUrl: e.target.value })}
              className={registerInputClass}
            />
          </RegisterField>
          <RegisterField label="Professional bio" htmlFor="reg-bio" wide>
            <textarea
              id="reg-bio"
              required
              minLength={10}
              rows={5}
              placeholder="Describe your background, achievements, and training style…"
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              className={registerTextareaClass}
            />
          </RegisterField>
        </RegisterFieldGrid>
      </RegisterSection>

      <RegisterSection title="HRDC certification">
        <RegisterField label="Certificate file" wide>
          <p className="mb-3 text-xs text-[color:var(--text-muted)]">
            Upload your HRD Corp trainer certificate as a PDF or image (PNG, JPEG), max 10MB.
          </p>
          <input
            key={certFileInputKey}
            type="file"
            accept=".pdf,application/pdf,image/png,image/jpeg"
            disabled={loading || certUploading}
            onChange={onHrdcCertFileChange}
            className={cn(
              "block w-full cursor-pointer text-sm text-[color:var(--text)] file:mr-4 file:rounded-lg file:border file:border-[color:var(--border)] file:bg-white file:px-3 file:py-2 file:text-sm file:font-medium file:text-[color:var(--text)] hover:file:bg-[color:var(--surface-muted)] disabled:cursor-not-allowed disabled:opacity-60",
            )}
          />
          {certUploading ? (
            <p className="mt-2 text-xs text-[color:var(--text-muted)]">Uploading…</p>
          ) : null}
          {certUploadError ? <p className="mt-2 text-xs text-red-600">{certUploadError}</p> : null}
          {form.certFileUrl && certLocalName ? (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <p className="text-sm text-[color:var(--text)]">
                <span className="font-medium text-[color:var(--text-muted)]">Selected: </span>
                {certLocalName}
              </p>
              <button
                type="button"
                onClick={clearHrdcCert}
                disabled={loading || certUploading}
                className="rounded-lg border border-[color:var(--border)] bg-white px-3 py-1.5 text-sm font-medium text-[color:var(--text)] hover:bg-[color:var(--surface-muted)] disabled:opacity-50"
              >
                Remove file
              </button>
            </div>
          ) : null}
        </RegisterField>
      </RegisterSection>

      {err ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {err}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={loading || certUploading || photoUploading}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[color:var(--primary)] to-[#163a66] px-4 text-sm font-semibold text-[color:var(--primary-foreground)] shadow-md transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Creating…" : "Create trainer account"}
      </button>
    </form>
  );
}
