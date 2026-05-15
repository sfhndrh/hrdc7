import { Navigate } from "react-router-dom";

import { useAuth } from "@/auth/AuthProvider";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-widgets";
import { PageHeaderIconUser } from "@/components/dashboard/page-header-icons";

export default function AdminProfilePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="p-6 text-sm text-[color:var(--text-muted)]">Loading…</div>;
  }

  if (!user) {
    return <Navigate to="/login?from=/admin/profile" replace />;
  }

  if (user.role !== "ADMIN") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <DashboardPageHeader title="Edit profile" icon={<PageHeaderIconUser />} />
      <div className="rounded-2xl border border-[color:var(--border)] bg-white p-6 shadow-sm">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
            <dt className="text-xs font-medium text-[color:var(--text-muted)]">Email</dt>
            <dd className="mt-1 truncate text-sm font-semibold text-[color:var(--text)]">
              {user.email ?? "—"}
            </dd>
          </div>
          <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
            <dt className="text-xs font-medium text-[color:var(--text-muted)]">Role</dt>
            <dd className="mt-1 text-sm font-semibold text-[color:var(--text)]">Admin</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
