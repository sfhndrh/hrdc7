"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import {
  AdminAccountsSortTh,
  AdminAccountsTh,
  type AdminSortDir,
} from "@/components/admin/admin-accounts-chrome";
import {
  DashboardPageHeader,
  GradientStatCard,
} from "@/components/dashboard/dashboard-widgets";
import { Badge } from "@/components/ui/badge";
import { Button, cn } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { formatAdminTableDate } from "@/lib/format-datetime";
import type { ProvidersData, TrainingProvider } from "@/lib/training-providers";

function statusTone(status: string): "green" | "gray" | "yellow" | "red" {
  const s = status.toLowerCase();
  if (s.includes("active")) return "green";
  if (s.includes("inactive")) return "gray";
  if (s.includes("suspend")) return "red";
  return "yellow";
}

const PAGE_SIZE = 10;

type ProviderSortKey = "name" | "email" | "phone" | "address" | "courses";

function addressSnippet(address: string, max = 48): string {
  const t = address.trim();
  if (!t) return "—";
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

export function AdminTrainingProvidersView({
  data,
  pageIcon,
}: {
  data: ProvidersData | null;
  pageIcon: ReactNode;
}) {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<TrainingProvider | null>(null);
  const [sort, setSort] = useState<{ key: ProviderSortKey; dir: AdminSortDir }>({
    key: "name",
    dir: "asc",
  });
  const [page, setPage] = useState(1);

  const onSort = useCallback((column: string) => {
    const key = column as ProviderSortKey;
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" },
    );
  }, []);

  const filtered = useMemo(() => {
    const list = data?.providers ?? [];
    const needle = q.trim().toLowerCase();
    if (!needle) return list;
    return list.filter((p) => {
      const hay = `${p.name} ${p.email} ${p.phone} ${p.address}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [data?.providers, q]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    const { key: sortKey, dir: sortDir } = sort;
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "courses":
          cmp = a.courses.length - b.courses.length;
          break;
        case "email":
          cmp = a.email.localeCompare(b.email, undefined, {
            sensitivity: "base",
            numeric: true,
          });
          break;
        case "phone":
          cmp = a.phone.localeCompare(b.phone, undefined, {
            sensitivity: "base",
            numeric: true,
          });
          break;
        case "name":
          cmp = a.name.localeCompare(b.name, undefined, {
            sensitivity: "base",
            numeric: true,
          });
          break;
        case "address":
          cmp = a.address.localeCompare(b.address, undefined, {
            sensitivity: "base",
            numeric: true,
          });
          break;
        default:
          cmp = 0;
      }
      if (cmp === 0 && sortKey === "name") {
        cmp = a.registrationNo.localeCompare(b.registrationNo, undefined, {
          sensitivity: "base",
          numeric: true,
        });
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [filtered, sort]);

  useEffect(() => {
    setPage(1);
  }, [q, sort.key, sort.dir]);

  const totalResults = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const paginated = sorted.slice(pageStart, pageStart + PAGE_SIZE);
  const showingFrom = totalResults === 0 ? 0 : pageStart + 1;
  const showingTo = Math.min(pageStart + PAGE_SIZE, totalResults);

  const closeSheet = useCallback(() => setSelected(null), []);

  const lastUpdated = data ? formatAdminTableDate(new Date(data.scrapedAt)) : null;

  if (!data) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader
          title="Training Providers"
          description="HRDC eTRiS registered providers"
          icon={pageIcon}
        />
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Training Providers"
        description="HRDC eTRiS registered providers"
        icon={pageIcon}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <GradientStatCard
          title="Total providers"
          value={String(data.stats.totalProviders)}
          trend="HRDC eTRiS registered training providers"
          gradient="bg-gradient-to-br from-violet-400 via-purple-600 to-indigo-900"
          icon={<ProvidersStatIcon />}
        />
        <GradientStatCard
          title="Total courses"
          value={String(data.stats.totalCourses)}
          trend="Courses listed across all providers"
          gradient="bg-gradient-to-br from-sky-400 via-blue-600 to-indigo-800"
          icon={<CoursesStatIcon />}
        />
        <GradientStatCard
          title="HRDC claimable"
          value={String(
            data.stats.claimableCourses ??
              data.providers.reduce(
                (n, p) => n + p.courses.filter((c) => c.claimable).length,
                0,
              ),
          )}
          trend="Courses marked HRDC Corp claimable"
          gradient="bg-gradient-to-br from-orange-400 via-rose-500 to-pink-600"
          icon={<ClaimableStatIcon />}
        />
      </div>

      <section className="rounded-2xl border border-[color:var(--border)] bg-white p-4 shadow-sm">
        <label className="relative block">
          <span className="sr-only">Search providers</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, email, telephone, address…"
            className="w-full rounded-xl border border-sky-100 bg-sky-50/70 py-2.5 pl-10 pr-4 text-sm focus:border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-200/60"
          />
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--text-muted)]" />
        </label>
      </section>

      <section className="overflow-hidden rounded-2xl border border-[color:var(--border)] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[color:var(--border)] bg-[#faf8f5]">
                <AdminAccountsTh className="w-10">#</AdminAccountsTh>
                <AdminAccountsSortTh
                  columnKey="name"
                  activeKey={sort.key}
                  dir={sort.dir}
                  onSort={onSort}
                >
                  Provider
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
                  Telephone
                </AdminAccountsSortTh>
                <AdminAccountsSortTh
                  columnKey="address"
                  activeKey={sort.key}
                  dir={sort.dir}
                  onSort={onSort}
                >
                  Location
                </AdminAccountsSortTh>
                <AdminAccountsSortTh
                  columnKey="courses"
                  activeKey={sort.key}
                  dir={sort.dir}
                  onSort={onSort}
                >
                  Courses
                </AdminAccountsSortTh>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-[color:var(--text-muted)]">
                    No providers match your filters.
                  </td>
                </tr>
              ) : (
                paginated.map((p, idx) => {
                  const rowNum = pageStart + idx + 1;
                  return (
                    <tr
                      key={`${p.name}-${p.registrationNo}-${rowNum}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelected(p)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelected(p);
                        }
                      }}
                      className={cn(
                        "cursor-pointer border-b border-[color:var(--border)] last:border-b-0 hover:bg-sky-50/40",
                        "focus-visible:bg-sky-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-300",
                      )}
                    >
                      <td className="px-4 py-4 tabular-nums text-[color:var(--text-muted)]">
                        {rowNum}
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div className="font-semibold text-[color:var(--text)]">{p.name}</div>
                        {p.registrationNo ? (
                          <div className="mt-0.5 text-xs text-[color:var(--text-muted)]">
                            {p.registrationNo}
                          </div>
                        ) : null}
                        {p.status ? (
                          <div className="mt-2">
                            <Badge tone={statusTone(p.status)}>{p.status}</Badge>
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-4 align-top text-[color:var(--text)]">
                        {p.email.trim() || "—"}
                      </td>
                      <td className="px-4 py-4 align-top tabular-nums text-[color:var(--text)]">
                        {p.phone.trim() || "—"}
                      </td>
                      <td className="max-w-[240px] px-4 py-4 align-top text-[color:var(--text)]">
                        <span className="line-clamp-2">
                          {p.address.trim() ? addressSnippet(p.address) : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-top tabular-nums text-[color:var(--text)]">
                        {p.courses.length}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {totalResults > 0 ? (
          <TablePagination
            showingFrom={showingFrom}
            showingTo={showingTo}
            totalResults={totalResults}
            currentPage={currentPage}
            totalPages={totalPages}
            onPrevious={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
          />
        ) : null}
      </section>

      {lastUpdated ? (
        <p className="text-sm italic text-[color:var(--text-muted)]">
          Last updated {lastUpdated}
        </p>
      ) : null}

      <ProviderDetailSheet provider={selected} onClose={closeSheet} />
    </div>
  );
}

function TablePagination({
  showingFrom,
  showingTo,
  totalResults,
  currentPage,
  totalPages,
  onPrevious,
  onNext,
}: {
  showingFrom: number;
  showingTo: number;
  totalResults: number;
  currentPage: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-[color:var(--border)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-[color:var(--text-muted)]">
        Showing <span className="font-semibold text-[color:var(--text)]">{showingFrom}</span> to{" "}
        <span className="font-semibold text-[color:var(--text)]">{showingTo}</span> of{" "}
        <span className="font-semibold text-[color:var(--text)]">{totalResults}</span> results
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          onClick={onPrevious}
        >
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={onNext}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-[color:var(--border)] bg-white px-6 text-center shadow-sm">
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

function ProviderDetailSheet({
  provider,
  onClose,
}: {
  provider: TrainingProvider | null;
  onClose: () => void;
}) {
  return (
    <Sheet open={Boolean(provider)} onOpenChange={(open) => !open && onClose()} title={provider?.name}>
      {provider ? <ProviderDetailContent provider={provider} /> : null}
    </Sheet>
  );
}

function ProviderDetailContent({ provider }: { provider: TrainingProvider }) {
  const website = provider.website.trim();
  return (
    <div className="space-y-6 pb-6">
      <div>
        {provider.registrationNo ? (
          <p className="text-sm text-[color:var(--text-muted)]">{provider.registrationNo}</p>
        ) : null}
        {provider.status ? (
          <div className="mt-2">
            <Badge tone={statusTone(provider.status)}>{provider.status}</Badge>
          </div>
        ) : null}
      </div>

      <div className="rounded-xl border border-[color:var(--border)] bg-[#faf8f5] p-4 text-sm">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--text-muted)]">
          Contact
        </h3>
        <dl className="space-y-2">
          <DetailRow label="Email" value={provider.email} href={provider.email ? `mailto:${provider.email}` : undefined} />
          <DetailRow label="Phone" value={provider.phone} />
          <DetailRow label="Fax" value={provider.fax} />
          <DetailRow
            label="Website"
            value={website || "—"}
            href={website ? normalizeUrl(website) : undefined}
          />
        </dl>
      </div>

      {(provider.address.trim() || provider.state.trim()) && (
        <div>
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-[color:var(--text-muted)]">
            Address
          </h3>
          <p className="text-sm text-[color:var(--text)]">
            {[provider.address, provider.state].filter(Boolean).join(", ")}
          </p>
        </div>
      )}

      {provider.description.trim() ? (
        <div>
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-[color:var(--text-muted)]">
            Description
          </h3>
          <p className="text-sm leading-relaxed text-[color:var(--text)]">{provider.description}</p>
        </div>
      ) : null}

      <div>
        <h3 className="mb-3 text-sm font-semibold text-[color:var(--text)]">Courses</h3>
        {provider.courses.length === 0 ? (
          <p className="text-sm text-[color:var(--text-muted)]">No courses listed.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[color:var(--border)]">
            <table className="w-full min-w-[520px] border-collapse text-xs">
              <thead>
                <tr className="border-b border-[color:var(--border)] bg-[#faf8f5]">
                  <Th>Title</Th>
                  <Th>Scheme</Th>
                  <Th>Duration</Th>
                  <Th>Fee</Th>
                  <Th>Mode</Th>
                  <Th>HRDC</Th>
                </tr>
              </thead>
              <tbody>
                {provider.courses.map((c, i) => (
                  <tr key={`${c.code}-${c.title}-${i}`} className="border-b border-[color:var(--border)] last:border-0">
                    <td className="px-3 py-2 font-medium">{c.title || "—"}</td>
                    <td className="px-3 py-2">{c.scheme || "—"}</td>
                    <td className="px-3 py-2">{c.duration || "—"}</td>
                    <td className="px-3 py-2">{c.fee || "—"}</td>
                    <td className="px-3 py-2">{c.mode || "—"}</td>
                    <td className="px-3 py-2">
                      {c.claimable ? (
                        <Badge tone="green">HRDC Claimable</Badge>
                      ) : (
                        <Badge tone="gray">Not Claimable</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <div className="flex gap-2">
      <dt className="w-20 shrink-0 text-[color:var(--text-muted)]">{label}</dt>
      <dd className="min-w-0 break-words">
        {href && value && value !== "—" ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-sky-700 hover:underline">
            {value}
          </a>
        ) : (
          <span className="text-[color:var(--text)]">{value.trim() || "—"}</span>
        )}
      </dd>
    </div>
  );
}

function ProvidersStatIcon() {
  return (
    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
      />
    </svg>
  );
}

function CoursesStatIcon() {
  return (
    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      />
    </svg>
  );
}

function ClaimableStatIcon() {
  return (
    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function Th({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0f2942]",
        className,
      )}
    >
      {children}
    </th>
  );
}

function normalizeUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path strokeLinecap="round" d="M20 20l-3-3" />
    </svg>
  );
}
