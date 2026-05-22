import { Link } from "@/components/link";
import type { ReactNode } from "react";

import { cn } from "@/components/ui/button";

/** Top promo strip */
export function DashboardBanner(props: {
  message: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-medium text-[color:var(--text)]">{props.message}</p>
      <div className="flex flex-wrap gap-2">
        {props.secondaryHref && props.secondaryLabel ? (
          <Link
            href={props.secondaryHref}
            className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2 text-sm font-semibold text-[color:var(--text)] hover:bg-[color:var(--surface-muted)]"
          >
            {props.secondaryLabel}
          </Link>
        ) : null}
        <Link
          href={props.primaryHref}
          className="rounded-lg bg-gradient-to-r from-[#6366f1] to-[var(--primary)] px-4 py-2 text-sm font-semibold text-white shadow-md hover:opacity-95"
        >
          {props.primaryLabel}
        </Link>
      </div>
    </div>
  );
}

/**
 * Page title row: rounded square with dark blue → purple vertical gradient, white icon, bold title.
 * Use icons from `@/components/dashboard/page-header-icons` in the `icon` slot.
 */
export function DashboardPageHeader(props: {
  title: string;
  description?: string;
  icon?: ReactNode;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start justify-between gap-4",
        props.className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-gradient-to-b from-[#0c2744] via-[#1e3a8a] to-[#4c1d95] text-white shadow-md ring-1 ring-white/10 [&_svg]:text-white"
          aria-hidden
        >
          {props.icon ?? <HomeMiniIcon />}
        </span>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold leading-tight text-[color:var(--text)]">
            {props.title}
          </h1>
          {props.description ? (
            <p className="mt-1 text-sm text-[color:var(--text-muted)]">{props.description}</p>
          ) : null}
        </div>
      </div>
      {props.right ? <div className="shrink-0 pt-0.5">{props.right}</div> : null}
    </div>
  );
}

export function GradientStatCard(props: {
  title: string;
  value: string;
  trend: string;
  /** Tailwind gradient utility classes, applied to the icon tile and the value text. */
  gradient: string;
  icon: React.ReactNode;
  /** When set, the whole card navigates to this route on click. */
  href?: string;
}) {
  const card = (
    <div className="relative overflow-hidden rounded-2xl border border-[color:var(--border)] bg-gradient-to-br from-[color:var(--card-gradient-from)] via-[color:var(--card-gradient-via)] to-[color:var(--card-gradient-to)] p-4 shadow-[0_8px_22px_var(--shadow-color)]">
      <div
        className={`grid h-10 w-10 place-items-center rounded-xl text-white shadow-md ${props.gradient}`}
      >
        {props.icon}
      </div>
      <div className="mt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--text-muted)]">
        {props.title}
      </div>
      <div
        className={`mt-1 break-words bg-clip-text text-2xl font-semibold leading-tight tracking-tight text-transparent sm:text-3xl ${props.gradient}`}
      >
        {props.value}
      </div>
      <div className="mt-2 text-xs font-medium text-[color:var(--text-muted)]">
        {props.trend}
      </div>
    </div>
  );

  if (!props.href) return card;

  return (
    <Link
      href={props.href}
      className="block rounded-2xl transition-[box-shadow,transform] hover:shadow-[0_12px_28px_rgba(11,31,59,0.1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 active:scale-[0.99]"
    >
      {card}
    </Link>
  );
}

export function AnalyticsChartCard(props: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-md">
      <div className="text-sm font-bold text-[color:var(--text)]">{props.title}</div>
      {props.children}
    </div>
  );
}

