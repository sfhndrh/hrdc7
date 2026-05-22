"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useNavigate } from "react-router-dom";

import {
  AdminAccountsSortTh,
  AdminAccountsTh,
  type AdminSortDir,
} from "@/components/admin/admin-accounts-chrome";
import {
  AdminTablePagination,
  useAdminTablePagination,
} from "@/components/admin/admin-table-pagination";
import { AdminAvatar } from "@/components/admin/admin-avatar";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-widgets";
import { PageHeaderIconApprove } from "@/components/dashboard/page-header-icons";
import { Button, cn } from "@/components/ui/button";
import { normalizeProfilePhotoUrl } from "@/lib/profile-photo";

type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string;
  trainer_id: string | null;
  tp_org_id?: string | null;
  tpCompanyName?: string | null;
  is_read: number;
  created_at: string;
  isRead?: boolean;
  trainerFullName?: string | null;
  trainerPhone?: string | null;
  trainerProfilePhoto?: string | null;
  trainerLocation?: string | null;
  trainerAccountEmail?: string | null;
  trainerExpertiseLabel?: string | null;
  approvalRole?: string | null;
  accountStatus?: string | null;
};

type ApprovalSortKey = "name" | "role" | "verdict" | "created_at";

const APPROVAL_ROLES = ["Trainer", "Employer", "Training Provider"] as const;
type AiFilterValue = "" | "APPROVE" | "REJECT" | "MANUAL_REVIEW" | "PENDING";

const AI_FILTER_OPTIONS: { value: AiFilterValue; label: string }[] = [
  { value: "", label: "All AI results" },
  { value: "APPROVE", label: "Approve" },
  { value: "REJECT", label: "Reject" },
  { value: "MANUAL_REVIEW", label: "Review" },
  { value: "PENDING", label: "Pending" },
];

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-MY", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function parseTrainerName(body: string) {
  const m = body.match(/Trainer:\s*(.+)/i);
  return m ? m[1].trim() : "";
}

function parseRecommendation(body: string): "APPROVE" | "REJECT" | "MANUAL_REVIEW" | "" {
  const m = body.match(/AI Recommendation:\s*(APPROVE|REJECT|MANUAL_REVIEW)/i);
  return (m?.[1]?.toUpperCase() as "APPROVE" | "REJECT" | "MANUAL_REVIEW" | "") ?? "";
}

function isApprovedRow(n: NotificationRow): boolean {
  return n.accountStatus === "APPROVED";
}

function aiVerdictForRow(n: NotificationRow): string {
  if (isApprovedRow(n)) return "APPROVED";
  if (n.type === "TP_SIGNUP" || n.tp_org_id) return "";
  return parseRecommendation(n.body ?? "");
}

function displayName(n: NotificationRow) {
  if (n.type === "TP_SIGNUP") {
    return (n.tpCompanyName && String(n.tpCompanyName).trim()) || "Training provider";
  }
  return (n.trainerFullName && String(n.trainerFullName).trim()) || parseTrainerName(n.body ?? "") || "Trainer";
}

function approvalRole(n: NotificationRow): string {
  if (n.approvalRole?.trim()) return n.approvalRole.trim();
  if (n.type === "TP_SIGNUP" || n.tp_org_id) return "Training Provider";
  if (n.type.startsWith("CLIENT") || n.type === "CLIENT_SIGNUP") return "Employer";
  return "Trainer";
}

function initialsFromName(name: string) {
  const initials = name
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  return initials || "T";
}

function RoleLabel({ role }: { role: string }) {
  return <span className="text-sm font-semibold text-[color:var(--text)]">{role}</span>;
}

function aiVerdictLabel(rec: string, n?: NotificationRow): string {
  if (n && isApprovedRow(n)) return "Approved";
  if (n && (n.type === "TP_SIGNUP" || n.tp_org_id)) return "—";
  if (rec === "APPROVE") return "Approve";
  if (rec === "REJECT") return "Reject";
  if (rec === "MANUAL_REVIEW") return "Review";
  return "Pending";
}

function aiVerdictTextClass(rec: string, n?: NotificationRow): string {
  if (n && isApprovedRow(n)) return "text-emerald-700 dark:text-emerald-400";
  if (rec === "APPROVE") return "text-emerald-700 dark:text-emerald-400";
  if (rec === "REJECT") return "text-red-700 dark:text-red-400";
  if (rec === "MANUAL_REVIEW") return "text-amber-700 dark:text-amber-400";
  return "text-[color:var(--text-muted)]";
}

