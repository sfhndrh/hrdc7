"use client";

import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import type { PlatformTpRow } from "@/components/admin/admin-platform-tp-active-view";
import {
  AdminAccountsSortTh,
  AdminAccountsTh,
  type AdminSortDir,
} from "@/components/admin/admin-accounts-chrome";
import {
  AdminTablePagination,
  useAdminTablePagination,
} from "@/components/admin/admin-table-pagination";
import { cn } from "@/components/ui/button";
import { adminHrdcProviderDetailPath } from "@/lib/hrdc-provider-lookup";
import { formatAdminTableDate } from "@/lib/format-datetime";
import type { ProvidersData, TrainingProvider } from "@/lib/training-providers";

type UnifiedProviderRow = {
  key: string;
  name: string;
  email: string;
  phone: string;
  courseCount: number;
  source: "platform" | "hrdc";
  platformOrgId?: string;
  hrdcProvider?: TrainingProvider;
};

type ProviderSortKey = "name" | "email" | "phone" | "courses";

function buildUnifiedRows(
  platformOrgs: PlatformTpRow[],
  hrdcProviders: TrainingProvider[],
): UnifiedProviderRow[] {
  const platformRows: UnifiedProviderRow[] = platformOrgs.map((o) => ({
    key: `platform-${o.id}`,
    name: o.companyName,
    email: (o.companyEmail?.trim() || o.userEmail?.trim() || "") || "",
    phone: o.phone?.trim() || "",
    courseCount: o.courseCount ?? 0,
    source: "platform",
    platformOrgId: o.id,
  }));

  const hrdcRows: UnifiedProviderRow[] = hrdcProviders.map((p, idx) => ({
    key: `hrdc-${p.registrationNo}-${p.name}-${idx}`,
    name: p.name,
    email: p.email.trim(),
    phone: p.phone.trim(),
    courseCount: p.courses.length,
    source: "hrdc",
    hrdcProvider: p,
  }));

  return [...platformRows, ...hrdcRows];
}