export function StylizedBarChart() {
  return (
    <>
      <div className="mt-4 flex h-48 items-end justify-between gap-2 px-2">
        {[38, 52, 45, 70, 55, 88, 62, 75, 48, 92, 67, 80].map((h, i) => (
          <div
            key={i}
            className="w-full max-w-[8%] rounded-t-md bg-gradient-to-t from-indigo-600 via-violet-500 to-pink-400 opacity-90"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap justify-center gap-4 text-xs font-medium text-[color:var(--text-muted)]">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-indigo-600" /> Trend A
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-violet-500" /> Trend B
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-pink-400" /> Trend C
        </span>
      </div>
    </>
  );
}

function buildConicGradient(segments: Array<{ pct: number; color: string }>): string {
  let acc = 0;
  const parts = segments.map((s) => {
    const start = acc;
    acc += s.pct;
    return `${s.color} ${start}% ${acc}%`;
  });
  return `conic-gradient(${parts.join(", ")}, #e5e7eb ${acc}% 100%)`;
}

/** Full pie chart (conic slices + legend). */
export function StylizedPieChart(props: {
  segments: Array<{ label: string; pct: number; color: string }>;
}) {
  const bg = buildConicGradient(props.segments);

  return (
    <div className="mt-2 flex flex-wrap items-center justify-center gap-8 py-4">
      <div
        className="h-44 w-44 shrink-0 rounded-full shadow-md ring-1 ring-[color:var(--border)]"
        style={{ background: bg }}
        role="img"
        aria-label="Pie chart"
      />
      <ul className="max-h-52 space-y-2 overflow-y-auto text-sm text-[color:var(--text)]">
        {props.segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2">
            <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: s.color }} />
            <span className="min-w-0">
              {s.label} <span className="text-[color:var(--text-muted)]">({s.pct}%)</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Donut variant (hollow center). */
export function StylizedDonutChart(props: {
  segments: Array<{ label: string; pct: number; color: string }>;
}) {
  const bg = buildConicGradient(props.segments);

  return (
    <div className="mt-2 flex flex-wrap items-center justify-center gap-8 py-4">
      <div className="relative h-40 w-40 shrink-0">
        <div className="h-full w-full rounded-full shadow-inner" style={{ background: bg }} />
        <div className="absolute inset-[22%] rounded-full bg-[color:var(--surface)] shadow-inner" />
      </div>
      <ul className="space-y-2 text-sm text-[color:var(--text)]">
        {props.segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ background: s.color }} />
            {s.label} ({s.pct}%)
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Vertical bar chart for categorical counts (e.g. courses by category). */
export function CategoryVerticalBarChart(props: {
  items: Array<{ label: string; value: number; color: string }>;
}) {
  const max = Math.max(1, ...props.items.map((i) => i.value));
  const cols = props.items.length;
  return (
    <div
      className="mt-4 grid h-52 gap-x-1.5 gap-y-1 px-1 sm:gap-x-2"
      style={{
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        gridTemplateRows: "auto 1fr auto",
      }}
    >
      {props.items.map((item) => (
        <div
          key={`${item.label}-value`}
          className="flex items-end justify-center"
          title={`${item.label}: ${item.value}`}
        >
          <span className="text-[10px] font-semibold leading-none tabular-nums text-[color:var(--text-muted)]">
            {item.value}
          </span>
        </div>
      ))}
      {props.items.map((item) => {
        const heightPct = Math.max(4, Math.round((item.value / max) * 100));
        return (
          <div
            key={`${item.label}-bar`}
            className="flex min-h-0 items-end justify-center"
            title={`${item.label}: ${item.value}`}
          >
            <div
              className="w-full max-w-[40px] rounded-t-md shadow-sm"
              style={{ height: `${heightPct}%`, backgroundColor: item.color }}
            />
          </div>
        );
      })}
      {props.items.map((item) => (
        <div
          key={`${item.label}-label`}
          className="line-clamp-2 text-center text-[10px] font-medium leading-tight text-[color:var(--text-muted)]"
          title={item.label}
        >
          {item.label}
        </div>
      ))}
    </div>
  );
}

export function HorizontalBarChart(props: {
  items: Array<{ label: string; value: number }>;
  valueSuffix?: string;
}) {
  const max = Math.max(1, ...props.items.map((i) => i.value));
  return (
    <div className="mt-4 space-y-3">
      {props.items.map((i) => (
        <div key={i.label} className="grid grid-cols-[180px_1fr_auto] items-center gap-3">
          <div className="truncate text-xs font-medium text-[color:var(--text)]">{i.label}</div>
          <div className="h-3 overflow-hidden rounded-full bg-[color:var(--surface-muted)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-600 via-violet-500 to-pink-400"
              style={{ width: `${Math.round((i.value / max) * 100)}%` }}
            />
          </div>
          <div className="w-14 text-right text-xs font-semibold text-[color:var(--text)]">
            {i.value}
            {props.valueSuffix ?? ""}
          </div>
        </div>
      ))}
    </div>
  );
}

export type UserManagementAnalytics = {
  totals: { employers: number; trainers: number; trainingProviders: number };
  byRole: Array<{ label: string; value: number; color: string }>;
  signUps: {
    labels: string[];
    employers: number[];
    trainers: number[];
    trainingProviders: number[];
  };
};

function pctSegmentsFromValues(
  items: Array<{ label: string; value: number; color: string }>,
): Array<{ label: string; pct: number; color: string }> {
  const total = items.reduce((a, s) => a + s.value, 0);
  if (!total) return [];
  const segments = items.map((s) => ({
    label: s.label,
    pct: Math.max(1, Math.round((s.value / total) * 100)),
    color: s.color,
  }));
  const pctSum = segments.reduce((a, s) => a + s.pct, 0);
  if (pctSum !== 100 && segments[0]) {
    segments[0] = {
      ...segments[0],
      pct: Math.max(1, segments[0].pct + (100 - pctSum)),
    };
  }
  return segments;
}

/** Admin dashboard: user counts, role breakdown, and sign-up trend. */
export function AdminUserManagementAnalytics(props: {
  data: UserManagementAnalytics | null;
  emptyMessage?: string;
}) {
  if (props.data === null) {
    return (
      <div className="flex h-52 items-center justify-center text-sm text-[color:var(--text-muted)]">
        Loading…
      </div>
    );
  }

  const { totals, byRole, signUps } = props.data;
  const accountTotal = totals.employers + totals.trainers + totals.trainingProviders;
  if (accountTotal === 0) {
    return (
      <div className="flex h-52 items-center justify-center text-sm text-[color:var(--text-muted)]">
        {props.emptyMessage ?? "No users registered yet."}
      </div>
    );
  }

  const pieSegments = pctSegmentsFromValues(byRole);
  const monthlySignUps = signUps.labels.map((label, idx) => ({
    label,
    value:
      (signUps.employers[idx] ?? 0) +
      (signUps.trainers[idx] ?? 0) +
      (signUps.trainingProviders[idx] ?? 0),
  }));
  const hasSignUps = monthlySignUps.some((m) => m.value > 0);

  return (
    <div className="mt-4 space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <UserRoleStatTile
          href="/admin/clients"
          label="Employers"
          value={totals.employers}
          accent="from-pink-500 to-rose-600"
        />
        <UserRoleStatTile
          href="/admin/trainers"
          label="Trainers"
          value={totals.trainers}
          accent="from-indigo-500 to-violet-600"
        />
        <UserRoleStatTile
          href="/admin/training-providers"
          label="Training providers"
          value={totals.trainingProviders}
          accent="from-amber-500 to-orange-600"
        />
      </div>

      {pieSegments.length > 0 ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--text-muted)]">
            Users by role
          </p>
          <StylizedPieChart segments={pieSegments} />
        </div>
      ) : null}

      {hasSignUps ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--text-muted)]">
            New accounts (last 6 months)
          </p>
          <HorizontalBarChart items={monthlySignUps} />
        </div>
      ) : null}
    </div>
  );
}

