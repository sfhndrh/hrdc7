"use client";

import type { ReactNode } from "react";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-widgets";
import { cn } from "@/components/ui/button";

export type AdminSortDir = "asc" | "desc";

export function AdminAccountsChrome({
  title,
  description,
  pageIcon,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  children,
}: {
  title: string;
  description: string;
  pageIcon: ReactNode;
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <DashboardPageHeader title={title} description={description} icon={pageIcon} />

      <section
        className="rounded-2xl border border-[color:var(--border)] bg-white p-4 shadow-sm"
        aria-label="Search"
      >
        <label className="relative block">
          <span className="sr-only">{searchPlaceholder}</span>
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--text-muted)]" />
          <input
            type="search"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-xl border border-sky-100 bg-sky-50/70 py-2.5 pl-10 pr-4 text-sm text-[color:var(--text)] placeholder:text-[color:var(--text-muted)] focus:border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-200/60"
          />
        </label>
      </section>

      <section
        className="overflow-hidden rounded-2xl border border-[color:var(--border)] bg-white shadow-sm"
        aria-label="Results"
      >
        {children}
      </section>
    </div>
  );
}

/** Non-sortable header (e.g. ACTIONS) */
export function AdminAccountsTh({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-left align-middle text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0f2942]",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function AdminAccountsSortTh({
  children,
  columnKey,
  activeKey,
  dir,
  onSort,
}: {
  children: ReactNode;
  columnKey: string;
  activeKey: string | null;
  dir: AdminSortDir;
  onSort: (key: string) => void;
}) {
  const active = activeKey === columnKey;
  return (
    <th className="px-4 py-3 text-left align-middle text-[11px] font-semibold tracking-[0.12em] text-[#0f2942]">
      <button
        type="button"
        onClick={() => onSort(columnKey)}
        className="-mx-1 inline-flex max-w-full items-center gap-1 rounded-md px-1 py-0.5 text-left uppercase hover:bg-[color:var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
      >
        <span className="min-w-0 truncate">{children}</span>
        <SortChevrons active={active} dir={dir} />
      </button>
    </th>
  );
}

function SortChevrons({ active, dir }: { active: boolean; dir: AdminSortDir }) {
  return (
    <span
      className="inline-flex shrink-0 flex-col leading-[0.45] text-[9px]"
      aria-hidden
    >
      <span
        className={cn(
          "block h-2",
          active && dir === "asc" ? "text-[#0f2942]" : "text-[#0f2942]/35",
        )}
      >
        ▲
      </span>
      <span
        className={cn(
          "block h-2",
          active && dir === "desc" ? "text-[#0f2942]" : "text-[#0f2942]/35",
        )}
      >
        ▼
      </span>
    </span>
  );
}

export function SubscriptionPlanPill({ tier }: { tier: "free" | "pro" }) {
  if (tier === "pro") {
    return (
      <span className="inline-flex rounded-full bg-gradient-to-r from-sky-600 to-indigo-600 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
        Pro
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--text-muted)]">
      Free
    </span>
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
