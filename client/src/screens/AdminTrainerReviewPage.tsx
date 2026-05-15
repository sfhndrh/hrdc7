"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useNavigate, useParams } from "react-router-dom";

import {
  AiVerificationReportPanel,
  CertificatePreviewBlock,
  type VerificationApiRow,
} from "@/components/certificate/verification-report-ui";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-widgets";
import { PageHeaderIconCertificate } from "@/components/dashboard/page-header-icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminTrainerReviewPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const trainerId = id ?? "";

  const [trainer, setTrainer] = useState<{ fullName: string; certFileUrl: string } | null>(
    null,
  );
  const [verification, setVerification] = useState<VerificationApiRow | null>(null);
  const [loadingV, setLoadingV] = useState(true);
  const [adminNote, setAdminNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!trainerId) return;
    void apiFetch(`/api/admin/trainers/${trainerId}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d: { trainer?: { fullName: string; certFileUrl: string } }) =>
        setTrainer(d.trainer ?? null),
      )
      .catch(() => setTrainer(null));
  }, [trainerId]);

  function loadVerification() {
    if (!trainerId) return;
    setLoadingV(true);
    void apiFetch(`/api/admin/trainers/${trainerId}/verification`, {
      credentials: "include",
    })
      .then(async (r) => {
        if (r.status === 404) return null;
        return (await r.json()) as VerificationApiRow;
      })
      .then((d) => setVerification(d))
      .catch(() => setVerification(null))
      .finally(() => setLoadingV(false));
  }

  useEffect(() => {
    loadVerification();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trainerId]);

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Verification Review"
        description={trainer?.fullName ? `Trainer: ${trainer.fullName}` : "Trainer"}
        icon={<PageHeaderIconCertificate />}
        right={null}
      />
      <Card>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <CertificatePreviewBlock
              certFileUrl={trainer?.certFileUrl}
              pdfLinkLabel="Download"
              footerCaption={trainer?.fullName ?? ""}
            />

            <div className="space-y-4">
              <AiVerificationReportPanel
                verification={verification}
                loading={loadingV}
                onRefresh={loadVerification}
                rerun={{
                  busy,
                  onRerun: () => {
                    setBusy(true);
                    void apiFetch(`/api/admin/trainers/${trainerId}/verify-rerun`, {
                      method: "POST",
                      credentials: "include",
                    })
                      .then(() =>
                        window.alert("Verification is running — refresh in 15 seconds"),
                      )
                      .finally(() => setBusy(false));
                  },
                }}
              />

              <div className="rounded-xl border bg-white p-4">
                <div className="text-sm font-semibold">Admin decision</div>
                <textarea
                  className="mt-3 min-h-24 w-full rounded-md border p-3 text-sm"
                  placeholder="Note to trainer (shown if rejected)"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                />
                <div className="mt-3 flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    type="button"
                    className="border-red-200 text-red-700 hover:bg-red-50"
                    disabled={busy || !trainerId}
                    onClick={() => {
                      if (!window.confirm("Reject this trainer application?")) return;
                      setBusy(true);
                      void apiFetch(`/api/admin/trainers/${trainerId}/reject`, {
                        method: "PATCH",
                        credentials: "include",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ adminNote }),
                      })
                        .then(() => nav("/admin/trainers"))
                        .finally(() => setBusy(false));
                    }}
                  >
                    Reject Application
                  </Button>
                  <Button
                    type="button"
                    disabled={busy || !trainerId}
                    onClick={() => {
                      if (!window.confirm("Approve this trainer?")) return;
                      setBusy(true);
                      void apiFetch(`/api/admin/trainers/${trainerId}/approve`, {
                        method: "PATCH",
                        credentials: "include",
                      })
                        .then(() => nav("/admin/trainers"))
                        .finally(() => setBusy(false));
                    }}
                  >
                    Approve Trainer
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
