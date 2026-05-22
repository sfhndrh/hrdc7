"use client";

import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-widgets";
import { PageHeaderIconInbox } from "@/components/dashboard/page-header-icons";
import {
  TpTrainerMessagesPanel,
  type StartPeerState,
} from "@/components/messaging/tp-trainer-messages-panel";
import { useTpOutlet } from "@/hooks/use-tp-outlet";

type MessagesLocationState = {
  startPeer?: StartPeerState;
};

export default function TpMessagesPage() {
  const { approved } = useTpOutlet();
  const location = useLocation();
  const navigate = useNavigate();
  const startPeer = useMemo(() => {
    const s = location.state as MessagesLocationState | null;
    return s?.startPeer ?? null;
  }, [location.state]);

  if (!approved) {
    return (
      <div className="p-6 text-sm text-[color:var(--text-muted)]">
        Messaging unlocks after your organization is approved.
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <DashboardPageHeader
        title="Messages"
        description="Chat with certified trainers on the platform"
        icon={<PageHeaderIconInbox />}
      />
      <TpTrainerMessagesPanel
        viewer="tp"
        startPeer={startPeer}
        onStartPeerHandled={() => navigate("/tp/messages", { replace: true, state: {} })}
      />
    </div>
  );
}