function UserRoleStatTile(props: {
  href: string;
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <Link
      href={props.href}
      className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3 text-center transition hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
    >
      <div
        className={`bg-gradient-to-br bg-clip-text text-2xl font-bold text-transparent ${props.accent}`}
      >
        {props.value}
      </div>
      <div className="mt-1 text-[11px] font-semibold text-[color:var(--text-muted)]">
        {props.label}
      </div>
    </Link>
  );
}

export function DualSeriesBarChart(props: {
  xLabels: string[];
  seriesA: { label: string; values: number[]; colorClass: string };
  seriesB: { label: string; values: number[]; colorClass: string };
  yMax?: number;
}) {
  const max =
    props.yMax ??
    Math.max(
      1,
      ...props.seriesA.values,
      ...props.seriesB.values,
    );

  return (
    <>
      <div className="mt-4 h-52">
        <div className="flex h-full items-end justify-between gap-3">
          {props.xLabels.map((x, idx) => {
            const a = props.seriesA.values[idx] ?? 0;
            const b = props.seriesB.values[idx] ?? 0;
            const aH = Math.round((a / max) * 100);
            const bH = Math.round((b / max) * 100);
            return (
              <div key={x} className="flex w-full flex-col items-center gap-2">
                <div className="flex h-40 w-full max-w-[56px] items-end gap-1">
                  <div className={`w-1/2 rounded-t-md ${props.seriesA.colorClass}`} style={{ height: `${aH}%` }} />
                  <div className={`w-1/2 rounded-t-md ${props.seriesB.colorClass}`} style={{ height: `${bH}%` }} />
                </div>
                <div className="text-[11px] font-medium text-[color:var(--text-muted)]">{x}</div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap justify-center gap-4 text-xs font-medium text-[color:var(--text-muted)]">
        <span className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-sm ${props.seriesA.colorClass}`} />
          {props.seriesA.label}
        </span>
        <span className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-sm ${props.seriesB.colorClass}`} />
          {props.seriesB.label}
        </span>
      </div>
    </>
  );
}

function HomeMiniIcon() {
  return (
    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}
