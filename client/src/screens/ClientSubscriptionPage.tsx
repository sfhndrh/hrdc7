"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiAssetUrl, apiFetch } from "@/lib/api";
import {
  EMPLOYER_PLAN_COMPARE_HEADING,
  EMPLOYER_PLAN_COMPARE_SUBTITLE,
  EMPLOYER_PLAN_FREE,
  EMPLOYER_PLAN_PRO,
} from "@/lib/employer-subscription-plans";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-widgets";
import { PageHeaderIconReceipt } from "@/components/dashboard/page-header-icons";
import { Button } from "@/components/ui/button";

type PlanKey = "free" | "pro";

type PaymentSettings = {
  bankName: string | null;
  accountName: string | null;
  accountNumber: string | null;
  amount: number;
  qrImageUrl: string | null;
};

const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  bankName: null,
  accountName: null,
  accountNumber: null,
  amount: 99,
  qrImageUrl: null,
};

type PaymentHistoryItem = {
  id: string;
  amount: number;
  proofUrl: string | null;
  notes: string | null;
  status: string;
  submittedAt: string;
  reviewedAt: string | null;
};

type SubscriptionInfo = {
  status: string;
  amount: number | null;
  paidAt: string | null;
  expiresAt: string | null;
};

export default function ClientSubscriptionPage() {
  const [subscribed, setSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(
    null,
  );
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>("free");
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>(
    DEFAULT_PAYMENT_SETTINGS,
  );
  const [history, setHistory] = useState<PaymentHistoryItem[] | null>(null);

  const cancelSubscription = useCallback(async () => {
    const res = await apiFetch("/api/client/subscription/cancel", {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as
        | { error?: string }
        | null;
      throw new Error(data?.error || "Failed to cancel subscription.");
    }
    const data = (await res.json().catch(() => null)) as {
      expiresAt?: string;
    } | null;
    setSubscribed(false);
    setSelectedPlan("free");
    setSubscription((prev) =>
      prev
        ? {
            ...prev,
            status: "EXPIRED",
            expiresAt: data?.expiresAt ?? new Date().toISOString(),
          }
        : prev,
    );
  }, []);

  const loadHistory = useCallback(() => {
    void apiFetch("/api/client/payment-history", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { history?: PaymentHistoryItem[] } | null) => {
        setHistory(d?.history ?? []);
      })
      .catch(() => setHistory([]));
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    void apiFetch("/api/client/me", { credentials: "include" })
      .then((r) => r.json())
      .then(
        (d: {
          client?: {
            subscription?: {
              status: string;
              amount?: number | null;
              paidAt?: string | null;
              expiresAt?: string | null;
            } | null;
          } | null;
        }) => {
          const sub = d.client?.subscription;
          if (!sub) {
            setSubscription(null);
            setSubscribed(false);
            return;
          }
          setSubscription({
            status: sub.status,
            amount: typeof sub.amount === "number" ? sub.amount : null,
            paidAt: sub.paidAt ?? null,
            expiresAt: sub.expiresAt ?? null,
          });
          const active =
            sub.status === "ACTIVE" &&
            (!sub.expiresAt || new Date(sub.expiresAt) > new Date());
          setSubscribed(!!active);
        },
      );
  }, []);

  useEffect(() => {
    void apiFetch("/api/payment-settings", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { paymentSettings?: PaymentSettings } | null) => {
        if (d?.paymentSettings) setPaymentSettings(d.paymentSettings);
      })
      .catch(() => {});
  }, []);

  const handleSelectPlan = useCallback((plan: PlanKey) => {
    setSelectedPlan(plan);
    if (plan === "pro") {
      window.setTimeout(() => {
        document
          .getElementById("payment")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 0);
    }
  }, []);

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Subscription" icon={<PageHeaderIconReceipt />} />

      <CurrentPlanHero
        subscribed={subscribed}
        onUpgrade={() => handleSelectPlan("pro")}
      />

      {subscribed ? (
        <ProSubscriptionDetails
          subscription={subscription}
          onCancel={cancelSubscription}
        />
      ) : (
        <>
          <FreePlanCompare
            selectedPlan={selectedPlan}
            onSelect={handleSelectPlan}
          />
          {selectedPlan === "pro" ? (
            <PaymentSection
              settings={paymentSettings}
              onSubmitted={loadHistory}
            />
          ) : null}
          <PaymentHistorySection history={history} />
        </>
      )}
    </div>
  );
}

