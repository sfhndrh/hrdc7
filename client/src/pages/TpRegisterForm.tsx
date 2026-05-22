"use client";

import { useNavigate } from "react-router-dom";
import { apiAssetUrl, apiFetch } from "@/lib/api";
import { useEffect, useRef, useState } from "react";

import {
  RegisterField,
  RegisterFieldGrid,
  RegisterSection,
  registerInputClass,
  registerTextareaClass,
} from "@/components/register/register-form-primitives";
import { RegisterStepper } from "@/components/register/register-stepper";
import { Button, cn } from "@/components/ui/button";

const STEPS = ["Account", "Company", "Contact Person", "Verification"] as const;
const LAST = STEPS.length - 1;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function revokeBlobPreview(url: string | null) {
  if (url) URL.revokeObjectURL(url);
}

async function uploadFile(endpoint: string, file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await apiFetch(endpoint, { method: "POST", body: fd });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(typeof j?.error === "string" ? j.error : "Upload failed");
  }
  const j = (await res.json()) as { url: string };
  return j.url;
}

export function TpRegisterForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [maxReachable, setMaxReachable] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [logoPreviewBlobUrl, setLogoPreviewBlobUrl] = useState<string | null>(null);
  const [logoLocalName, setLogoLocalName] = useState<string | null>(null);
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const logoBlobUnmountRef = useRef<string | null>(null);

  const [form, setForm] = useState({
    email: "",
    password: "",
    companyName: "",
    companyEmail: "",
    phone: "",
    address: "",
    website: "",
    hrdcTpId: "",
    description: "",
    logoUrl: null as string | null,
    picName: "",
    picEmail: "",
    picPhone: "",
    ssmCertUrl: "",
    hrdcDocUrl: "",
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  useEffect(() => {
    return () => revokeBlobPreview(logoBlobUnmountRef.current);
  }, []);

  const logoPreviewSrc =
    logoPreviewBlobUrl ?? (form.logoUrl ? apiAssetUrl(form.logoUrl) : null);

  async function onLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setLogoUploadError(null);
    if (!file) return;

    revokeBlobPreview(logoPreviewBlobUrl);
    const blobUrl = URL.createObjectURL(file);
    logoBlobUnmountRef.current = blobUrl;
    setLogoPreviewBlobUrl(blobUrl);
    setLogoLocalName(file.name);

    setUploading("logoUrl");
    try {
      const url = await uploadFile("/api/uploads/tp-logo", file);
      revokeBlobPreview(blobUrl);
      logoBlobUnmountRef.current = null;
      setLogoPreviewBlobUrl(null);
      set("logoUrl", url);
      setLogoLocalName(file.name);
    } catch (uploadErr) {
      setLogoUploadError(uploadErr instanceof Error ? uploadErr.message : "Upload failed");
      set("logoUrl", null);
      setLogoLocalName(null);
      revokeBlobPreview(blobUrl);
      setLogoPreviewBlobUrl(null);
      logoBlobUnmountRef.current = null;
    } finally {
      setUploading(null);
      e.target.value = "";
    }
  }

  function clearLogo() {
    revokeBlobPreview(logoPreviewBlobUrl);
    logoBlobUnmountRef.current = null;
    setLogoPreviewBlobUrl(null);
    set("logoUrl", null);
    setLogoLocalName(null);
    setLogoUploadError(null);
    if (logoInputRef.current) logoInputRef.current.value = "";
  }

  function validateStep(s: number): string | null {
    if (s === 0) {
      if (!EMAIL_PATTERN.test(form.email)) return "Enter a valid login email.";
      if (form.password.length < 8) return "Password must be at least 8 characters.";
      return null;
    }
    if (s === 1) {
      if (!form.companyName.trim()) return "Company name is required.";
      if (!EMAIL_PATTERN.test(form.companyEmail)) return "Valid company email required.";
      if (form.phone.trim().length < 5) return "Phone number is required.";
      if (form.address.trim().length < 5) return "Company address is required.";
      return null;
    }
    if (s === 2) {
      if (!form.picName.trim()) return "Name is required.";
      if (!EMAIL_PATTERN.test(form.picEmail)) return "Valid email required.";
      if (form.picPhone.trim().length < 5) return "Phone number is required.";
      return null;
    }
    if (s === 3) {
      if (!form.hrdcTpId.trim()) return "HRDC Training Provider ID is required.";
      if (!form.ssmCertUrl) return "Upload SSM Certificate.";
      if (!form.hrdcDocUrl) return "Upload HRDC Training Provider Registration Certificate.";
      return null;
    }
    return null;
  }

  async function handleDocUpload(
    field: "ssmCertUrl" | "hrdcDocUrl",
    file: File | null,
    endpoint: string,
  ) {
    if (!file) return;
    setUploading(field);
    setErr(null);
    try {
      const url = await uploadFile(endpoint, file);
      set(field, url);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(null);
    }
  }

  async function submit() {
    const v = validateStep(3);
    if (v) {
      setErr(v);
      return;
    }
    setLoading(true);
    setErr(null);
    const res = await apiFetch("/api/register/tp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.email.trim(),
        password: form.password,
        companyName: form.companyName.trim(),
        companyEmail: form.companyEmail.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        website: form.website.trim() || undefined,
        hrdcTpId: form.hrdcTpId.trim(),
        description: form.description.trim() || undefined,
        logoUrl: form.logoUrl,
        picName: form.picName.trim(),
        picEmail: form.picEmail.trim(),
        picPhone: form.picPhone.trim(),
        ssmCertUrl: form.ssmCertUrl,
        hrdcDocUrl: form.hrdcDocUrl,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as {
        error?: string;
        details?: { fieldErrors?: Record<string, string[]> };
      };
      const fieldMsg = j.details?.fieldErrors
        ? Object.entries(j.details.fieldErrors)
            .flatMap(([k, v]) => (v ?? []).map((m) => `${k}: ${m}`))
            .join("; ")
        : "";
      setErr(
        [typeof j?.error === "string" ? j.error : res.status === 409 ? "Email already registered" : "Registration failed", fieldMsg]
          .filter(Boolean)
          .join(" — "),
      );
      return;
    }
    navigate("/login?registered=tp");
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (step < LAST) {
          const v = validateStep(step);
          if (v) {
            setErr(v);
            return;
          }
          setErr(null);
          const next = step + 1;
          setStep(next);
          setMaxReachable((m) => Math.max(m, next));
          return;
        }
        void submit();
      }}
    >
      <RegisterStepper
        steps={[...STEPS]}
        currentStep={step}
        maxReachableStep={maxReachable}
        onStepClick={(i) => {
          if (i <= maxReachable) {
            setErr(null);
            setStep(i);
          }
        }}
      />

      {err ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{err}</p>
      ) : null}

      {step === 0 ? (
        <RegisterSection title="Login credentials">
          <RegisterFieldGrid>
            <RegisterField label="Email" required>
              <input
                className={registerInputClass}
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                autoComplete="email"
              />
            </RegisterField>
            <RegisterField label="Password" required>
              <input
                className={registerInputClass}
                type="password"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                autoComplete="new-password"
              />
            </RegisterField>
          </RegisterFieldGrid>
        </RegisterSection>
      ) : null}

      {step === 1 ? (
        <RegisterSection title="Company information">
          <div className="mb-6 flex flex-col items-stretch gap-4 border-b border-[color:var(--border)] pb-6">
            <div className="text-xs font-medium uppercase tracking-wide text-[color:var(--text-muted)]">
              Company logo
            </div>
            <div className="flex justify-center">
              <div className="relative">
                <input
                  ref={logoInputRef}
                  id="tp-company-logo"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                  disabled={loading || uploading === "logoUrl"}
                  onChange={(e) => void onLogoChange(e)}
                  className="peer sr-only"
                />
                <label
                  htmlFor="tp-company-logo"
                  aria-label={logoPreviewSrc ? "Change company logo" : "Add company logo"}
                  className={cn(
                    "relative flex h-28 w-28 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 transition-[border-color,background-color,ring-color]",
                    logoPreviewSrc
                      ? "border-[color:var(--border)] bg-[color:var(--surface-muted)] hover:ring-2 hover:ring-gray-300"
                      : "border-dashed border-gray-300 bg-[color:var(--surface-muted)]/50 hover:border-gray-400 hover:bg-gray-100",
                    (loading || uploading === "logoUrl") && "pointer-events-none opacity-60",
                  )}
                >
                  {logoPreviewSrc ? (
                    <img src={logoPreviewSrc} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex flex-col items-center gap-1 text-[color:var(--text-muted)]">
                      <span
                        className="grid h-10 w-10 place-items-center rounded-full bg-white text-xl font-light leading-none text-[color:var(--text)] shadow-inner ring-1 ring-gray-200"
                        aria-hidden
                      >
                        +
                      </span>
                      <span className="text-[10px] font-medium uppercase tracking-wide">Add logo</span>
                    </span>
                  )}
                </label>
                {uploading === "logoUrl" ? (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-white/65 text-xs font-medium text-[color:var(--text)] backdrop-blur-[2px]">
                    Uploading…
                  </div>
                ) : null}
              </div>
            </div>
            <p className="text-center text-xs text-[color:var(--text-muted)]">
              Optional. PNG or JPEG · max 10MB. Tap the circle to add or change your logo.
            </p>
            <div className="flex flex-col items-center gap-2 text-center">
              {logoUploadError ? (
                <p className="text-xs text-red-600">{logoUploadError}</p>
              ) : logoPreviewSrc ? (
                <>
                  {logoLocalName ? (
                    <p className="max-w-[18rem] text-xs text-[color:var(--text-muted)]">
                      <span className="font-semibold text-[color:var(--text)]">{logoLocalName}</span>
                      {uploading === "logoUrl" ? " · finishing upload…" : null}
                    </p>
                  ) : form.logoUrl ? (
                    <p className="text-xs text-[color:var(--text-muted)]">Tap circle to replace</p>
                  ) : null}
                  <button
                    type="button"
                    onClick={clearLogo}
                    disabled={loading || uploading === "logoUrl"}
                    className="rounded-lg border border-[color:var(--border)] bg-white px-3 py-1.5 text-sm font-medium text-[color:var(--text)] hover:bg-gray-100 disabled:opacity-50"
                  >
                    Remove logo
                  </button>
                </>
              ) : null}
            </div>
          </div>
          <RegisterFieldGrid>
            <RegisterField label="Company name" required>
              <input className={registerInputClass} value={form.companyName} onChange={(e) => set("companyName", e.target.value)} />
            </RegisterField>
            <RegisterField label="Company email" required>
              <input className={registerInputClass} type="email" value={form.companyEmail} onChange={(e) => set("companyEmail", e.target.value)} />
            </RegisterField>
            <RegisterField label="Phone number" required>
              <input className={registerInputClass} value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </RegisterField>
            <RegisterField label="Company address" required wide>
              <textarea className={registerTextareaClass} rows={3} value={form.address} onChange={(e) => set("address", e.target.value)} />
            </RegisterField>
            <RegisterField label="Website">
              <input className={registerInputClass} value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://" />
            </RegisterField>
            <RegisterField label="Company description" wide>
              <textarea className={registerTextareaClass} rows={4} value={form.description} onChange={(e) => set("description", e.target.value)} />
            </RegisterField>
          </RegisterFieldGrid>
        </RegisterSection>
      ) : null}

      {step === 2 ? (
        <RegisterSection title="Contact Person">
          <RegisterFieldGrid>
            <RegisterField label="Name" required>
              <input className={registerInputClass} value={form.picName} onChange={(e) => set("picName", e.target.value)} />
            </RegisterField>
            <RegisterField label="Email" required>
              <input className={registerInputClass} type="email" value={form.picEmail} onChange={(e) => set("picEmail", e.target.value)} />
            </RegisterField>
            <RegisterField label="Phone number" required>
              <input className={registerInputClass} value={form.picPhone} onChange={(e) => set("picPhone", e.target.value)} />
            </RegisterField>
          </RegisterFieldGrid>
        </RegisterSection>
      ) : null}

      {step === 3 ? (
        <RegisterSection title="Verification documents">
          <p className="mb-4 text-sm text-[color:var(--text-muted)]">
            Upload PDF or image files (max 10MB each). Required for admin approval.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <DocUploadField
              title="SSM Certificate"
              required
              url={form.ssmCertUrl}
              busy={uploading === "ssmCertUrl"}
              onFile={(f) => void handleDocUpload("ssmCertUrl", f, "/api/uploads/tp-verification")}
            />
            <DocUploadField
              title="HRDC Training Provider Registration Certificate"
              required
              url={form.hrdcDocUrl}
              busy={uploading === "hrdcDocUrl"}
              onFile={(f) => void handleDocUpload("hrdcDocUrl", f, "/api/uploads/tp-verification")}
            />
          </div>
          <div className="mt-4">
            <RegisterField label="HRDC Training Provider ID" required>
              <input
                className={registerInputClass}
                value={form.hrdcTpId}
                onChange={(e) => set("hrdcTpId", e.target.value)}
              />
            </RegisterField>
          </div>
        </RegisterSection>
      ) : null}

      <div className="flex flex-wrap justify-between gap-3 border-t border-[color:var(--border)] pt-4">
        <button
          type="button"
          className={cn(
            "rounded-lg border border-[color:var(--border)] px-4 py-2 text-sm font-semibold text-[color:var(--text)]",
            step === 0 && "invisible",
          )}
          onClick={() => {
            setErr(null);
            setStep((s) => Math.max(0, s - 1));
          }}
        >
          Back
        </button>
        <button
          type="submit"
          disabled={loading || uploading !== null}
          className="rounded-lg bg-[color:var(--primary)] px-5 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60"
        >
          {loading ? "Submitting…" : step < LAST ? "Continue" : "Submit application"}
        </button>
      </div>
    </form>
  );
}

function FileChooseButton({
  label,
  busy,
  onFile,
}: {
  label: string;
  busy: boolean;
  onFile: (f: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        accept=".pdf,.png,.jpg,.jpeg,.webp"
        disabled={busy}
        onChange={(e) => {
          onFile(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? "Uploading…" : label}
      </Button>
    </>
  );
}

function DocUploadField({
  title,
  url,
  busy,
  required,
  onFile,
}: {
  title: string;
  url: string;
  busy: boolean;
  required?: boolean;
  onFile: (f: File | null) => void;
}) {
  return (
    <div className="rounded-xl border border-[color:var(--border)] p-4">
      <div className="text-sm font-semibold text-[color:var(--text)]">
        {title}
        {required ? <span className="ml-0.5 font-normal text-red-600">*</span> : null}
      </div>
      {url ? (
        <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">Uploaded ✓</p>
      ) : null}
      <div className="mt-3">
        <FileChooseButton
          label={url ? "Replace file" : "Choose file"}
          busy={busy}
          onFile={onFile}
        />
      </div>
    </div>
  );
}
