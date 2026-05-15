import { useEffect, useRef, useState } from "react";
import { apiAssetUrl, apiFetch } from "@/lib/api";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-widgets";
import { PageHeaderIconSettings } from "@/components/dashboard/page-header-icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type PaymentSettings = {
  bankName: string | null;
  accountName: string | null;
  accountNumber: string | null;
  amount: number;
  qrImageUrl: string | null;
  updatedAt?: string;
};

const EMPTY: PaymentSettings = {
  bankName: "",
  accountName: "",
  accountNumber: "",
  amount: 99,
  qrImageUrl: null,
};

export default function AdminSettingsPage() {
  const [form, setForm] = useState<PaymentSettings>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    void apiFetch("/api/payment-settings", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { paymentSettings?: PaymentSettings } | null) => {
        if (cancelled) return;
        if (d?.paymentSettings) {
          setForm({
            bankName: d.paymentSettings.bankName ?? "",
            accountName: d.paymentSettings.accountName ?? "",
            accountNumber: d.paymentSettings.accountNumber ?? "",
            amount:
              typeof d.paymentSettings.amount === "number"
                ? d.paymentSettings.amount
                : 99,
            qrImageUrl: d.paymentSettings.qrImageUrl ?? null,
          });
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const onChange =
    (key: keyof PaymentSettings) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setForm((prev) => ({
        ...prev,
        [key]: key === "amount" ? Number(value || "0") : value,
      }));
    };

  async function handleUploadQr(file: File) {
    setError(null);
    setUploading(true);
    try {
      const body = new FormData();
      body.append("photo", file);
      const res = await apiFetch("/api/admin/uploads/payment-qr", {
        method: "POST",
        credentials: "include",
        body,
      });
      const data = (await res.json().catch(() => null)) as
        | { qrImageUrl?: string; error?: string }
        | null;
      if (!res.ok || !data?.qrImageUrl) {
        setError(data?.error || "Failed to upload QR image.");
        return;
      }
      setForm((prev) => ({ ...prev, qrImageUrl: data.qrImageUrl ?? null }));
    } catch {
      setError("Failed to upload QR image.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSave() {
    setError(null);
    setSavedAt(null);
    setSaving(true);
    try {
      const res = await apiFetch("/api/admin/payment-settings", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankName: form.bankName?.trim() || null,
          accountName: form.accountName?.trim() || null,
          accountNumber: form.accountNumber?.trim() || null,
          amount: Number.isFinite(form.amount) ? form.amount : 99,
          qrImageUrl: form.qrImageUrl ?? null,
        }),
      });
      const data = (await res.json().catch(() => null)) as
        | { paymentSettings?: PaymentSettings; error?: string }
        | null;
      if (!res.ok) {
        setError(data?.error || "Failed to save payment settings.");
        return;
      }
      if (data?.paymentSettings) {
        setForm({
          bankName: data.paymentSettings.bankName ?? "",
          accountName: data.paymentSettings.accountName ?? "",
          accountNumber: data.paymentSettings.accountNumber ?? "",
          amount:
            typeof data.paymentSettings.amount === "number"
              ? data.paymentSettings.amount
              : 99,
          qrImageUrl: data.paymentSettings.qrImageUrl ?? null,
        });
      }
      setSavedAt(new Date().toLocaleTimeString());
    } catch {
      setError("Failed to save payment settings.");
    } finally {
      setSaving(false);
    }
  }

  async function handleClearQr() {
    setForm((prev) => ({ ...prev, qrImageUrl: null }));
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Settings"
        description="Configure bank details, QR code, and subscription pricing."
        icon={<PageHeaderIconSettings />}
      />
      <Card>
        <CardContent className="pt-6">
          <div className="rounded-xl border border-[color:var(--border)] bg-white p-6">
            <div className="text-sm font-semibold text-[color:var(--text)]">
              Bank details &amp; QR code
            </div>
            <p className="mt-1 text-sm text-[color:var(--text-muted)]">
              Payment details shown to companies on their subscription page.
            </p>

            <div className="mt-6 grid gap-8 md:grid-cols-2 md:gap-10">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-[color:var(--text)]">
                  QR code
                </div>
                <p className="mt-1 text-sm text-[color:var(--text-muted)]">
                  Choose a PNG or JPG (max 5MB).
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-[color:var(--border)] bg-white px-4 py-2.5 text-sm font-medium text-[color:var(--text)] shadow-sm transition-colors hover:border-neutral-200 hover:bg-neutral-100 focus-within:outline-none focus-within:ring-2 focus-within:ring-neutral-200">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void handleUploadQr(file);
                      }}
                      disabled={uploading || loading}
                    />
                    {uploading
                      ? "Uploading…"
                      : form.qrImageUrl
                        ? "Replace file"
                        : "Choose file"}
                  </label>
                  {form.qrImageUrl ? (
                    <button
                      type="button"
                      onClick={handleClearQr}
                      className="text-sm font-medium text-[color:var(--danger)] hover:underline"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
                <div className="mt-4 flex h-64 items-center justify-center overflow-hidden rounded-lg border border-dashed border-[color:var(--border)] bg-white p-3 text-sm text-[color:var(--text-muted)]">
                  {form.qrImageUrl ? (
                    <img
                      src={apiAssetUrl(form.qrImageUrl)}
                      alt="QR code preview"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <span>QR preview</span>
                  )}
                </div>
                <div className="mt-2 text-center text-xs font-medium text-[color:var(--text-muted)]">
                  QR code
                </div>
              </div>

              <div className="min-w-0">
                <div className="text-sm font-semibold text-[color:var(--text)]">
                  Bank details
                </div>
                <div className="mt-3 grid gap-3">
                  <Field
                    label="Bank name"
                    placeholder="Maybank"
                    value={form.bankName ?? ""}
                    onChange={onChange("bankName")}
                    disabled={loading}
                  />
                  <Field
                    label="Account name"
                    placeholder="HRDC Trainer Marketplace"
                    value={form.accountName ?? ""}
                    onChange={onChange("accountName")}
                    disabled={loading}
                  />
                  <Field
                    label="Account number"
                    placeholder="1234 5678 90"
                    value={form.accountNumber ?? ""}
                    onChange={onChange("accountNumber")}
                    disabled={loading}
                  />
                  <Field
                    label="Subscription amount (RM)"
                    placeholder="99"
                    type="number"
                    value={String(form.amount ?? 99)}
                    onChange={onChange("amount")}
                    disabled={loading}
                  />
                </div>
                {error ? (
                  <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                  </div>
                ) : null}
                {savedAt ? (
                  <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                    Payment details saved
                  </div>
                ) : null}
                <div className="mt-6 flex justify-end">
                  <Button
                    type="button"
                    onClick={handleSave}
                    disabled={saving || loading}
                  >
                    {saving ? "Saving…" : "Save"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  disabled,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      <input
        className="h-10 w-full rounded-md border border-[color:var(--border)] bg-white px-3 text-sm text-[color:var(--text)] focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)] disabled:opacity-60"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        type={type}
        disabled={disabled}
        min={type === "number" ? 0 : undefined}
        step={type === "number" ? "0.01" : undefined}
      />
    </div>
  );
}