/* ---------------- Current plan hero ---------------- */

function CurrentPlanHero({
  subscribed,
  onUpgrade,
}: {
  subscribed: boolean;
  onUpgrade: () => void;
}) {
  if (subscribed) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
              Current plan
            </div>
            <div className="mt-1 text-2xl font-bold text-[color:var(--text)]">
              Pro
            </div>
            <div className="mt-1 text-sm text-[color:var(--text-muted)]">
              Full access to course details, provider information and fees.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
            Current plan
          </div>
          <div className="mt-1 text-2xl font-bold text-[color:var(--text)]">
            Free tier
          </div>
          <div className="mt-1 text-sm text-[color:var(--text-muted)]">
            You can browse the platform, but details are blurred until you
            subscribe.
          </div>
        </div>
        <Button size="lg" onClick={onUpgrade}>
          Upgrade to Pro
        </Button>
      </div>
    </div>
  );
}

/* ---------------- Pro subscription details (subscribed view) ---------------- */

function ProSubscriptionDetails({
  subscription,
  onCancel,
}: {
  subscription: SubscriptionInfo | null;
  onCancel: () => Promise<void>;
}) {
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const startedOn = subscription?.paidAt
    ? formatDate(subscription.paidAt)
    : "—";
  const endDate = subscription?.expiresAt
    ? formatDate(subscription.expiresAt)
    : "—";
  const priceLabel =
    typeof subscription?.amount === "number"
      ? `${formatAmount(subscription.amount)} / month`
      : "—";
  const paymentMethod = "Bank transfer";

  async function handleCancel() {
    if (cancelling) return;
    if (typeof window !== "undefined") {
      const ok = window.confirm(
        "Cancel your Pro subscription? You'll immediately lose access to full course details.",
      );
      if (!ok) return;
    }
    setCancelError(null);
    setCancelling(true);
    try {
      await onCancel();
    } catch (err) {
      setCancelError(
        err instanceof Error ? err.message : "Failed to cancel subscription.",
      );
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm">
        <div className="text-sm font-semibold text-[color:var(--text)]">
          Plan details
        </div>
        <dl className="mt-4 grid gap-3 text-sm">
          <DetailRow label="Plan" value="Pro" />
          <DetailRow label="Price" value={priceLabel} />
          <DetailRow label="Started on" value={startedOn} />
          <DetailRow label="End date" value={endDate} />
          <DetailRow label="Payment method" value={paymentMethod} />
        </dl>
        {cancelError ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {cancelError}
          </div>
        ) : null}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={cancelling}
            className="border-red-300 text-red-700 hover:bg-red-50"
          >
            {cancelling ? "Cancelling…" : "Cancel subscription"}
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm">
        <div className="text-sm font-semibold text-[color:var(--text)]">
          What&rsquo;s included
        </div>
        <ul className="mt-4 grid gap-3 text-sm text-[color:var(--text)]">
          <PerkRow>Browse all published courses on the platform</PerkRow>
          <PerkRow>Search and filter courses by category and keyword</PerkRow>
          <PerkRow>Unblur course titles, categories, and provider details</PerkRow>
          <PerkRow>View fees, descriptions, learning outcomes, and locations</PerkRow>
          <PerkRow>Access brochures, slides, and sample course materials</PerkRow>
        </ul>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3">
      <dt className="text-[color:var(--text-muted)]">{label}</dt>
      <dd className="font-medium text-[color:var(--text)]">{value}</dd>
    </div>
  );
}

function PerkRow({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700">
        <CheckIcon className="h-3 w-3" />
      </span>
      <span className="leading-6">{children}</span>
    </li>
  );
}

/* ---------------- Free plan compare (free-tier view) ---------------- */

