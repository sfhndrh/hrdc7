"use client";

import { Link } from "@/components/link";
import { apiAssetUrl, apiFetch } from "@/lib/api";
import { useLocation } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";

import type { NavItem } from "@/components/app/app-shell";
import { ThemeToggleButton } from "@/components/theme/theme-toggle-button";

export type DashboardStatusPill = {
  variant: "success" | "warning" | "neutral";
  text: string;
} | null;

export type DashboardShellProps = {
  brandName: string;
  portalTagline: string;
  displayName: string;
  roleLine: string;
  statusPill: DashboardStatusPill;
  userEmail: string;
  subtitle: string;
  nav: NavItem[];
  /** Shown above footer note; omit by passing null */
  sidebarCta: { href: string; label: string } | null;
  searchPlaceholder?: string;
  /** Top bar search (client only by default) */
  showSearchBar?: boolean;
  /** Header chip: role label shown under name (Admin/Employer/Trainer) */
  headerRoleLabel?: string;
  /** Header dropdown route */
  profileHref?: string;
  /** Optional avatar image (employer logo / trainer photo). Falls back to initials. */
  avatarUrl?: string | null;
  children: React.ReactNode;
};

export function DashboardShell({
  brandName,
  portalTagline,
  displayName,
  roleLine,
  statusPill,
  userEmail,
  subtitle,
  nav,
  sidebarCta,
  searchPlaceholder = "Search marketplace, trainings…",
  showSearchBar = true,
  headerRoleLabel = roleLine,
  profileHref,
  avatarUrl,
  children,
}: DashboardShellProps) {
  const pathname = useLocation().pathname;
  const initials = initialsFromName(displayName, userEmail);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const topbarHeightClass = "h-16";
  const sidebarWidth = sidebarCollapsed ? 84 : 268;

  const isAdminShell = useMemo(
    () => nav.some((n) => n.href.startsWith("/admin/")),
    [nav],
  );

  type ApiNotification = {
    id: string;
    title: string;
    body: string;
    trainer_id: string | null;
    is_read: number;
    created_at: string;
    isRead?: boolean;
  };

  const [apiNotifications, setApiNotifications] = useState<ApiNotification[] | null>(
    isAdminShell ? [] : null,
  );

  const unreadTopbarCount = useMemo(() => {
    if (!apiNotifications) return 0;
    return apiNotifications.filter((n) => !(n.isRead ?? Boolean(n.is_read))).length;
  }, [apiNotifications]);

  function timeAgo(iso: string) {
    const t = new Date(iso).getTime();
    if (!Number.isFinite(t)) return "";
    const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ago`;
  }

  function parseTrainerName(body: string) {
    const m = body.match(/Trainer:\s*(.+)/i);
    return m ? m[1].trim() : "";
  }

  function loadTopbarNotifications() {
    if (!isAdminShell) return;
    void apiFetch("/api/admin/notifications", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then((d: ApiNotification[]) => setApiNotifications(Array.isArray(d) ? d : []))
      .catch(() => setApiNotifications([]));
  }

  async function openTopbarNotification(n: ApiNotification) {
    if (!isAdminShell) return;
    try {
      await apiFetch(`/api/admin/notifications/${n.id}/read`, {
        method: "PATCH",
        credentials: "include",
      });
    } catch {
      // ignore
    }
    setNotifOpen(false);
    if (n.trainer_id) {
      window.location.href = `/admin/trainers/${n.trainer_id}/review`;
      return;
    }
    window.location.href = "/admin/approval";
  }

  function navIsActive(href: string) {
    if (pathname === href) return true;
    if (href === "/" || href.length < 2) return false;
    return pathname.startsWith(`${href}/`);
  }

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const el = headerRef.current;
      if (!el) return;
      if (e.target instanceof Node && el.contains(e.target)) return;
      setNotifOpen(false);
      setUserOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  async function requestSignOut() {
    const ok = window.confirm("Log out now?");
    if (!ok) return;
    await apiFetch("/api/auth/logout", { method: "POST", credentials: "include" });
    window.location.href = "/";
  }

  return (
    <div className="h-screen overflow-hidden bg-[color:var(--page-bg)]">
      <aside
        className="fixed inset-y-0 left-0 z-40 flex shrink-0 flex-col border-r border-[color:var(--border)] bg-[color:var(--surface)] shadow-[2px_0_12px_var(--shadow-color)] transition-[width] duration-200"
        style={{ width: sidebarWidth }}
      >
        <div
          className={`flex ${topbarHeightClass} items-center gap-3 border-b border-[color:var(--border)] px-5 ${
            sidebarCollapsed ? "justify-center px-3" : ""
          }`}
        >
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#3730a3] via-[var(--primary)] to-[#0f766e] text-sm font-bold text-white shadow-md">
            M
          </div>
          <div className={sidebarCollapsed ? "hidden" : ""}>
            <div className="font-bold leading-tight text-[color:var(--text)]">
              {brandName}
            </div>
            <div className="text-xs text-[color:var(--text-muted)]">{portalTagline}</div>
          </div>
        </div>

        <div
          className={`flex items-center gap-3 border-b border-[color:var(--border)] px-5 py-4 ${
            sidebarCollapsed ? "justify-center px-3" : ""
          }`}
        >
          {avatarUrl ? (
            <img
              src={apiAssetUrl(avatarUrl)}
              alt=""
              className="h-12 w-12 shrink-0 rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] object-cover shadow-inner"
            />
          ) : (
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[var(--accent)] to-orange-600 text-lg font-semibold text-white shadow-inner">
              {initials}
            </div>
          )}
          <div className={`min-w-0 ${sidebarCollapsed ? "hidden" : ""}`}>
            <div className="truncate font-semibold text-[color:var(--text)]">{displayName}</div>
            <div className="truncate text-xs text-[color:var(--text-muted)]">{roleLine}</div>
            {statusPill ? (
              <div
                className={`mt-1 flex items-center gap-1 text-xs font-medium ${
                  statusPill.variant === "success"
                    ? "text-emerald-700"
                    : statusPill.variant === "warning"
                      ? "text-amber-700"
                      : "text-[color:var(--text-muted)]"
                }`}
              >
                {(statusPill.variant === "success" || statusPill.variant === "warning") && (
                  <span aria-hidden className={statusPill.variant === "success" ? "text-emerald-500" : "text-amber-500"}>
                    ●
                  </span>
                )}
                {statusPill.text}
              </div>
            ) : null}
          </div>
        </div>

        <nav className={`flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4 ${sidebarCollapsed ? "px-2" : ""}`}>
          {nav.map((item) => {
            const active = !item.disabled && (item.isActive ? item.isActive(pathname) : navIsActive(item.href));
            if (item.disabled) {
              return (
                <span
                  key={`${item.label}-${item.href}`}
                  title={item.hint}
                  className={`flex cursor-not-allowed items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-[color:var(--text-muted)] opacity-65 ${
                    sidebarCollapsed ? "justify-center px-2" : ""
                  }`}
                  aria-disabled
                >
                  {item.icon ? (
                    <span className="-ml-0.5 grid h-5 w-5 place-items-center text-[color:var(--text-muted)]">
                      {item.icon}
                    </span>
                  ) : null}
                  <span className={sidebarCollapsed ? "hidden" : ""}>{item.label}</span>
                </span>
              );
            }
            return (
              <Link
                key={item.href + item.label}
                href={item.href}
                title={sidebarCollapsed ? item.label : undefined}
                className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-[color:var(--primary)] text-[color:var(--primary-foreground)] shadow-sm"
                    : "text-[color:var(--text)] hover:bg-[color:var(--hover-subtle)]"
                } ${sidebarCollapsed ? "relative justify-center px-2" : ""}`}
              >
                {item.icon ? (
                  <span className={`-ml-0.5 grid h-5 w-5 place-items-center ${active ? "text-white" : "text-[color:var(--text-muted)]"}`}>
                    {item.icon}
                  </span>
                ) : null}
                <span className={sidebarCollapsed ? "hidden" : ""}>{item.label}</span>
                {item.badgeDot && sidebarCollapsed ? (
                  <span
                    className="absolute right-1.5 top-2 h-2 w-2 rounded-full bg-orange-500 ring-2 ring-[color:var(--surface)]"
                    aria-label="Unread"
                  />
                ) : item.badgeDot ? (
                  <span
                    className={`ml-auto h-2 w-2 shrink-0 rounded-full bg-orange-500 ${
                      active ? "ring-2 ring-white/40" : ""
                    }`}
                    aria-label="Unread"
                  />
                ) : !sidebarCollapsed && item.badgeText ? (
                  <span
                    className={`ml-auto inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                      active
                        ? "border-white/25 bg-white/15 text-white"
                        : "border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text-muted)]"
                    }`}
                  >
                    {item.badgeText}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        {sidebarCta ? (
          <div className={`border-t border-[color:var(--border)] p-4 ${sidebarCollapsed ? "px-3" : ""}`}>
            <Link
              href={sidebarCta.href}
              title={sidebarCollapsed ? sidebarCta.label : undefined}
              className={`flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4338ca] to-[var(--primary)] py-3 text-sm font-semibold text-white shadow-md hover:opacity-95 ${
                sidebarCollapsed ? "px-0" : ""
              }`}
            >
              <span className={sidebarCollapsed ? "hidden" : ""}>{sidebarCta.label}</span>
              <span className={sidebarCollapsed ? "text-base leading-none" : "hidden"} aria-hidden>
                +
              </span>
            </Link>
          </div>
        ) : null}

        {subtitle.trim() ? (
          <div
            className={`mt-auto border-t border-[color:var(--border)] px-4 py-3 text-xs text-[color:var(--text-muted)] ${
              sidebarCollapsed ? "hidden" : ""
            }`}
          >
            {subtitle}
          </div>
        ) : null}
      </aside>

      <div className="flex h-screen min-w-0 flex-col" style={{ marginLeft: sidebarWidth }}>
        <header
          className={`fixed right-0 top-0 z-30 flex ${topbarHeightClass} shrink-0 items-center justify-between gap-6 border-b border-[color:var(--border)] bg-[color:var(--surface)] px-6 shadow-sm`}
          style={{ left: sidebarWidth }}
          ref={headerRef}
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <IconButton
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              onClick={() => setSidebarCollapsed((v) => !v)}
            >
              <HamburgerIcon />
            </IconButton>

            {showSearchBar ? (
              <div className="relative max-w-xl flex-1">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--text-muted)]">
                  <SearchIcon className="h-4 w-4" />
                </span>
                <input
                  type="search"
                  placeholder={searchPlaceholder}
                  className="w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--topbar-input-bg)] py-2 pl-10 pr-4 text-sm text-[color:var(--text)] placeholder:text-[color:var(--text-muted)]"
                  readOnly
                  aria-readonly="true"
                />
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggleButton />
            <div className="relative">
              <IconButton
                aria-label="Notifications"
                onClick={() => {
                  const next = !notifOpen;
                  setNotifOpen(next);
                  setUserOpen(false);
                  if (next) loadTopbarNotifications();
                }}
              >
                <span className="relative">
                  <BellIcon />
                  {isAdminShell && unreadTopbarCount ? (
                    <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-pink-500" />
                  ) : null}
                </span>
              </IconButton>
              {notifOpen ? (
                <div
                  role="dialog"
                  aria-label="Notifications"
                  className="absolute right-0 z-50 mt-2 w-[320px] overflow-hidden rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] shadow-[0_18px_48px_var(--shadow-elevated)]"
                >
                  <div className="border-b border-[color:var(--border)] px-4 py-3">
                    <div className="text-sm font-semibold text-[color:var(--text)]">
                      Notifications
                    </div>
                    <div className="text-xs text-[color:var(--text-muted)]">
                      {isAdminShell ? `${unreadTopbarCount} unread` : "Latest updates across your account"}
                    </div>
                  </div>
                  <div className="max-h-[360px] overflow-auto py-1">
                    {!isAdminShell ? (
                      <div className="px-4 py-6 text-center text-sm text-[color:var(--text-muted)]">
                        No notification.
                      </div>
                    ) : apiNotifications === null ? (
                      <div className="px-4 py-6 text-center text-sm text-[color:var(--text-muted)]">
                        Loading…
                      </div>
                    ) : apiNotifications.length ? (
                      apiNotifications.slice(0, 10).map((n) => {
                        const unread = !(n.isRead ?? Boolean(n.is_read));
                        const trainerName = parseTrainerName(n.body ?? "") || "—";
                        return (
                          <button
                            key={n.id}
                            type="button"
                            onClick={() => void openTopbarNotification(n)}
                            className={`w-full px-4 py-3 text-left hover:bg-[color:var(--hover-subtle)] ${
                              unread ? "border-l-4 border-l-orange-500" : ""
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="truncate text-sm font-medium text-[color:var(--text)]">
                                  New Certificate Verified
                                </div>
                                <div className="mt-0.5 truncate text-xs text-[color:var(--text-muted)]">
                                  Trainer: {trainerName}
                                </div>
                              </div>
                              <div className="shrink-0 text-[11px] text-[color:var(--text-muted)]">
                                {timeAgo(n.created_at)}
                              </div>
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div className="px-4 py-6 text-center text-sm text-[color:var(--text-muted)]">
                        No notifications yet.
                      </div>
                    )}
                  </div>
                  {isAdminShell ? (
                    <div className="border-t border-[color:var(--border)] px-4 py-2">
                      <Link
                        href="/admin/approval"
                        className="block w-full rounded-lg px-3 py-2 text-center text-sm font-semibold text-[color:var(--primary)] hover:bg-[color:var(--hover-subtle)]"
                        onClick={() => setNotifOpen(false)}
                      >
                        View all notifications
                      </Link>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="relative ml-1">
              <button
                type="button"
                onClick={() => {
                  setUserOpen((v) => !v);
                  setNotifOpen(false);
                }}
                className="flex items-center gap-2 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-2 py-1 pl-1 hover:bg-[color:var(--hover-subtle)]"
                aria-label="Account menu"
              >
              {avatarUrl ? (
                <img
                  src={apiAssetUrl(avatarUrl)}
                  alt=""
                  className="h-8 w-8 rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] object-cover"
                />
              ) : (
                <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-[#818cf8] to-[var(--primary)] text-xs font-semibold text-white">
                  {initials}
                </div>
              )}
              <div className="hidden text-left md:block">
                <div className="max-w-[140px] truncate text-xs font-semibold text-[color:var(--text)]">
                  {displayName}
                </div>
                {headerRoleLabel.trim() ? (
                  <div className="max-w-[140px] truncate text-[11px] text-[color:var(--text-muted)]">{headerRoleLabel}</div>
                ) : null}
              </div>
              <CaretIcon />
              </button>

              {userOpen ? (
                <div className="absolute right-0 z-50 mt-2 w-[220px] overflow-hidden rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] shadow-[0_18px_48px_var(--shadow-elevated)]">
                  <div className="border-b border-[color:var(--border)] px-4 py-3">
                    <div className="truncate text-sm font-semibold text-[color:var(--text)]">{displayName}</div>
                    {headerRoleLabel.trim() ? (
                      <div className="truncate text-xs text-[color:var(--text-muted)]">{headerRoleLabel}</div>
                    ) : null}
                  </div>
                  <div className="py-1">
                    {profileHref ? (
                      <Link
                        href={profileHref}
                        className="block px-4 py-2.5 text-sm text-[color:var(--text)] hover:bg-[color:var(--hover-subtle)]"
                        onClick={() => setUserOpen(false)}
                      >
                        Profile
                      </Link>
                    ) : (
                      <span className="block px-4 py-2.5 text-sm text-[color:var(--text-muted)]" aria-disabled>
                        Profile
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setUserOpen(false);
                        void requestSignOut();
                      }}
                      className="block w-full px-4 py-2.5 text-left text-sm text-[color:var(--text)] hover:bg-[color:var(--hover-subtle)]"
                    >
                      Log out
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto px-6 pb-8 pt-20">
          {children}
        </main>
      </div>
    </div>
  );
}

function initialsFromName(name: string, email: string) {
  const s = name.trim() || email;
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  const one = parts[0] || email.split("@")[0] || "?";
  return one.slice(0, 2).toUpperCase();
}

function IconButton(props: {
  children: React.ReactNode;
  "aria-label": string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={props["aria-label"]}
      onClick={props.onClick}
      className="rounded-lg p-2 text-[color:var(--text-muted)] hover:bg-[color:var(--hover-subtle)]"
    >
      {props.children}
    </button>
  );
}

function SearchIcon(props: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={props.className}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0h6z" />
    </svg>
  );
}

function HamburgerIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function CaretIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="mr-1 h-4 w-4 text-[color:var(--text-muted)]" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  );
}
