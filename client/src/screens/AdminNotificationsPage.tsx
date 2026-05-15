"use client";

import { useCallback, useEffect, useMemo, useState, type MouseEvent } from "react";
import { apiFetch } from "@/lib/api";
import { useNavigate } from "react-router-dom";

import {
  AdminAccountsSortTh,
  AdminAccountsTh,
  type AdminSortDir,
} from "@/components/admin/admin-accounts-chrome";
import { AdminAvatar } from "@/components/admin/admin-avatar";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-widgets";
import { PageHeaderIconApprove } from "@/components/dashboard/page-header-icons";
import { Badge } from "@/components/ui/badge";
import { Button, cn } from "@/components/ui/button";

type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string;
  trainer_id: string | null;
  is_read: number;
  created_at: string;
  isRead?: boolean;
  trainerFullName?: string | null;
  trainerPhone?: string | null;
  trainerProfilePhoto?: string | null;
  trainerLocation?: string | null;
  trainerAccountEmail?: string | null;
  trainerExpertiseLabel?: string | null;
};

type ApprovalSortKey = "name" | "expertise" | "verdict" | "created_at";

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

function displayName(n: NotificationRow) {
  return (n.trainerFullName && String(n.trainerFullName).trim()) || parseTrainerName(n.body ?? "") || "Trainer";
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

function AiVerdictPill({ rec }: { rec: string }) {
  if (rec === "APPROVE") {
    return (
      <span className="inline-flex rounded-full bg-gradient-to-r from-sky-600 to-indigo-600 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
        Approve
      </span>
    );
  }
  if (rec === "REJECT") {
    return (
      <span className="inline-flex rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-red-800">
        Reject
      </span>
    );
  }
  if (rec === "MANUAL_REVIEW") {
    return (
      <span className="inline-flex rounded-full border border-[color:var(--border)] bg-[#f5f0e8] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#3d3429]">
        Review
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--text-muted)]">
      Pending
    </span>
  );
}

