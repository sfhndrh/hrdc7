import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { parseAccountSuspendedResponse } from "@/lib/account-suspension";
import { Navigate, Outlet, useNavigate } from "react-router-dom";

import { useAuth } from "@/auth/AuthProvider";
import { AccountSuspendedDialog } from "@/components/client/account-suspended-dialog";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import {
  TpNavIconCalendar,
  TpNavIconCourses,
  TpNavIconProfile,
  TpNavIconRatings,
} from "@/components/tp/tp-nav-icons";
import { tpIsApproved, type TpOrg } from "@/lib/tp-platform";

function NavIcon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5" aria-hidden>
      <path d={d} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TpLayout() {
  const navigate = useNavigate();
  const { user, loading, refresh } = useAuth();
  const [org, setOrg] = useState<TpOrg | null>(null);
  const [shellLoading, setShellLoading] = useState(true);
  const [suspensionReason, setSuspensionReason] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setShellLoading(false);
      return;
    }
    if (user.role !== "TRAINING_PROVIDER" && user.role !== "ADMIN") {
      setShellLoading(false);
      return;
    }
    if (user.role === "ADMIN") {
      setOrg(null);
      setShellLoading(false);
      return;
    }
    void apiFetch("/api/tp/me", { credentials: "include" })
      .then(async (r) => {
        const suspended = await parseAccountSuspendedResponse(r.clone());
        if (suspended) {
          setSuspensionReason(suspended.suspensionReason);
          setOrg(null);
          return;
        }
        if (!r.ok) {
          setOrg(null);
          return;
        }
        const d = (await r.json()) as { org: TpOrg | null };
        setSuspensionReason(null);
        setOrg(d.org ?? null);
      })
      .finally(() => setShellLoading(false));
  }, [user, loading]);

  if (loading || shellLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[color:var(--page-bg)] text-sm text-[color:var(--text-muted)]">
        Loading…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login?from=/tp/dashboard" replace />;
  }

  if (user.role !== "TRAINING_PROVIDER" && user.role !== "ADMIN") {
    return <Navigate to="/" replace />;
  }

  if (suspensionReason !== null && user.role === "TRAINING_PROVIDER") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[color:var(--page-bg)]">
        <AccountSuspendedDialog
          suspensionReason={suspensionReason}
          onDismiss={() => {
            setSuspensionReason(null);
            void refresh().then(() => navigate("/login", { replace: true }));
          }}
        />
      </div>
    );
  }

  if (user.role === "TRAINING_PROVIDER" && !org) {
    return <Navigate to="/" replace />;
  }

  const isAdmin = user.role === "ADMIN";
  const approved = isAdmin || (org ? tpIsApproved(org.status) : false);
  const displayName = isAdmin ? user.email ?? "Admin" : org?.companyName ?? "Training Provider";

  const nav = [
    { href: "/tp/dashboard", label: "Dashboard", icon: <NavIcon d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" /> },
    {
      href: "/tp/courses",
      label: "Courses",
      icon: <TpNavIconCourses />,
      disabled: !approved,
      hint: "Available after admin approval",
    },
    {
      href: "/tp/schedules",
      label: "Schedule",
      icon: <TpNavIconCalendar />,
      disabled: !approved,
    },
    {
      href: "/tp/ratings",
      label: "Ratings",
      icon: <TpNavIconRatings />,
    },
    { href: "/tp/profile", label: "Profile", icon: <TpNavIconProfile /> },
  ];

  return (
    <DashboardShell
      brandName="MY Certified Trainer"
      portalTagline="Training provider portal"
      displayName={displayName}
      roleLine="Training Provider"
      headerRoleLabel={isAdmin ? "Admin" : "Training Provider"}
      statusPill={
        isAdmin
          ? { variant: "neutral", text: "Preview as admin" }
          : approved
            ? { variant: "success", text: "Verified" }
            : { variant: "warning", text: "Pending approval" }
      }
      userEmail={user.email ?? ""}
      avatarUrl={org?.logoUrl ?? null}
      subtitle={org?.hrdcTpId ? `HRDC TP ID: ${org.hrdcTpId}` : ""}
      nav={nav}
      sidebarCta={null}
      showSearchBar={false}
      profileHref={isAdmin ? "/admin/profile" : "/tp/profile"}
    >
      <Outlet context={{ org: org ?? null, approved, isAdmin }} />
    </DashboardShell>
  );
}
