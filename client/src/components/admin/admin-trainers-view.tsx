"use client";

import { useNavigate } from "react-router-dom";
import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";

import {
  AdminAccountsChrome,
  AdminAccountsSortTh,
  AdminAccountsTh,
  type AdminSortDir,
} from "@/components/admin/admin-accounts-chrome";
import { AdminAvatar } from "@/components/admin/admin-avatar";
import { cn } from "@/components/ui/button";
import { normalizeProfilePhotoUrl } from "@/lib/profile-photo";

export type AdminTrainerRow = {
  id: string;
  fullName: string;
  subtitle: string;
  email: string;
  phone: string;
  status: "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";
  profilePhoto?: string | null;
};

type TrainerSortKey = "fullName" | "email" | "phone" | "status";

const STATUS_ORDER: Record<AdminTrainerRow["status"], number> = {
  PENDING: 0,
  UNDER_REVIEW: 1,
  APPROVED: 2,
  REJECTED: 3,
};

export function AdminTrainersView({
  trainers,
  pageIcon,
}: {
  trainers: AdminTrainerRow[];
  pageIcon: ReactNode;
}) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<{ key: TrainerSortKey; dir: AdminSortDir }>({
    key: "fullName",
    dir: "asc",
  });

  const onSort = useCallback((column: string) => {
    const key = column as TrainerSortKey;
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" },
    );
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return trainers;
    return trainers.filter((t) => {
      const hay = `${t.fullName} ${t.email} ${t.phone} ${t.subtitle}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [trainers, q]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    const { key: sortKey, dir: sortDir } = sort;
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "status":
          cmp = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
          break;
        case "fullName":
        case "email":
        case "phone":
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
      title="Trainers"
      description="Review applications and manage verification status"
      pageIcon={pageIcon}
      searchPlaceholder="Search trainers…"
      searchValue={q}
      onSearchChange={setQ}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-[color:var(--border)] bg-[#faf8f5]">
              <AdminAccountsSortTh
                columnKey="fullName"
                activeKey={sort.key}
                dir={sort.dir}
                onSort={onSort}
              >
                Name
              </AdminAccountsSortTh>
              <AdminAccountsSortTh
                columnKey="email"
                activeKey={sort.key}
                dir={sort.dir}
                onSort={onSort}
              >
                Email
              </AdminAccountsSortTh>
              <AdminAccountsSortTh
                columnKey="phone"
                activeKey={sort.key}
                dir={sort.dir}
                onSort={onSort}
              >
                Phone
              </AdminAccountsSortTh>
              <AdminAccountsSortTh
                columnKey="status"
                activeKey={sort.key}
                dir={sort.dir}
                onSort={onSort}
              >
                Status
              </AdminAccountsSortTh>
              <AdminAccountsTh className="text-center">Actions</AdminAccountsTh>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td
                  className="px-4 py-10 text-center text-[color:var(--text-muted)]"
                  colSpan={5}
                >
                  No trainers match your search.
                </td>
              </tr>
            ) : (
              sorted.map((t) => (
                <tr
                  key={t.id}
                  role="link"
                  tabIndex={0}
                  onClick={() => navigate(`/admin/trainers/${t.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navigate(`/admin/trainers/${t.id}`);
                    }
                  }}
                  className={cn(
                    "cursor-pointer border-b border-[color:var(--border)] last:border-b-0 hover:bg-sky-50/40",
                    "focus-visible:bg-sky-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-300",
                  )}
                >
                  <td className="px-4 py-4 align-middle">
                    <div className="flex items-start gap-3">
                      <AdminAvatar
                        src={normalizeProfilePhotoUrl(t.profilePhoto)}
                        alt={t.fullName}
                        fallback={initialsFromName(t.fullName)}
                      />
                      <div className="min-w-0">
                        <div className="font-semibold text-[color:var(--text)]">
                          {t.fullName}
                        </div>
                        <div className="mt-0.5 truncate text-xs text-[color:var(--text-muted)]">
                          {t.subtitle}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 align-middle text-[color:var(--text)]">{t.email}</td>
                  <td className="px-4 py-4 align-middle tabular-nums text-[color:var(--text)]">
                    {t.phone}
                  </td>
                  <td className="px-4 py-4 align-middle">
                    <TrainerStatusPill status={t.status} />
                  </td>
                  <td className="px-4 py-4 text-center align-middle">
                    <div className="flex items-center justify-center">
                      <button
                        type="button"
                        title="Remove (coming soon)"
                        className={cn(
                          "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-red-600 hover:bg-red-50",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200",
                        )}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
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

function initialsFromName(fullName: string) {
  return (
    fullName
      .split(/\s+/)
      .filter((p) => /^[A-Za-z]/.test(p))
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "T"
  );
}

function TrainerStatusPill({ status }: { status: AdminTrainerRow["status"] }) {
  switch (status) {
    case "APPROVED":
      return (
        <span className="inline-flex rounded-full bg-emerald-700 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
          Approved
        </span>
      );
    case "REJECTED":
      return (
        <span className="inline-flex rounded-full bg-red-700 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
          Rejected
        </span>
      );
    case "UNDER_REVIEW":
      return (
        <span className="inline-flex rounded-full border border-amber-300 bg-amber-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-900">
          Under review
        </span>
      );
    default:
      return (
        <span className="inline-flex rounded-full border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--text-muted)]">
          Pending
        </span>
      );
  }
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
