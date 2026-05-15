"use client";

import { useCallback, useMemo, useState } from "react";
import { apiAssetUrl, apiFetch } from "@/lib/api";
import type { ReactNode } from "react";

import {
  AdminAccountsChrome,
  AdminAccountsSortTh,
  type AdminSortDir,
} from "@/components/admin/admin-accounts-chrome";
import { AdminAvatar } from "@/components/admin/admin-avatar";
import { Button, cn } from "@/components/ui/button";

export type AdminPaymentRow = {
  id: string;
  companyName: string;
  subtitle: string;
  paymentType: string;
  amountLabel: string;
  amountNum: number;
  /** Stable key for sorting and pill styling */
  statusKey: string;
  /** Human-readable status, e.g. "Completed", "Awaiting confirmation" */
  statusLabel: string;
  dateLabel: string;
  dateMs: number;
  proofUrl?: string | null;
  notes?: string | null;
  profilePhoto?: string | null;
};

type PaymentSortKey = "companyName" | "paymentType" | "amount" | "date" | "statusKey";

const PAYMENT_STATUS_ORDER: Record<string, number> = {
  PENDING_PAYMENT: 0,
  PROOF_UPLOADED: 1,
  COMPLETED: 2,
  EXPIRED: 3,
  REJECTED: 4,
};

