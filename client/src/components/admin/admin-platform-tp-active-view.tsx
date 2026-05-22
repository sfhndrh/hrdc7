"use client";

import { useCallback, useMemo, useState } from "react";
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
import { GradientStatCard } from "@/components/dashboard/dashboard-widgets";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/components/ui/button";
import { tpStatusLabel, type TpOrg } from "@/lib/tp-platform";

export type PlatformTpRow = TpOrg & { userEmail: string; courseCount?: number };

type SortKey = "name" | "email" | "phone" | "address" | "status";

function tpStatusTone(status: string): "green" | "yellow" | "red" | "gray" {
  const s = status.toUpperCase();
  if (s === "APPROVED") return "green";
  if (s === "REJECTED") return "red";
  if (s === "PENDING" || s === "UNDER_REVIEW") return "yellow";
  return "gray";
}

function addressSnippet(address: string, max = 48): string {
  const t = address.trim();
  if (!t) return "—";
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

export function AdminPlatformTpActiveView({ orgs }: { orgs: PlatformTpRow[] }) {
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: AdminSortDir }>({
    key: "name",
    dir: "asc",
  });

  const onSort = useCallback((column: string) => {
    const key = column as SortKey;
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" },
    );
  }, []);

  const stats = useMemo(() => {
    const total = orgs.length;
    const approved = orgs.filter((o) => o.status === "APPROVED").length;
    const pending = orgs.filter(
      (o) => o.status === "PENDING" || o.status === "UNDER_REVIEW",
    ).length;
    return { total, approved, pending };
  }, [orgs]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return orgs;
    return orgs.filter((o) => {
      const hay = `${o.companyName} ${o.userEmail} ${o.companyEmail} ${o.phone} ${o.address} ${o.ssmNumber}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [orgs, q]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    const { key: sortKey, dir: sortDir } = sort;
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "email":
          cmp = (a.companyEmail || a.userEmail).localeCompare(b.companyEmail || b.userEmail, undefined, {
            sensitivity: "base",
          });
          break;
        case "phone":
          cmp = a.phone.localeCompare(b.phone, undefined, { sensitivity: "base", numeric: true });
          break;
        case "address":
          cmp = (a.address ?? "").localeCompare(b.address ?? "", undefined, { sensitivity: "base" });
          break;
        case "status":
          cmp = a.status.localeCompare(b.status);
          break;
        case "name":
        default:
          cmp = a.companyName.localeCompare(b.companyName, undefined, {
            sensitivity: "base",
            numeric: true,
          });
          if (cmp === 0) {
            cmp = a.ssmNumber.localeCompare(b.ssmNumber, undefined, { sensitivity: "base" });
          }
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [filtered, sort]);

  const pagination = useAdminTablePagination(sorted, [q, sort.key, sort.dir, orgs.length]);
  const { paginated, pageStart, ...pageProps } = pagination;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <GradientStatCard
          title="Registered providers"
          value={String(stats.total)}
          trend="Training providers signed up on this platform"
          gradient="bg-gradient-to-br from-violet-400 via-purple-600 to-indigo-900"
          icon={<ProvidersStatIcon />}
        />
        <GradientStatCard
          title="Approved"
          value={String(stats.approved)}
          trend="Verified and active on the platform"
          gradient="bg-gradient-to-br from-sky-400 via-blue-600 to-indigo-800"
          icon={<ApprovedStatIcon />}
        />
        <GradientStatCard
          title="Pending review"
          value={String(stats.pending)}
          trend="Awaiting administrator approval"
          gradient="bg-gradient-to-br from-orange-400 via-rose-500 to-pink-600"
          icon={<PendingStatIcon />}
        />
      </div>

      <section className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 shadow-sm">
        <label className="relative block">
          <span className="sr-only">Search registered providers</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, email, telephone, address…"
            className="w-full rounded-xl border border-[color:var(--admin-search-border)] bg-[color:var(--admin-search-bg)] py-2.5 pl-10 pr-4 text-sm text-[color:var(--text)] focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]/30"
          />
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--text-muted)]" />
        </label>
      </section>

      <section className="overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[color:var(--border)] bg-[color:var(--table-header-bg)]">
                <AdminAccountsTh className="w-10">#</AdminAccountsTh>
                <AdminAccountsSortTh columnKey="name" activeKey={sort.key} dir={sort.dir} onSort={onSort}>
                  Provider
                </AdminAccountsSortTh>
                <AdminAccountsSortTh columnKey="email" activeKey={sort.key} dir={sort.dir} onSort={onSort}>
                  Email
                </AdminAccountsSortTh>
                <AdminAccountsSortTh columnKey="phone" activeKey={sort.key} dir={sort.dir} onSort={onSort}>
                  Telephone
                </AdminAccountsSortTh>
                <AdminAccountsSortTh columnKey="address" activeKey={sort.key} dir={sort.dir} onSort={onSort}>
                  Location
                </AdminAccountsSortTh>
                <AdminAccountsSortTh columnKey="status" activeKey={sort.key} dir={sort.dir} onSort={onSort}>
                  Status
                </AdminAccountsSortTh>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-[color:var(--text-muted)]">
                    No registered training providers yet.
                  </td>
                </tr>
              ) : (
                paginated.map((o, idx) => {
                  const rowNum = pageStart + idx + 1;
                  return (
                    <tr
                      key={o.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => nav(`/admin/tp-orgs/${o.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          nav(`/admin/tp-orgs/${o.id}`);
                        }
                      }}
                      className={cn(
                        "cursor-pointer border-b border-[color:var(--border)] last:border-b-0 hover:bg-[color:var(--hover-subtle)]",
                        "focus-visible:bg-[color:var(--hover-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-300",
                      )}
                    >
                      <td className="px-4 py-4 tabular-nums text-[color:var(--text-muted)]">{rowNum}</td>
                      <td className="px-4 py-4 align-top">
                        <div className="font-semibold text-[color:var(--text)]">{o.companyName}</div>
                        {o.ssmNumber ? (
                          <div className="mt-0.5 text-xs text-[color:var(--text-muted)]">{o.ssmNumber}</div>
                        ) : null}
                        {o.hrdcTpId ? (
                          <div className="mt-0.5 text-xs text-[color:var(--text-muted)]">
                            HRDC: {o.hrdcTpId}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-4 align-top text-[color:var(--text)]">
                        {o.companyEmail.trim() || o.userEmail || "—"}
                      </td>
                      <td className="px-4 py-4 align-top tabular-nums text-[color:var(--text)]">
                        {o.phone.trim() || "—"}
                      </td>
                      <td className="max-w-[240px] px-4 py-4 align-top text-[color:var(--text)]">
                        <span className="line-clamp-2">
                          {o.address?.trim() ? addressSnippet(o.address) : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <Badge tone={tpStatusTone(o.status)}>{tpStatusLabel(o.status)}</Badge>
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

function ProvidersStatIcon() {
  return (
    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}

function ApprovedStatIcon() {
  return (
    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function PendingStatIcon() {
  return (
    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="11" cy="11" r="7" />
      <path strokeLinecap="round" d="M20 20l-3-3" />
    </svg>
  );
}
