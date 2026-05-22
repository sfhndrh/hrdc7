import { Navigate, Outlet } from "react-router-dom";
import { apiFetch } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/auth/AuthProvider";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export function AdminLayout() {
  const { user, loading } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    void apiFetch("/api/admin/notifications", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: Array<{ isRead?: boolean; is_read?: number }>) => {
        const count = (rows ?? []).filter((n) => !(n.isRead ?? Boolean(n.is_read))).length;
        setUnreadCount(count);
      })
      .catch(() => setUnreadCount(0));
  }, []);

  const nav = useMemo(
    () => [
      { href: "/admin/dashboard", label: "Dashboard", icon: <IconHome /> },
      {
        href: "/admin/training-providers",
        label: "Training Providers",
        icon: <IconTrainingProviders />,
        isActive: (p: string) =>
          p === "/admin/training-providers" ||
          p.startsWith("/admin/training-providers/hrdc/") ||
          /^\/admin\/tp-orgs\//.test(p),
      },
      {
        href: "/admin/courses",
        label: "Courses",
        icon: <IconCourses />,
        isActive: (p: string) => p === "/admin/courses" || p.startsWith("/admin/courses/"),
      },
      {
        href: "/admin/trainers",
        label: "Trainers",
        icon: <IconUsers />,
        isActive: (p: string) =>
          p === "/admin/trainers" || /^\/admin\/trainers\/[^/]+$/.test(p),
      },
      { href: "/admin/clients", label: "Employers", icon: <IconBuilding /> },
      { href: "/admin/payments", label: "Payments", icon: <IconCard /> },
      {
        href: "/admin/approval",
        label: "Approval",
        icon: <IconCheckCircle />,
        badgeDot: unreadCount > 0,
        isActive: (p: string) => p === "/admin/approval" || /^\/admin\/trainers\/[^/]+\/review$/.test(p),
      },
      { href: "/admin/settings", label: "Settings", icon: <IconSettings /> },
    ],
    [unreadCount],
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[color:var(--page-bg)] text-sm text-[color:var(--text-muted)]">
        Loading…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login?from=/admin/dashboard" replace />;
  }

  if (user.role !== "ADMIN") {
    return <Navigate to="/" replace />;
  }

  return (
    <DashboardShell
      brandName="MY Certified Trainer"
      portalTagline="Admin console"
      displayName="Admin"
      roleLine="Administrator"
      headerRoleLabel=""
      statusPill={{ variant: "success", text: "Full platform access" }}
      userEmail={user.email ?? ""}
      subtitle=""
      nav={nav}
      sidebarCta={null}
      showSearchBar={false}
      profileHref="/admin/profile"
    >
      <Outlet />
    </DashboardShell>
  );
}

function IconHome() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-1a4 4 0 00-4-4H5a4 4 0 00-4 4v1" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12a4 4 0 100-8 4 4 0 000 8z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-1a4 4 0 00-3-3.87" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function IconBuilding() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 21V7a2 2 0 012-2h10a2 2 0 012 2v14" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01" />
    </svg>
  );
}

function IconCard() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15.5a3.5 3.5 0 110-7 3.5 3.5 0 010 7z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.8 1.8 0 00.36 1.98l.05.05a2 2 0 01-1.42 3.41 2 2 0 01-1.41-.59l-.05-.05a1.8 1.8 0 00-1.98-.36 1.8 1.8 0 00-1.09 1.64V22a2 2 0 01-4 0v-.07a1.8 1.8 0 00-1.09-1.64 1.8 1.8 0 00-1.98.36l-.05.05a2 2 0 01-2.83 0 2 2 0 010-2.82l.05-.05A1.8 1.8 0 005 15a1.8 1.8 0 00-1.64-1.09H3.3a2 2 0 010-4h.06A1.8 1.8 0 005 8.82a1.8 1.8 0 00-.36-1.98l-.05-.05A2 2 0 016.01 3.3l.05.05A1.8 1.8 0 008.04 3a1.8 1.8 0 001.09-1.64V1.3a2 2 0 014 0v.06A1.8 1.8 0 0014.22 3a1.8 1.8 0 001.98-.36l.05-.05A2 2 0 0119.08 3.3a2 2 0 010 2.83l-.05.05A1.8 1.8 0 0019 8.82c.24.55.35 1.15.35 1.76 0 .61-.11 1.21-.35 1.76a1.8 1.8 0 001.4 2.66z" />
    </svg>
  );
}

function IconTrainingProviders() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  );
}

function IconCourses() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      />
    </svg>
  );
}

function IconCheckCircle() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2 4-4m6 0a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}