function FreePlanCompare({
  selectedPlan,
  onSelect,
}: {
  selectedPlan: PlanKey;
  onSelect: (plan: PlanKey) => void;
}) {
  return (
    <section className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
        Plans
      </div>
      <h2 className="mt-2 text-2xl font-bold tracking-tight text-[color:var(--text)]">
        {EMPLOYER_PLAN_COMPARE_HEADING}
      </h2>
      <p className="mt-1 text-sm text-[color:var(--text-muted)]">
        {EMPLOYER_PLAN_COMPARE_SUBTITLE}
      </p>

      <div className="mt-6 grid gap-5 md:grid-cols-2 md:items-stretch">
        <PlanCard
          name={EMPLOYER_PLAN_FREE.name}
          price={EMPLOYER_PLAN_FREE.price}
          period={EMPLOYER_PLAN_FREE.period}
          badge="current"
          selected={selectedPlan === "free"}
          onSelect={() => onSelect("free")}
          features={[...EMPLOYER_PLAN_FREE.features]}
        />
        <PlanCard
          name={EMPLOYER_PLAN_PRO.name}
          price={EMPLOYER_PLAN_PRO.price}
          period={EMPLOYER_PLAN_PRO.period}
          badge="popular"
          selected={selectedPlan === "pro"}
          onSelect={() => onSelect("pro")}
          features={[...EMPLOYER_PLAN_PRO.features]}
        />
      </div>
    </section>
  );
}

/* ---------------- Payment section (free-tier view) ---------------- */

function formatAmount(amount: number) {
  if (!Number.isFinite(amount)) return "RM 0";
  const n = Math.round(amount * 100) / 100;
  const whole = Number.isInteger(n);
  return `RM ${whole ? n.toString() : n.toFixed(2)}`;
}