function AiVerdictLabel({ rec, row }: { rec: string; row?: NotificationRow }) {
  return (
    <span
      className={cn(
        "text-sm font-semibold uppercase tracking-wide",
        row && (row.type === "TP_SIGNUP" || row.tp_org_id) && !isApprovedRow(row)
          ? "text-[color:var(--text-muted)]"
          : aiVerdictTextClass(rec, row),
      )}
    >
      {aiVerdictLabel(rec, row)}
    </span>
  );
}

export default function AdminNotificationsPage() {
  const nav = useNavigate();
  const [rows, setRows] = useState<NotificationRow[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [aiFilter, setAiFilter] = useState<AiFilterValue>("");
  const [sort, setSort] = useState<{ key: ApprovalSortKey; dir: AdminSortDir }>({
    key: "created_at",
    dir: "desc",
  });

  const unreadCount = useMemo(
    () => (rows ?? []).filter((n) => !(n.isRead ?? Boolean(n.is_read))).length,
    [rows],
  );

  function load() {
    setRows(null);
    void apiFetch("/api/admin/notifications", { credentials: "include" })
      .then((r) => r.json())
      .then((d: NotificationRow[]) => setRows(Array.isArray(d) ? d : []))
      .catch(() => setRows([]));
  }

  useEffect(() => {
    load();
  }, []);

  const onSort = useCallback((column: string) => {
    const key = column as ApprovalSortKey;
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" },
    );
  }, []);

  const filteredSorted = useMemo(() => {
    const list = rows ?? [];
    const needle = q.trim().toLowerCase();
    let filtered = list;
    if (needle) {
      filtered = filtered.filter((n) => {
        const name = displayName(n).toLowerCase();
        const role = approvalRole(n).toLowerCase();
        return name.includes(needle) || role.includes(needle) || (n.body ?? "").toLowerCase().includes(needle);
      });
    }
    if (roleFilter) {
      filtered = filtered.filter((n) => approvalRole(n) === roleFilter);
    }
    if (aiFilter) {
      filtered = filtered.filter((n) => {
        const rec = aiVerdictForRow(n);
        if (aiFilter === "PENDING") {
          if (n.type === "TP_SIGNUP" || n.tp_org_id) return false;
          return !rec;
        }
        return rec === aiFilter;
      });
    }

    const { key: sortKey, dir: sortDir } = sort;
    const out = [...filtered];
    out.sort((a, b) => {
      const queueRank = (isApprovedRow(a) ? 1 : 0) - (isApprovedRow(b) ? 1 : 0);
      if (queueRank !== 0) return queueRank;

      let cmp = 0;
      const recA = aiVerdictForRow(a);
      const recB = aiVerdictForRow(b);
      const verdictRank = (r: string) =>
        r === "REJECT" ? 0 : r === "MANUAL_REVIEW" ? 1 : r === "APPROVE" ? 2 : 3;
      switch (sortKey) {
        case "name":
          cmp = displayName(a).localeCompare(displayName(b), undefined, {
            sensitivity: "base",
            numeric: true,
          });
          break;
        case "role":
          cmp = approvalRole(a).localeCompare(approvalRole(b), undefined, { sensitivity: "base" });
          break;
        case "verdict":
          cmp = verdictRank(recA) - verdictRank(recB);
          break;
        case "created_at":
          cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        default:
          cmp = 0;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return out;
  }, [rows, q, roleFilter, aiFilter, sort]);

  const { paginated, ...pageProps } = useAdminTablePagination(filteredSorted, [
    q,
    roleFilter,
    aiFilter,
    sort.key,
    sort.dir,
    rows?.length,
  ]);

  async function markAllRead() {
    setBusy(true);
    try {
      await apiFetch("/api/admin/notifications/read-all", {
        method: "PATCH",
        credentials: "include",
      });
      load();
    } finally {
      setBusy(false);
    }
  }

  async function handleRowClick(n: NotificationRow) {
    if (busy) return;
    setBusy(true);
    try {
      await apiFetch(`/api/admin/notifications/${n.id}/read`, {
        method: "PATCH",
        credentials: "include",
      });
      if (n.tp_org_id) {
        nav(`/admin/tp-orgs/${n.tp_org_id}`);
      } else if (n.trainer_id) {
        nav(`/admin/trainers/${n.trainer_id}/review`);
      } else {
        setRows((prev) =>
          (prev ?? []).map((r) =>
            r.id === n.id ? { ...r, isRead: true, is_read: 1 } : r,
          ),
        );
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Approval"
        description="Accounts awaiting approval or manual review"
        icon={<PageHeaderIconApprove />}
        right={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy || !unreadCount}
              onClick={() => void markAllRead()}
            >
              Mark all as read
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={load}
              disabled={busy}
              aria-label="Refresh"
              title="Refresh"
              className="px-2.5"
            >
              <RefreshIcon className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      <section
        className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 shadow-sm"
        aria-label="Search and filters"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Search approvals</span>
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--text-muted)]" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name or role…"
              className="w-full rounded-xl border border-[color:var(--admin-search-border)] bg-[color:var(--admin-search-bg)] py-2.5 pl-10 pr-4 text-sm text-[color:var(--text)] placeholder:text-[color:var(--text-muted)] focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]/30"
            />
          </label>
          <div className="flex flex-wrap gap-2 lg:shrink-0">
            <FilterSelect
              label="Role"
              value={roleFilter}
              onChange={setRoleFilter}
              options={[
                { value: "", label: "All roles" },
                ...APPROVAL_ROLES.map((role) => ({ value: role, label: role })),
              ]}
            />
            <FilterSelect
              label="AI result"
              value={aiFilter}
              onChange={(v) => setAiFilter(v as AiFilterValue)}
              options={AI_FILTER_OPTIONS}
            />
          </div>
        </div>
      </section>

      <section
        className="overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] shadow-sm"
        aria-label="Approval queue"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[color:var(--border)] bg-[color:var(--table-header-bg)]">
                <AdminAccountsSortTh columnKey="name" activeKey={sort.key} dir={sort.dir} onSort={onSort}>
                  Name
                </AdminAccountsSortTh>
                <AdminAccountsSortTh
                  columnKey="role"
                  activeKey={sort.key}
                  dir={sort.dir}
                  onSort={onSort}
                >
                  Role
                </AdminAccountsSortTh>
                <AdminAccountsSortTh
                  columnKey="created_at"
                  activeKey={sort.key}
                  dir={sort.dir}
                  onSort={onSort}
                >
                  Submitted
                </AdminAccountsSortTh>
                <AdminAccountsSortTh
                  columnKey="verdict"
                  activeKey={sort.key}
                  dir={sort.dir}
                  onSort={onSort}
                >
                  AI result
                </AdminAccountsSortTh>
              </tr>
            </thead>
            <tbody>
              {rows === null ? (
                <tr>
                  <td className="px-4 py-10 text-center text-[color:var(--text-muted)]" colSpan={4}>
                    Loading…
                  </td>
                </tr>
              ) : filteredSorted.length === 0 ? (
                <tr>
                  <td className="px-4 py-10 text-center text-[color:var(--text-muted)]" colSpan={4}>
                    {rows.length === 0 ? "No approvals yet." : "No rows match your search."}
                  </td>
                </tr>
              ) : (
                paginated.map((n) => {
                  const unread = !(n.isRead ?? Boolean(n.is_read));
                  const name = displayName(n);
                  const rec = aiVerdictForRow(n);
                  const interactive = !busy;
                  return (
                    <tr
                      key={n.id}
                      role="link"
                      tabIndex={interactive ? 0 : -1}
                      onClick={() => void handleRowClick(n)}
                      onKeyDown={(e) => {
                        if (!interactive) return;
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          void handleRowClick(n);
                        }
                      }}
                      className={cn(
                        "border-b border-[color:var(--border)] last:border-b-0",
                        interactive &&
                          "cursor-pointer hover:bg-[color:var(--hover-subtle)] focus-visible:bg-[color:var(--hover-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--primary)]",
                        busy && "cursor-wait opacity-70",
                        unread &&
                          "border-l-4 border-l-amber-400 bg-[color:var(--row-highlight-bg)] hover:bg-[color:var(--row-highlight-hover)]",
                      )}
                    >
                      <td className="px-4 py-4 align-middle">
                        <div className="flex items-start gap-3">
                          <AdminAvatar
                            src={normalizeProfilePhotoUrl(n.trainerProfilePhoto)}
                            alt={name}
                            fallback={initialsFromName(name)}
                          />
                          <div className="min-w-0">
                            <div className="font-semibold text-[color:var(--text)]">{name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 align-middle text-[color:var(--text)]">
                        <RoleLabel role={approvalRole(n)} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 align-middle text-[color:var(--text-muted)]">
                        {formatDate(n.created_at)}
                      </td>
                      <td className="px-4 py-4 align-middle">
                        <AiVerdictLabel rec={rec} row={n} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <AdminTablePagination {...pageProps} />
      </section>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex min-w-[10rem] flex-col gap-1 text-xs font-medium text-[color:var(--text-muted)]">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="rounded-xl border border-[color:var(--admin-search-border)] bg-[color:var(--admin-search-bg)] py-2.5 pl-3 pr-8 text-sm text-[color:var(--text)] focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]/30"
      >
        {options.map((opt) => (
          <option key={opt.value || "__all"} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-2.64-6.36" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 3v6h-6" />
    </svg>
  );
}

function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <circle cx="11" cy="11" r="7" />
      <path strokeLinecap="round" d="M20 20l-3.3-3.3" />
    </svg>
  );
}
