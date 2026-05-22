"use client";

import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { TrainerPageHeader } from "@/components/dashboard/trainer-page-header";
import { TrainerNavIconInbox } from "@/components/dashboard/trainer-sidebar-icons";
import {
  TpTrainerMessagesPanel,
  type StartPeerState,
} from "@/components/messaging/tp-trainer-messages-panel";

type MessagesLocationState = {
  startPeer?: StartPeerState;
};

export default function TrainerMessagesPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const startPeer = useMemo(() => {
    const s = location.state as MessagesLocationState | null;
    return s?.startPeer ?? null;
  }, [location.state]);

  return (
    <div className="space-y-6">
      <TrainerPageHeader
        title="Messages"
        description="Chat with training providers you work with"
        icon={<TrainerNavIconInbox />}
      />
      <TpTrainerMessagesPanel
        viewer="trainer"
        startPeer={startPeer}
        onStartPeerHandled={() => navigate("/trainer/messages", { replace: true, state: {} })}
      />
    </div>
  );
}