function PaymentSection({
  settings,
  onSubmitted,
}: {
  settings: PaymentSettings;
  onSubmitted: () => void;
}) {
  const amountLabel = `${formatAmount(settings.amount)} / month`;
  const heroAmount = formatAmount(settings.amount);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const busy = uploading || submitting;
  const fileLabel = file ? file.name : "No file chosen";

  function pickFile() {
    fileInputRef.current?.click();
  }

  function clearForm() {
    setFile(null);
    setNotes("");
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function submit() {
    if (!file) {
      setError("Choose a payment proof file first.");
      return;
    }
    setError(null);
    setSubmitted(false);

    setUploading(true);
    let proofUrl: string | null = null;
    try {
      const body = new FormData();
      body.append("proof", file);
      const res = await apiFetch("/api/uploads/payment-proof", {
        method: "POST",
        credentials: "include",
        body,
      });
      const data = (await res.json().catch(() => null)) as
        | { proofUrl?: string; error?: string }
        | null;
      if (!res.ok || !data?.proofUrl) {
        setError(data?.error || "Failed to upload payment proof.");
        return;
      }
      proofUrl = data.proofUrl;
    } catch {
      setError("Failed to upload payment proof.");
      return;
    } finally {
      setUploading(false);
    }

    setSubmitting(true);
    try {
      const res = await apiFetch("/api/client/payment-proof", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proofUrl,
          notes: notes.trim() || null,
        }),
      });
      const data = (await res.json().catch(() => null)) as
        | { error?: string }
        | null;
      if (!res.ok) {
        setError(data?.error || "Failed to submit payment proof.");
        return;
      }
      setSubmitted(true);
      clearForm();
      onSubmitted();
    } catch {
      setError("Failed to submit payment proof.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      id="payment"
      className="scroll-mt-24 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm"
    >
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
        Payment
      </div>
      <h2 className="mt-2 text-2xl font-bold tracking-tight text-[color:var(--text)]">
        Pay {heroAmount} to activate Pro
      </h2>
      <p className="mt-1 text-sm text-[color:var(--text-muted)]">
        Transfer via bank or scan the QR code below, then upload your payment
        proof. Your subscription becomes active once admin verifies the proof.
      </p>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5">
          <div className="text-sm font-semibold text-[color:var(--text)]">
            Payment instructions
          </div>
          <div className="mt-1 text-xs text-[color:var(--text-muted)]">
            Transfer to the account below or scan the QR code.
          </div>
          <div className="mt-4 grid gap-2 text-sm">
            <PaymentRow label="Bank" value={settings.bankName || "—"} />
            <PaymentRow
              label="Account name"
              value={settings.accountName || "—"}
            />
            <PaymentRow
              label="Account number"
              value={settings.accountNumber || "—"}
            />
            <PaymentRow label="Reference" value="Your employer name" />
            <PaymentRow label="Amount" value={amountLabel} />
          </div>
          <div className="mt-4 flex h-56 items-center justify-center overflow-hidden rounded-lg border border-dashed border-[color:var(--border)] bg-[color:var(--surface)] p-3 text-sm text-[color:var(--text-muted)]">
            {settings.qrImageUrl ? (
              <img
                src={apiAssetUrl(settings.qrImageUrl)}
                alt="Payment QR code"
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <span>QR code image</span>
            )}
          </div>
          <div className="mt-2 text-center text-xs font-medium text-[color:var(--text-muted)]">
            QR code
          </div>
        </div>

        <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5">
          <div className="text-sm font-semibold text-[color:var(--text)]">
            Upload payment proof
          </div>
          <div className="mt-1 text-xs text-[color:var(--text-muted)]">
            Upload screenshot/receipt after you pay (PNG, JPG, or PDF — max
            10MB).
          </div>
          <div className="mt-4 flex flex-col gap-2 text-sm">
            <span className="text-[color:var(--text)]">Payment proof</span>
            <div className="flex flex-wrap items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setFile(f);
                  setSubmitted(false);
                  setError(null);
                }}
                disabled={busy}
              />
              <Button
                type="button"
                variant="outline"
                onClick={pickFile}
                disabled={busy}
              >
                {file ? "Replace file" : "Choose file"}
              </Button>
              <span
                className={`min-w-0 truncate text-xs ${
                  file
                    ? "text-[color:var(--text)]"
                    : "text-[color:var(--text-muted)]"
                }`}
                title={fileLabel}
              >
                {fileLabel}
              </span>
              {file ? (
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  disabled={busy}
                  className="text-xs font-medium text-[color:var(--danger)] hover:underline disabled:opacity-50"
                >
                  Remove
                </button>
              ) : null}
            </div>
          </div>
          <label className="mt-3 flex flex-col gap-2 text-sm">
            <span className="text-[color:var(--text)]">Notes (optional)</span>
            <textarea
              rows={3}
              placeholder="E.g. transfer reference, date paid…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={busy}
              className="w-full resize-none rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--text)] placeholder:text-[color:var(--text-muted)] focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)] disabled:opacity-60"
            />
          </label>
          {error ? (
            <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}
          {submitted ? (
            <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              Payment proof submitted. Admin will verify it shortly.
            </div>
          ) : null}
          <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
            <Button
              variant="outline"
              type="button"
              onClick={clearForm}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button type="button" onClick={submit} disabled={busy || !file}>
              {uploading
                ? "Uploading…"
                : submitting
                  ? "Submitting…"
                  : "Submit payment proof"}
            </Button>
          </div>
          <div className="mt-4 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3 text-xs text-[color:var(--text-muted)]">
            You&rsquo;ll be notified once admin verifies your payment. Pro
            features unlock immediately after approval.
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Payment history section ---------------- */

function PaymentHistorySection({
  history,
}: {
  history: PaymentHistoryItem[] | null;
}) {
  return (
    <section className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
        Payment history
      </div>
      <h2 className="mt-2 text-2xl font-bold tracking-tight text-[color:var(--text)]">
        Your submissions
      </h2>
      <p className="mt-1 text-sm text-[color:var(--text-muted)]">
        Every payment proof you submit appears here with its review status.
      </p>

      <div className="mt-6">
        {history === null ? (
          <div className="rounded-xl border border-dashed border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-8 text-center text-sm text-[color:var(--text-muted)]">
            Loading…
          </div>
        ) : history.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-8 text-center text-sm text-[color:var(--text-muted)]">
            No payment submissions yet.
          </div>
        ) : (
          <ul className="grid gap-3">
            {history.map((item) => (
              <PaymentHistoryRow key={item.id} item={item} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function PaymentHistoryRow({ item }: { item: PaymentHistoryItem }) {
  const submittedLabel = formatDateTime(item.submittedAt);
  const reviewedLabel = item.reviewedAt ? formatDateTime(item.reviewedAt) : null;
  return (
    <li className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-[color:var(--text)]">
            {formatAmount(item.amount)}
            <span className="ml-2 text-xs font-normal text-[color:var(--text-muted)]">
              Submitted {submittedLabel}
            </span>
          </div>
          {reviewedLabel ? (
            <div className="mt-1 text-xs text-[color:var(--text-muted)]">
              Reviewed {reviewedLabel}
            </div>
          ) : null}
        </div>
        <PaymentHistoryStatusPill status={item.status} />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-[auto_1fr]">
        <div>
          <PaymentProofThumb proofUrl={item.proofUrl} />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--text-muted)]">
            Notes
          </div>
          <div className="mt-1 whitespace-pre-wrap text-sm text-[color:var(--text)]">
            {item.notes ? (
              item.notes
            ) : (
              <span className="text-[color:var(--text-muted)]">—</span>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

function PaymentProofThumb({ proofUrl }: { proofUrl: string | null }) {
  if (!proofUrl) {
    return (
      <div className="grid h-16 w-16 place-items-center rounded-md border border-dashed border-[color:var(--border)] text-[10px] text-[color:var(--text-muted)]">
        No file
      </div>
    );
  }
  const isPdf = /\.pdf(\?|$)/i.test(proofUrl);
  if (isPdf) {
    return (
      <a
        href={apiAssetUrl(proofUrl)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] px-2 py-1.5 text-xs font-medium text-[color:var(--primary)] hover:border-[color:var(--primary)]"
      >
        View PDF
      </a>
    );
  }
  return (
    <a
      href={apiAssetUrl(proofUrl)}
      target="_blank"
      rel="noopener noreferrer"
      className="block w-fit overflow-hidden rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] p-1 transition hover:border-[color:var(--primary)]"
      title="Open full size"
    >
      <img
        src={apiAssetUrl(proofUrl)}
        alt="Payment proof"
        className="h-16 w-16 object-cover"
      />
    </a>
  );
}

function PaymentHistoryStatusPill({ status }: { status: string }) {
  const map: Record<
    string,
    { label: string; className: string }
  > = {
    PENDING: {
      label: "Pending verification",
      className: "border border-amber-300 bg-amber-100 text-amber-900",
    },
    VERIFIED: {
      label: "Verified by admin",
      className: "border border-emerald-300 bg-emerald-100 text-emerald-800",
    },
    REJECTED: {
      label: "Rejected",
      className: "border border-red-300 bg-red-100 text-red-700",
    },
  };
  const entry = map[status] ?? {
    label: status,
    className: "border border-[color:var(--border)] bg-[color:var(--surface-muted)] text-[color:var(--text-muted)]",
  };
  return (
    <span
      className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${entry.className}`}
    >
      {entry.label}
    </span>
  );
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function PaymentRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3">
      <span className="text-[color:var(--text-muted)]">{label}</span>
      <span className="font-medium text-[color:var(--text)]">{value}</span>
    </div>
  );
}

function PlanCard({
  name,
  price,
  period,
  features,
  badge,
  selected,
  onSelect,
}: {
  name: string;
  price: string;
  period: string;
  features: string[];
  badge: "current" | "popular";
  selected: boolean;
  onSelect: () => void;
}) {
  const isPro = badge === "popular";

  const selectedRing = isPro
    ? "border-orange-400 ring-2 ring-orange-400/70 shadow-md"
    : "border-emerald-400 ring-2 ring-emerald-400/60 shadow-md";
  const unselectedBorder =
    "border-[color:var(--border)] hover:border-[color:var(--text-muted)]";

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`relative flex cursor-pointer flex-col rounded-2xl border bg-[color:var(--surface)] p-6 text-[color:var(--text)] shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 ${
        selected ? selectedRing : unselectedBorder
      }`}
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <span
          className={`inline-flex w-fit items-center rounded-full border px-3 py-0.5 text-[11px] font-medium ${
            isPro
              ? "border-orange-300 bg-orange-100 text-orange-700"
              : "border-emerald-300 bg-emerald-100 text-emerald-700"
          }`}
        >
          {isPro ? "Most popular" : "Current plan"}
        </span>
        {selected ? (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
              isPro
                ? "bg-orange-600 text-white"
                : "bg-emerald-600 text-white"
            }`}
            aria-hidden
          >
            <CheckIcon className="h-3 w-3" />
            Selected
          </span>
        ) : null}
      </div>

      <div className="text-base font-semibold">{name}</div>
      <div
        className={`mt-3 text-3xl font-semibold ${
          isPro ? "text-orange-600" : "text-[color:var(--text)]"
        }`}
      >
        {price}
      </div>
      <div className="mt-1 text-xs text-[color:var(--text-muted)]">{period}</div>

      <ul className="mt-6 grid gap-3">
        {features.map((f) => (
          <li
            key={f}
            className="flex items-start gap-3 text-sm leading-6 text-[color:var(--text)]"
          >
            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700">
              <CheckIcon className="h-3 w-3" />
            </span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------- Icon ---------------- */

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m5 13 4 4L19 7" />
    </svg>
  );
}
