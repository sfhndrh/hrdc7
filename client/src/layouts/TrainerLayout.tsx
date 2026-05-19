import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "@/auth/AuthProvider";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { normalizeProfilePhotoUrl } from "@/lib/profile-photo";
import {
  TrainerNavIconCalendar,
  TrainerNavIconCertificate,
  TrainerNavIconHome,
  TrainerNavIconInbox,
  TrainerNavIconProfile,
  TrainerNavIconSettings,
} from "@/components/dashboard/trainer-sidebar-icons";

function trainerIsApproved(status: string) {
  return String(status).toUpperCase() === "APPROVED";
}

export function TrainerLayout() {
  const { user, loading } = useAuth();
  const [trainerRecord, setTrainerRecord] = useState<{
    fullName: string;
    status: string;
    profilePhoto: string | null;
  } | null>(null);
  const [shellLoading, setShellLoading] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setShellLoading(false);
      return;
    }
    if (user.role !== "TRAINER" && user.role !== "ADMIN") {
      setShellLoading(false);
      return;
    }
    if (user.role === "ADMIN") {
      setTrainerRecord(null);
      setShellLoading(false);
      return;
    }
    void apiFetch("/api/trainer/me", { credentials: "include" })
      .then((r) => r.json())
      .then(
        (d: {
          trainer?: {
            fullName: string;
            status: string;
            profilePhoto?: string | null;
          } | null;
        }) => {
          if (d.trainer) {
            setTrainerRecord({
              fullName: d.trainer.fullName,
              status: d.trainer.status,
              profilePhoto: normalizeProfilePhotoUrl(d.trainer.profilePhoto),
            });
          } else {
            setTrainerRecord(null);
          }
        },
      )
      .finally(() => setShellLoading(false));
  }, [user, loading]);

  if (!loading && !shellLoading && user?.role === "TRAINER" && !trainerRecord) {
    return <Navigate to="/" replace />;
  }

  if (loading || shellLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f7fc] text-sm text-[color:var(--text-muted)]">
        Loading…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login?from=/trainer/dashboard" replace />;
  }

  if (user.role !== "TRAINER" && user.role !== "ADMIN") {
    return <Navigate to="/" replace />;
  }

  const isAdminViewer = user.role === "ADMIN";

  let approved = false;
  if (isAdminViewer) approved = true;
  else if (trainerRecord) approved = trainerIsApproved(trainerRecord.status);

  const displayName = isAdminViewer
    ? user.email ?? "Admin"
    : trainerRecord?.fullName ?? user.email ?? "Trainer";

  const nav = [
    { href: "/trainer/dashboard", label: "Dashboard", icon: <TrainerNavIconHome /> },
    { href: "/trainer/profile", label: "Profile", icon: <TrainerNavIconProfile /> },
    {
      href: "/trainer/certificate",
      label: "Certificate",
      icon: <TrainerNavIconCertificate />,
    },
    {
      href: "/trainer/messages",
      label: "Messages",
      icon: <TrainerNavIconInbox />,
      disabled: !approved,
      hint: "Unlocks after approval — chat with companies interested in your training",
    },
    {
      href: "/trainer/calendar",
      label: "Training calendar",
      icon: <TrainerNavIconCalendar />,
      disabled: !approved,
      hint: "Available after your profile is approved by an administrator",
    },
    { href: "/trainer/settings", label: "Settings", icon: <TrainerNavIconSettings /> },
  ];

  return (
    <DashboardShell
      brandName="MY Certified Trainer"
      portalTagline="Trainer portal"
      displayName={displayName}
      roleLine="Certified Trainer"
      headerRoleLabel={isAdminViewer ? "Admin" : "Trainer"}
      statusPill={
        isAdminViewer
          ? { variant: "neutral", text: "Preview as admin" }
          : approved
            ? { variant: "success", text: "Verified" }
            : { variant: "warning", text: "Awaiting verification" }
      }
      userEmail={user.email ?? ""}
      avatarUrl={isAdminViewer ? null : trainerRecord?.profilePhoto ?? null}
      subtitle=""
      nav={nav}
      sidebarCta={null}
      showSearchBar={false}
      profileHref={isAdminViewer ? "/admin/profile" : "/trainer/profile"}
    >
      <Outlet />
    </DashboardShell>
  );
}
