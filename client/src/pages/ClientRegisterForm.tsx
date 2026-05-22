"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";

import { Link } from "@/components/link";
import { ClientProfileDetailFields } from "@/components/client/client-profile-detail-fields";
import {
  RegisterField,
  RegisterFieldGrid,
  RegisterSection,
  registerInputClass,
} from "@/components/register/register-form-primitives";
import { RegisterStepper } from "@/components/register/register-stepper";
import {
  CLIENT_REGISTER_STEPS,
  DESCRIBES_YOU_OPTIONS,
  profileTypeLabel,
  validateProfileDetailFields,
  type ClientProfileData,
  type ClientProfileType,
  type DescribesYouKey,
} from "@/lib/client-profile";
import { cn } from "@/components/ui/button";

const LAST_STEP = CLIENT_REGISTER_STEPS.length - 1;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email.trim());
}

function isValidPhone(phone: string): boolean {
  const trimmed = phone.trim();
  if (!/^\+?\d[\d\s-]*$/.test(trimmed)) return false;
  const digits = trimmed.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15;
}

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

  const [describesYou, setDescribesYou] = useState<DescribesYouKey | "">("");
  const [profileType, setProfileType] = useState<ClientProfileType>("COMPANY");
  const [profileData, setProfileData] = useState<ClientProfileData>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [maxReachableStep, setMaxReachableStep] = useState(0);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
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

  function selectDescribesYou(key: DescribesYouKey) {
    setDescribesYou(key);
    const opt = DESCRIBES_YOU_OPTIONS.find((o) => o.key === key);
    if (opt) {
      setProfileType(opt.profileType);
      setProfileData({});
    }
  }

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
    if (photoInputRef.current) photoInputRef.current.value = "";
  }

  const profilePhotoPreviewSrc = photoPreviewBlobUrl ?? form.profilePhoto ?? null;

  function validateStep(step: number): string | null {
    switch (step) {
      case 0:
        if (!describesYou) return "Select what best describes you.";
        return null;
      case 1: {
        if (!form.fullName.trim() || form.fullName.trim().length < 2) {
          return "Full name is required.";
        }
        if (!form.email.trim()) return "Email is required.";
        if (!isValidEmail(form.email)) return "Enter a valid email address.";
        if (!form.phone.trim()) return "Phone number is required.";
        if (!isValidPhone(form.phone)) {
          return "Enter a valid phone number (8–15 digits).";
        }
        if (!form.password) return "Password is required.";
        if (form.password.length < 8) return "Password must be at least 8 characters.";
        if (form.password !== form.confirmPassword) return "Passwords do not match.";
        if (!profileType) return "Profile type is required.";
        return null;
      }
      case 2:
        return validateProfileDetailFields(profileType, profileData);
      default:
        return null;
    }
  }

  function goToStep(step: number) {
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleNext() {
    const message = validateStep(currentStep);
    if (message) {
      setErr(message);
      return;
    }
    setErr(null);
    const next = Math.min(currentStep + 1, LAST_STEP);
    setMaxReachableStep((prev) => Math.max(prev, next));
    goToStep(next);
  }

  function handleBack() {
    setErr(null);
    goToStep(Math.max(0, currentStep - 1));
  }

  function handleStepClick(index: number) {
    if (index === currentStep) return;
    if (index > currentStep) {
      for (let s = currentStep; s < index; s++) {
        const message = validateStep(s);
        if (message) {
          setErr(message);
          return;
        }
      }
    }
    setErr(null);
    setMaxReachableStep((prev) => Math.max(prev, index));
    goToStep(index);
  }

  const describesYouLabel =
    DESCRIBES_YOU_OPTIONS.find((o) => o.key === describesYou)?.label ??
    profileTypeLabel(profileType);

  return (
    <form
      className="space-y-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setErr(null);
        setOk(null);

        for (let s = 0; s <= LAST_STEP; s++) {
          const message = validateStep(s);
          if (message) {
            setErr(message);
            setMaxReachableStep((prev) => Math.max(prev, s));
            goToStep(s);
            return;
          }
        }

        setLoading(true);
        const res = await apiFetch("/api/register/client", {
          method: "POST",
          headers: { "content-type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            email: form.email.trim(),
            password: form.password,
            fullName: form.fullName.trim(),
            phone: form.phone.trim(),
            profileType,
            profilePhoto: form.profilePhoto,
            profileData: { ...profileData, describesYou: describesYou || undefined },
          }),
        });

        setLoading(false);
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          setErr((j as { error?: string })?.error ?? "Registration failed");
          return;
        }
        setOk("Account created. You can now login.");
      }}
    >
      <RegisterStepper
        steps={CLIENT_REGISTER_STEPS}
        currentStep={currentStep}
        maxReachableStep={maxReachableStep}
        onStepClick={handleStepClick}
      />

      {currentStep === 0 ? (
        <RegisterSection title="What best describes you?" hideTitle>
          <p className="mb-4 text-sm text-[color:var(--text-muted)]">
            Choose the option that fits you best. We will ask for relevant details in the next
            step.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {DESCRIBES_YOU_OPTIONS.map((opt) => {
              const selected = describesYou === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => selectDescribesYou(opt.key)}
                  className={cn(
                    "rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors",
                    selected
                      ? "border-sky-500 bg-sky-50 text-sky-900 ring-2 ring-sky-200"
                      : "border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text)] hover:border-sky-300",
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </RegisterSection>
      ) : null}

      {currentStep === 1 ? (
        <RegisterSection title="Basic account" hideTitle>
          <div className="flex flex-col items-stretch gap-6">
            <div className="flex flex-col items-stretch gap-4 border-b border-[color:var(--border)] pb-6">
              <div className="text-xs font-medium uppercase tracking-wide text-[color:var(--text-muted)]">
                Profile photo / logo <span className="font-normal normal-case">(optional)</span>
              </div>
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
                        <span className="text-[10px] font-medium uppercase tracking-wide">
                          Add photo
                        </span>
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
              {photoUploadError ? (
                <p className="text-center text-xs text-red-600">{photoUploadError}</p>
              ) : null}
              {profilePhotoPreviewSrc ? (
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={clearProfilePhoto}
                    disabled={loading || photoUploading}
                    className="rounded-lg border border-[color:var(--border)] bg-white px-3 py-1.5 text-sm font-medium text-[color:var(--text)] hover:bg-gray-100 disabled:opacity-50"
                  >
                    Remove photo
                  </button>
                </div>
              ) : null}
            </div>

            <RegisterFieldGrid>
              <RegisterField label="Full name" htmlFor="co-fullName" required>
                <input
                  id="co-fullName"
                  required
                  minLength={2}
                  autoComplete="name"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className={registerInputClass}
                />
              </RegisterField>
              <RegisterField label="Email" htmlFor="co-email" required>
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
              <RegisterField label="Phone number" htmlFor="co-phone" required>
                <input
                  id="co-phone"
                  required
                  placeholder="+60123456789"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className={registerInputClass}
                />
              </RegisterField>
              <RegisterField label="Password" htmlFor="co-password" required>
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
              <RegisterField label="Confirm password" htmlFor="co-confirm" required>
                <input
                  id="co-confirm"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  className={registerInputClass}
                />
              </RegisterField>
              <RegisterField label="Profile type" htmlFor="co-profile-type" required>
                <div
                  id="co-profile-type"
                  className="flex h-10 items-center rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)]/60 px-3 text-sm text-[color:var(--text)]"
                  aria-readonly="true"
                >
                  {describesYouLabel || "—"}
                </div>
              </RegisterField>
            </RegisterFieldGrid>
          </div>
        </RegisterSection>
      ) : null}

      {currentStep === 2 ? (
        <RegisterSection title="Profile details" hideTitle>
          <ClientProfileDetailFields
            profileType={profileType}
            profileData={profileData}
            onChange={setProfileData}
          />
        </RegisterSection>
      ) : null}

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

      <div className="flex flex-wrap items-center justify-between gap-3">
        {currentStep > 0 ? (
          <button
            type="button"
            onClick={handleBack}
            disabled={loading || photoUploading}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-[color:var(--border)] bg-white px-4 text-sm font-medium text-[color:var(--text)] hover:bg-gray-50 disabled:opacity-50"
          >
            Back
          </button>
        ) : (
          <span />
        )}
        {currentStep < LAST_STEP ? (
          <button
            type="button"
            onClick={handleNext}
            disabled={loading || photoUploading}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-sky-600 px-4 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
          >
            Next
          </button>
        ) : (
          <button
            type="submit"
            disabled={loading || photoUploading}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-gradient-to-r from-[color:var(--primary)] to-[#163a66] px-5 text-sm font-semibold text-[color:var(--primary-foreground)] shadow-md hover:opacity-95 disabled:opacity-50"
          >
            {loading ? "Creating…" : "Create employer account"}
          </button>
        )}
      </div>
    </form>
  );
}
