"use client";

import { useNavigate } from "react-router-dom";
import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";

import {
  AdminAccountsChrome,
  AdminAccountsSortTh,
  EmployerAccountStatusPill,
  type AdminSortDir,
  SubscriptionPlanPill,
} from "@/components/admin/admin-accounts-chrome";
import {
  AdminTablePagination,
  useAdminTablePagination,
} from "@/components/admin/admin-table-pagination";
import { AdminAvatar } from "@/components/admin/admin-avatar";
import { cn } from "@/components/ui/button";
import { normalizeProfilePhotoUrl } from "@/lib/profile-photo";

export type AdminCompanyRow = {
  id: string;
  companyName: string;
  /** Employer type label shown under name (e.g. Company, Organization). */
  subtitle: string;
  profileType?: string;
  email: string;
  phone: string;
  planTier: "free" | "pro";
  accountStatus: "ACTIVE" | "SUSPENDED";
  profilePhoto?: string | null;
};

type CompanySortKey = "companyName" | "email" | "phone" | "planTier" | "accountStatus";

const ACCOUNT_STATUS_ORDER: Record<AdminCompanyRow["accountStatus"], number> = {
  ACTIVE: 0,
  SUSPENDED: 1,
};

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
      const statusLabel = c.accountStatus === "SUSPENDED" ? "suspended" : "active";
      const hay =
        `${c.companyName} ${c.email} ${c.phone} ${c.subtitle} ${statusLabel}`.toLowerCase();
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
        case "accountStatus":
          cmp = ACCOUNT_STATUS_ORDER[a.accountStatus] - ACCOUNT_STATUS_ORDER[b.accountStatus];
          break;
        case "companyName":
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

  const { paginated, ...pageProps } = useAdminTablePagination(sorted, [q, sort.key, sort.dir]);

  return (
    <AdminAccountsChrome
      title="Employers"
      description="Manage employer accounts"
      pageIcon={pageIcon}
      searchPlaceholder="Search employers…"
      searchValue={q}
      onSearchChange={setQ}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-[color:var(--border)] bg-[color:var(--table-header-bg)]">
              <AdminAccountsSortTh
                columnKey="companyName"
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
                columnKey="planTier"
                activeKey={sort.key}
                dir={sort.dir}
                onSort={onSort}
              >
                Subscription plan
              </AdminAccountsSortTh>
              <AdminAccountsSortTh
                columnKey="accountStatus"
                activeKey={sort.key}
                dir={sort.dir}
                onSort={onSort}
              >
                Status
              </AdminAccountsSortTh>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td
                  className="px-4 py-10 text-center text-[color:var(--text-muted)]"
                  colSpan={5}
                >
                  No employers match your search.
                </td>
              </tr>
            ) : (
              paginated.map((c) => (
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
                    "cursor-pointer border-b border-[color:var(--border)] last:border-b-0 hover:bg-[color:var(--hover-subtle)]",
                    "focus-visible:bg-[color:var(--hover-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-300",
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
                  <td className="px-4 py-4 align-middle text-[color:var(--text)]">{c.email}</td>
                  <td className="px-4 py-4 align-middle tabular-nums text-[color:var(--text)]">
                    {c.phone}
                  </td>
                  <td className="px-4 py-4 align-middle">
                    <SubscriptionPlanPill tier={c.planTier} />
                  </td>
                  <td className="px-4 py-4 align-middle">
                    <EmployerAccountStatusPill status={c.accountStatus} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <AdminTablePagination {...pageProps} />
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