export default function AdminNotificationsPage() {
  const nav = useNavigate();
  const [rows, setRows] = useState<NotificationRow[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
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
    const filtered = needle
      ? list.filter((n) => {
          const name = displayName(n).toLowerCase();
          const exp = (n.trainerExpertiseLabel ?? "").toLowerCase();
          return name.includes(needle) || exp.includes(needle) || (n.body ?? "").toLowerCase().includes(needle);
        })
      : list;

    const { key: sortKey, dir: sortDir } = sort;
    const out = [...filtered];
    out.sort((a, b) => {
      let cmp = 0;
      const recA = parseRecommendation(a.body ?? "");
      const recB = parseRecommendation(b.body ?? "");
      const verdictRank = (r: string) =>
        r === "REJECT" ? 0 : r === "MANUAL_REVIEW" ? 1 : r === "APPROVE" ? 2 : 3;
      switch (sortKey) {
        case "name":
          cmp = displayName(a).localeCompare(displayName(b), undefined, {
            sensitivity: "base",
            numeric: true,
          });
          break;
        case "expertise":
          cmp = (a.trainerExpertiseLabel ?? "—").localeCompare(b.trainerExpertiseLabel ?? "—", undefined, {
            sensitivity: "base",
          });
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
  }, [rows, q, sort]);

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
      if (n.trainer_id) {
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

  async function dismissNotification(e: MouseEvent<HTMLButtonElement>, n: NotificationRow) {
    e.preventDefault();
    e.stopPropagation();
    setBusy(true);
    try {
      const res = await apiFetch(`/api/admin/notifications/${n.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) return;
      setRows((prev) => (prev ?? []).filter((r) => r.id !== n.id));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Approval"
        description="Trainers ready for approval or manual review"
        icon={<PageHeaderIconApprove />}
        right={
          <div className="flex items-center gap-2">
            {unreadCount ? <Badge tone="yellow">{unreadCount} unread</Badge> : null}
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
        className="rounded-2xl border border-[color:var(--border)] bg-white p-4 shadow-sm"
        aria-label="Search"
      >
        <label className="relative block">
          <span className="sr-only">Search approvals</span>
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--text-muted)]" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or expertise…"
            className="w-full rounded-xl border border-sky-100 bg-sky-50/70 py-2.5 pl-10 pr-4 text-sm text-[color:var(--text)] placeholder:text-[color:var(--text-muted)] focus:border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-200/60"
          />
        </label>
      </section>

      <section
        className="overflow-hidden rounded-2xl border border-[color:var(--border)] bg-white shadow-sm"
        aria-label="Approval queue"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[color:var(--border)] bg-[#faf8f5]">
                <AdminAccountsSortTh columnKey="name" activeKey={sort.key} dir={sort.dir} onSort={onSort}>
                  Name
                </AdminAccountsSortTh>
                <AdminAccountsSortTh
                  columnKey="expertise"
                  activeKey={sort.key}
                  dir={sort.dir}
                  onSort={onSort}
                >
                  Expertise
                </AdminAccountsSortTh>
                <AdminAccountsSortTh
                  columnKey="verdict"
                  activeKey={sort.key}
                  dir={sort.dir}
                  onSort={onSort}
                >
                  AI result
                </AdminAccountsSortTh>
                <AdminAccountsSortTh
                  columnKey="created_at"
                  activeKey={sort.key}
                  dir={sort.dir}
                  onSort={onSort}
                >
                  Submitted
                </AdminAccountsSortTh>
                <AdminAccountsTh className="text-center">Actions</AdminAccountsTh>
              </tr>
            </thead>
            <tbody>
              {rows === null ? (
                <tr>
                  <td className="px-4 py-10 text-center text-[color:var(--text-muted)]" colSpan={5}>
                    Loading…
                  </td>
                </tr>
              ) : filteredSorted.length === 0 ? (
                <tr>
                  <td className="px-4 py-10 text-center text-[color:var(--text-muted)]" colSpan={5}>
                    {rows.length === 0 ? "No approvals yet." : "No rows match your search."}
                  </td>
                </tr>
              ) : (
                filteredSorted.map((n) => {
                  const unread = !(n.isRead ?? Boolean(n.is_read));
                  const name = displayName(n);
                  const rec = parseRecommendation(n.body ?? "");
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
                          "cursor-pointer hover:bg-sky-50/40 focus-visible:bg-sky-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-300",
                        busy && "cursor-wait opacity-70",
                        unread && "bg-orange-50/25",
                      )}
                    >
                      <td className="px-4 py-4 align-middle">
                        <div className="flex items-start gap-3">
                          <AdminAvatar
                            src={n.trainerProfilePhoto ?? null}
                            alt={name}
                            fallback={initialsFromName(name)}
                          />
                          <div className="min-w-0">
                            <div className="font-semibold text-[color:var(--text)]">{name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="max-w-[220px] px-4 py-4 align-middle text-[color:var(--text)]">
                        <span className="line-clamp-2">
                          {n.trainerExpertiseLabel && n.trainerExpertiseLabel !== "—"
                            ? n.trainerExpertiseLabel
                            : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-middle">
                        <div className="flex flex-wrap items-center gap-2">
                          <AiVerdictPill rec={rec} />
                          {unread ? (
                            <Badge tone="yellow" className="text-[10px]">
                              Unread
                            </Badge>
                          ) : null}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 align-middle text-[color:var(--text-muted)]">
                        {formatDate(n.created_at)}
                      </td>
                      <td className="px-4 py-4 text-center align-middle">
                        <div className="flex items-center justify-center">
                          <button
                            type="button"
                            title="Remove from list (permanent)"
                            disabled={busy}
                            className={cn(
                              "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-red-600 hover:bg-red-50",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200",
                              busy && "pointer-events-none opacity-50",
                            )}
                            onClick={(e) => void dismissNotification(e, n)}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
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

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2m2 0v14a2 2 0 01-2 2H8a2 2 0 01-2-2V6h12zM10 11v6M14 11v6"
      />
    </svg>
  );
}
