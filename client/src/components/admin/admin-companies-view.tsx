"use client";

import { useNavigate } from "react-router-dom";
import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";

import {
  AdminAccountsChrome,
  AdminAccountsSortTh,
  AdminAccountsTh,
  type AdminSortDir,
  SubscriptionPlanPill,
} from "@/components/admin/admin-accounts-chrome";
import { AdminAvatar } from "@/components/admin/admin-avatar";
import { cn } from "@/components/ui/button";
import { normalizeProfilePhotoUrl } from "@/lib/profile-photo";

export type AdminCompanyRow = {
  id: string;
  companyName: string;
  subtitle: string;
  industry: string;
  email: string;
  phone: string;
  planTier: "free" | "pro";
  profilePhoto?: string | null;
};

type CompanySortKey = "companyName" | "industry" | "email" | "phone" | "planTier";

export function AdminCompaniesView({
  companies,
  pageIcon,
}: {
  companies: AdminCompanyRow[];
  pageIcon: ReactNode;
}) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<{ key: CompanySortKey; dir: AdminSortDir }>({
    key: "companyName",
    dir: "asc",
  });

  const onSort = useCallback((column: string) => {
    const key = column as CompanySortKey;
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" },
    );
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return companies;
    return companies.filter((c) => {
      const hay = `${c.companyName} ${c.industry} ${c.email} ${c.phone} ${c.subtitle}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [companies, q]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    const { key: sortKey, dir: sortDir } = sort;
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "planTier": {
          const ra = a.planTier === "pro" ? 1 : 0;
          const rb = b.planTier === "pro" ? 1 : 0;
          cmp = ra - rb;
          break;
        }
        case "companyName":
        case "industry":
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
      title="Companies"
      description="Manage company accounts"
      pageIcon={pageIcon}
      searchPlaceholder="Search companies…"
      searchValue={q}
      onSearchChange={setQ}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-[color:var(--border)] bg-[#faf8f5]">
              <AdminAccountsSortTh
                columnKey="companyName"
                activeKey={sort.key}
                dir={sort.dir}
                onSort={onSort}
              >
                Name
              </AdminAccountsSortTh>
              <AdminAccountsSortTh
                columnKey="industry"
                activeKey={sort.key}
                dir={sort.dir}
                onSort={onSort}
              >
                Industry
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
                columnKey="planTier"
                activeKey={sort.key}
                dir={sort.dir}
                onSort={onSort}
              >
                Subscription plan
              </AdminAccountsSortTh>
              <AdminAccountsTh className="text-center">Actions</AdminAccountsTh>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td
                  className="px-4 py-10 text-center text-[color:var(--text-muted)]"
                  colSpan={6}
                >
                  No companies match your search.
                </td>
              </tr>
            ) : (
              sorted.map((c) => (
                <tr
                  key={c.id}
                  role="link"
                  tabIndex={0}
                  onClick={() => navigate(`/admin/clients/${c.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navigate(`/admin/clients/${c.id}`);
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
                        src={normalizeProfilePhotoUrl(c.profilePhoto)}
                        alt={c.companyName}
                        fallback={initialsFromCompanyName(c.companyName)}
                      />
                      <div className="min-w-0">
                        <div className="font-semibold text-[color:var(--text)]">
                          {c.companyName}
                        </div>
                        <div className="mt-0.5 truncate text-xs text-[color:var(--text-muted)]">
                          {c.subtitle}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="max-w-[200px] px-4 py-4 align-middle text-[color:var(--text)]">
                    <span className="line-clamp-2">{c.industry}</span>
                  </td>
                  <td className="px-4 py-4 align-middle text-[color:var(--text)]">{c.email}</td>
                  <td className="px-4 py-4 align-middle tabular-nums text-[color:var(--text)]">
                    {c.phone}
                  </td>
                  <td className="px-4 py-4 align-middle">
                    <SubscriptionPlanPill tier={c.planTier} />
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

function initialsFromCompanyName(name: string) {
  const initials = name
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  return initials || "C";
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