export function AdminPaymentsView({
  payments,
  pageIcon,
  onRefresh,
}: {
  payments: AdminPaymentRow[];
  pageIcon: ReactNode;
  onRefresh?: () => void;
}) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<{ key: PaymentSortKey; dir: AdminSortDir }>({
    key: "companyName",
    dir: "asc",
  });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAction = useCallback(
    async (id: string, action: "approve" | "reject") => {
      if (busyId) return;
      setBusyId(id);
      setError(null);
      try {
        const res = await apiFetch(`/api/admin/payments/${id}/${action}`, {
          method: "POST",
          credentials: "include",
        });
        const data = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        if (!res.ok) {
          setError(data?.error || `Failed to ${action} payment.`);
          return;
        }
        onRefresh?.();
      } catch {
        setError(`Failed to ${action} payment.`);
      } finally {
        setBusyId(null);
      }
    },
    [busyId, onRefresh],
  );

  const onSort = useCallback((column: string) => {
    const key = column as PaymentSortKey;
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" },
    );
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return payments;
    return payments.filter((p) => {
      const hay = `${p.companyName} ${p.subtitle} ${p.paymentType} ${p.amountLabel} ${p.statusKey} ${p.statusLabel} ${p.dateLabel}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [payments, q]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    const { key: sortKey, dir: sortDir } = sort;
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "statusKey": {
          const oa = PAYMENT_STATUS_ORDER[a.statusKey] ?? 99;
          const ob = PAYMENT_STATUS_ORDER[b.statusKey] ?? 99;
          cmp = oa - ob;
          break;
        }
        case "amount":
          cmp = a.amountNum - b.amountNum;
          break;
        case "date":
          cmp = a.dateMs - b.dateMs;
          break;
        case "companyName":
        case "paymentType":
          cmp = a[sortKey].localeCompare(b[sortKey], undefined, {
            sensitivity: "base",
            numeric: true,
          });
          break;
        default:
          cmp = 0;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [filtered, sort]);

  return (
    <AdminAccountsChrome
      title="Payments"
      description="All payment records"
      pageIcon={pageIcon}
      searchPlaceholder="Search payments…"
      searchValue={q}
      onSearchChange={setQ}
    >
      {error ? (
        <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-[color:var(--border)] bg-[#faf8f5]">
              <AdminAccountsSortTh
                columnKey="companyName"
                activeKey={sort.key}
                dir={sort.dir}
                onSort={onSort}
              >
                Company
              </AdminAccountsSortTh>
              <AdminAccountsSortTh
                columnKey="paymentType"
                activeKey={sort.key}
                dir={sort.dir}
                onSort={onSort}
              >
                Type
              </AdminAccountsSortTh>
              <AdminAccountsSortTh
                columnKey="amount"
                activeKey={sort.key}
                dir={sort.dir}
                onSort={onSort}
              >
                Amount
              </AdminAccountsSortTh>
              <AdminAccountsSortTh
                columnKey="date"
                activeKey={sort.key}
                dir={sort.dir}
                onSort={onSort}
              >
                Date
              </AdminAccountsSortTh>
              <AdminAccountsSortTh
                columnKey="statusKey"
                activeKey={sort.key}
                dir={sort.dir}
                onSort={onSort}
              >
                Payment status
              </AdminAccountsSortTh>
              <th
                scope="col"
                className="border-b border-[color:var(--border)] px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--text-muted)]"
              >
                Proof
              </th>
              <th
                scope="col"
                className="border-b border-[color:var(--border)] px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--text-muted)]"
              >
                Notes
              </th>
              <th
                scope="col"
                className="border-b border-[color:var(--border)] px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--text-muted)]"
              >
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td
                  className="px-4 py-10 text-center text-[color:var(--text-muted)]"
                  colSpan={8}
                >
                  No payments match your search.
                </td>
              </tr>
            ) : (
              sorted.map((p) => (
                <tr
                  key={p.id}
                  className={cn(
                    "border-b border-[color:var(--border)] bg-white last:border-b-0",
                  )}
                >
                  <td className="px-4 py-4 align-middle">
                    <div className="flex items-start gap-3">
                      <AdminAvatar
                        src={p.profilePhoto ?? null}
                        alt={p.companyName}
                        fallback={initialsFromCompanyName(p.companyName)}
                      />
                      <div className="min-w-0">
                        <div className="font-semibold text-[color:var(--text)]">
                          {p.companyName}
                        </div>
                        <div className="mt-0.5 line-clamp-2 text-xs text-[color:var(--text-muted)]">
                          <span className="capitalize">{p.paymentType}</span> · {p.subtitle}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 align-middle text-[color:var(--text)] capitalize">
                    {p.paymentType}
                  </td>
                  <td className="px-4 py-4 align-middle tabular-nums text-[color:var(--text)]">
                    {p.amountLabel}
                  </td>
                  <td className="px-4 py-4 align-middle whitespace-nowrap text-[color:var(--text-muted)] tabular-nums text-xs">
                    {p.dateLabel}
                  </td>
                  <td className="px-4 py-4 align-middle">
                    <PaymentStatusPill statusKey={p.statusKey} label={p.statusLabel} />
                  </td>
                  <td className="px-4 py-4 align-middle text-sm">
                    <ProofPreview proofUrl={p.proofUrl ?? null} />
                  </td>
                  <td className="px-4 py-4 align-middle text-sm">
                    {p.notes ? (
                      <div className="max-w-[18rem] whitespace-pre-wrap text-xs text-[color:var(--text)]">
                        {p.notes}
                      </div>
                    ) : (
                      <span className="text-xs text-[color:var(--text-muted)]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4 align-middle">
                    <PaymentActionCell
                      statusKey={p.statusKey}
                      busy={busyId === p.id}
                      anyBusy={busyId !== null}
                      onApprove={() => handleAction(p.id, "approve")}
                      onReject={() => handleAction(p.id, "reject")}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AdminAccountsChrome>
  );
}

function PaymentActionCell({
  statusKey,
  busy,
  anyBusy,
  onApprove,
  onReject,
}: {
  statusKey: string;
  busy: boolean;
  anyBusy: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  if (statusKey === "PENDING_PAYMENT" || statusKey === "PROOF_UPLOADED") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          onClick={onApprove}
          disabled={anyBusy}
          className="bg-emerald-600 text-white hover:bg-emerald-700"
        >
          {busy ? "Working…" : "Approve"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onReject}
          disabled={anyBusy}
          className="border-red-300 text-red-700 hover:bg-red-50"
        >
          Reject
        </Button>
      </div>
    );
  }
  if (statusKey === "COMPLETED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
        Approved
      </span>
    );
  }
  if (statusKey === "REJECTED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
        Rejected
      </span>
    );
  }
  return <span className="text-xs text-[color:var(--text-muted)]">—</span>;
}

function ProofPreview({ proofUrl }: { proofUrl: string | null }) {
  if (!proofUrl) {
    return <span className="text-xs text-[color:var(--text-muted)]">—</span>;
  }
  const isPdf = /\.pdf(\?|$)/i.test(proofUrl);
  if (isPdf) {
    return (
      <a
        href={proofUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs font-medium text-sky-700 hover:underline"
      >
        View PDF
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-3.5 w-3.5"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M14 3h7v7" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 14L21 3" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 14v5a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h5" />
        </svg>
      </a>
    );
  }
  return (
    <a
      href={proofUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block w-fit overflow-hidden rounded-md border border-[color:var(--border)] bg-white p-1 transition hover:border-sky-300"
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

function initialsFromCompanyName(name: string) {
  const initials = name
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  return initials || "C";
}

function PillShell({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-[14rem] rounded-full px-2.5 py-1 text-xs font-semibold leading-snug",
        className,
      )}
    >
      {children}
    </span>
  );
}

function PaymentStatusPill({ statusKey, label }: { statusKey: string; label: string }) {
  switch (statusKey) {
    case "COMPLETED":
      return (
        <PillShell className="bg-emerald-700 text-white">
          {label}
        </PillShell>
      );
    case "REJECTED":
      return (
        <PillShell className="bg-red-700 text-white">
          {label}
        </PillShell>
      );
    case "EXPIRED":
      return (
        <PillShell className="border border-[color:var(--border)] bg-slate-100 text-[color:var(--text-muted)]">
          {label}
        </PillShell>
      );
    case "PROOF_UPLOADED":
      return (
        <PillShell className="border border-amber-300 bg-amber-100 text-amber-950">
          {label}
        </PillShell>
      );
    case "PENDING_PAYMENT":
    default:
      return (
        <PillShell className="border border-[color:var(--border)] bg-[color:var(--surface-muted)] text-[color:var(--text-muted)]">
          {label}
        </PillShell>
      );
  }
}
