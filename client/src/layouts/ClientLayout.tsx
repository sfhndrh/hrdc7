import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "@/auth/AuthProvider";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export function ClientLayout() {
  const { user, loading } = useAuth();
  const [row, setRow] = useState<{
    companyName: string | null;
    industry: string | null;
    profilePhoto: string | null;
    profileComplete: boolean;
    subscription: { status: string; expiresAt: string | null } | null;
  } | null>(null);
  const [shellLoading, setShellLoading] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setShellLoading(false);
      return;
    }
    if (user.role !== "CLIENT" && user.role !== "ADMIN") {
      setShellLoading(false);
      return;
    }
    if (user.role === "ADMIN") {
      setRow(null);
      setShellLoading(false);
      return;
    }
    void apiFetch("/api/client/me", { credentials: "include" })
      .then((r) => r.json())
      .then(
        (d: {
          client?: {
            companyName: string;
            industry: string;
            profilePhoto: string | null;
            profileComplete: boolean;
            subscription: { status: string; expiresAt: Date | null } | null;
          } | null;
        }) => {
          if (d.client) {
            setRow({
              companyName: d.client.companyName,
              industry: d.client.industry,
              profilePhoto: d.client.profilePhoto ?? null,
              profileComplete: d.client.profileComplete,
              subscription: d.client.subscription
                ? {
                    status: d.client.subscription.status,
                    expiresAt: d.client.subscription.expiresAt
                      ? new Date(d.client.subscription.expiresAt).toISOString()
                      : null,
                  }
                : null,
            });
          } else {
            setRow(null);
          }
        },
      )
      .finally(() => setShellLoading(false));
  }, [user, loading]);

  if (loading || shellLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f7fc] text-sm text-[color:var(--text-muted)]">
        Loading…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login?from=/client/dashboard" replace />;
  }

  if (user.role !== "CLIENT" && user.role !== "ADMIN") {
    return <Navigate to="/" replace />;
  }

  const isAdminViewer = user.role === "ADMIN";

  const displayName = isAdminViewer
    ? user.email ?? "Admin"
    : row?.companyName ?? user.email ?? "Company";

  const roleLine = isAdminViewer
    ? "Admin preview"
    : row?.industry
      ? `${row.industry}`
      : "Company account";

  const subActive =
    !!row?.subscription &&
    row.subscription.status === "ACTIVE" &&
    (!row.subscription.expiresAt || new Date(row.subscription.expiresAt) > new Date());

  const statusPill = isAdminViewer
    ? { variant: "neutral" as const, text: "Preview as admin" }
    : subActive
      ? { variant: "success" as const, text: "Pro" }
      : row?.profileComplete
        ? ({ variant: "warning" as const, text: "Free" })
        : ({ variant: "warning" as const, text: "Complete company profile" });

  return (
    <DashboardShell
      brandName="MY Certified Trainer"
      portalTagline="Company portal"
      displayName={displayName}
      roleLine={roleLine}
      headerRoleLabel={isAdminViewer ? "Admin" : "Company"}
      statusPill={statusPill}
      userEmail={user.email ?? ""}
      avatarUrl={isAdminViewer ? null : row?.profilePhoto ?? null}
      subtitle=""
      nav={[
        { href: "/client/dashboard", label: "Dashboard", icon: <IconHome /> },
        { href: "/client/profile", label: "Company profile", icon: <IconBuilding /> },
        { href: "/client/trainers", label: "Browse trainers", icon: <IconSearch /> },
        { href: "/client/messages", label: "Messages", icon: <IconInbox /> },
        { href: "/client/calendar", label: "Calendar", icon: <IconCalendar /> },
        { href: "/client/subscription", label: "Subscription", icon: <IconReceipt /> },
      ]}
      sidebarCta={null}
      searchPlaceholder="Search certified trainers, expertise tags…"
      showSearchBar={false}
      profileHref={isAdminViewer ? "/admin/profile" : "/client/profile"}
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

function IconBuilding() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 21V7a2 2 0 012-2h10a2 2 0 012 2v14" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.3-4.3" />
    </svg>
  );
}

function IconReceipt() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 14h6m-6-4h6M7 21l1-1 2 1 2-1 2 1 2-1 2 1 1-1V3l-1 1-2-1-2 1-2-1-2 1-2-1-1 1v18z" />
    </svg>
  );
}

function IconInbox() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h16v10l-3 3H7l-3-3V4z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 14h4l2 3h4l2-3h4" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 3v2M16 3v2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 5h12a2 2 0 012 2v13a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2z" />
    </svg>
  );
}