/** Platform registrations and HRDC directory in one table. */
export function AdminTrainingProvidersUnifiedView({
  platformOrgs,
  hrdcData,
}: {
  platformOrgs: PlatformTpRow[];
  hrdcData: ProvidersData | null;
}) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<{ key: ProviderSortKey; dir: AdminSortDir }>({
    key: "courses",
    dir: "desc",
  });

  const onSort = useCallback((column: string) => {
    const key = column as ProviderSortKey;
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" },
    );
  }, []);

  const allRows = useMemo(
    () => buildUnifiedRows(platformOrgs, hrdcData?.providers ?? []),
    [platformOrgs, hrdcData?.providers],
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return allRows;
    return allRows.filter((r) => {
      const hay = `${r.name} ${r.email} ${r.phone}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [allRows, q]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    const { key: sortKey, dir: sortDir } = sort;
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "courses":
          cmp = a.courseCount - b.courseCount;
          break;
        case "email":
          cmp = a.email.localeCompare(b.email, undefined, { sensitivity: "base", numeric: true });
          break;
        case "phone":
          cmp = a.phone.localeCompare(b.phone, undefined, { sensitivity: "base", numeric: true });
          break;
        case "name":
        default:
          cmp = a.name.localeCompare(b.name, undefined, { sensitivity: "base", numeric: true });
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [filtered, sort]);

  const pagination = useAdminTablePagination(sorted, [q, sort.key, sort.dir, allRows.length]);
  const { paginated, pageStart, ...pageProps } = pagination;

  const lastUpdated = hrdcData ? formatAdminTableDate(new Date(hrdcData.scrapedAt)) : null;

  if (allRows.length === 0 && platformOrgs.length === 0 && !hrdcData) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 shadow-sm">
        <label className="relative block">
          <span className="sr-only">Search providers</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, email, phone…"
            className="w-full rounded-xl border border-[color:var(--admin-search-border)] bg-[color:var(--admin-search-bg)] py-2.5 pl-10 pr-4 text-sm text-[color:var(--text)] focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]/30"
          />
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--text-muted)]" />
        </label>
      </section>

      <section className="overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[color:var(--border)] bg-[color:var(--table-header-bg)]">
                <AdminAccountsTh className="w-10">#</AdminAccountsTh>
                <AdminAccountsSortTh columnKey="name" activeKey={sort.key} dir={sort.dir} onSort={onSort}>
                  Name
                </AdminAccountsSortTh>
                <AdminAccountsSortTh columnKey="email" activeKey={sort.key} dir={sort.dir} onSort={onSort}>
                  Email
                </AdminAccountsSortTh>
                <AdminAccountsSortTh columnKey="phone" activeKey={sort.key} dir={sort.dir} onSort={onSort}>
                  Phone
                </AdminAccountsSortTh>
                <AdminAccountsSortTh columnKey="courses" activeKey={sort.key} dir={sort.dir} onSort={onSort}>
                  Courses
                </AdminAccountsSortTh>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-[color:var(--text-muted)]">
                    No providers match your search.
                  </td>
                </tr>
              ) : (
                paginated.map((row, idx) => {
                  const rowNum = pageStart + idx + 1;
                  const interactive = row.source === "platform" || row.hrdcProvider;
                  return (
                    <tr
                      key={row.key}
                      role={interactive ? "button" : undefined}
                      tabIndex={interactive ? 0 : undefined}
                      onClick={() => {
                        if (row.source === "platform" && row.platformOrgId) {
                          navigate(`/admin/tp-orgs/${row.platformOrgId}`);
                        } else if (row.hrdcProvider) {
                          navigate(adminHrdcProviderDetailPath(row.hrdcProvider));
                        }
                      }}
                      onKeyDown={(e) => {
                        if (!interactive) return;
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          if (row.source === "platform" && row.platformOrgId) {
                            navigate(`/admin/tp-orgs/${row.platformOrgId}`);
                          } else if (row.hrdcProvider) {
                            navigate(adminHrdcProviderDetailPath(row.hrdcProvider));
                          }
                        }
                      }}
                      className={cn(
                        interactive &&
                          "cursor-pointer border-b border-[color:var(--border)] last:border-b-0 hover:bg-[color:var(--hover-subtle)] focus-visible:bg-[color:var(--hover-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-300",
                        !interactive && "border-b border-[color:var(--border)] last:border-b-0",
                      )}
                    >
                      <td className="px-4 py-4 tabular-nums text-[color:var(--text-muted)]">{rowNum}</td>
                      <td className="px-4 py-4 align-top font-semibold text-[color:var(--text)]">
                        {row.name}
                      </td>
                      <td className="px-4 py-4 align-top text-[color:var(--text)]">
                        {row.email || "—"}
                      </td>
                      <td className="px-4 py-4 align-top tabular-nums text-[color:var(--text)]">
                        {row.phone || "—"}
                      </td>
                      <td className="px-4 py-4 align-top tabular-nums text-[color:var(--text)]">
                        {row.courseCount}
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

      {lastUpdated ? (
        <p className="text-sm italic text-[color:var(--text-muted)]">
          HRDC directory last updated {lastUpdated}
        </p>
      ) : null}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-[color:var(--border)] bg-[color:var(--surface)] px-6 text-center shadow-sm">
      <p className="max-w-md text-sm text-[color:var(--text-muted)]">
        No training provider data in the database yet. Run{" "}
        <code className="rounded bg-[color:var(--surface-muted)] px-1.5 py-0.5 text-xs">
          npm run db:scrape-providers
        </code>{" "}
        from the project root to export CSV under <code className="text-xs">data/</code>, then{" "}
        <code className="rounded bg-[color:var(--surface-muted)] px-1.5 py-0.5 text-xs">
          npm run db:import-providers-csv
        </code>{" "}
        to load it into the database.
      </p>
    </div>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path strokeLinecap="round" d="M20 20l-3-3" />
    </svg>
  );
}
