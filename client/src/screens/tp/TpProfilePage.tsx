"use client";

import { TpPendingBanner } from "@/components/tp/tp-pending-banner";
import { TpProfileView } from "@/components/tp/tp-profile-view";
import { PageHeaderIconTpProfile } from "@/components/dashboard/page-header-icons";
import { useTpOutlet } from "@/hooks/use-tp-outlet";

export default function TpProfilePage() {
  const { org, isAdmin } = useTpOutlet();

  if (isAdmin || !org) {
    return (
      <div className="p-6 text-sm text-[color:var(--text-muted)]">
        {isAdmin ? "Admin preview — no TP profile loaded." : "Profile not found."}
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="space-y-6">
        <TpPendingBanner org={org} />
        <TpProfileView org={org} title="Profile" icon={<PageHeaderIconTpProfile />} />
      </div>
    </div>
  );
}
