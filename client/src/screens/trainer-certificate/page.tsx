"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Navigate } from "react-router-dom";

import { TrainerCertificateReupload } from "@/components/certificate/trainer-certificate-reupload";
import {
  AiVerificationReportPanel,
  CertificatePreviewBlock,
  type VerificationApiRow,
} from "@/components/certificate/verification-report-ui";
import { TrainerPageHeader } from "@/components/dashboard/trainer-page-header";
import { TrainerNavIconCertificate } from "@/components/dashboard/trainer-sidebar-icons";
import { useAuth } from "@/auth/AuthProvider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type TrainerMe = {
  fullName: string;
  certFileUrl: string;
  status: string;
  adminNote: string | null;
};

function hasUploadedCertificate(certFileUrl: string | null | undefined) {
  const u = String(certFileUrl ?? "").trim();
  return u.length > 0 && u !== "pending-upload";
}

function accountStatusLabel(status: string) {
  const s = String(status).toUpperCase();
  if (s === "APPROVED") return "Approved";
  if (s === "REJECTED") return "Rejected";
  if (s === "UNDER_REVIEW") return "Under review";
  return "Awaiting verification";
}

function accountStatusBadgeTone(
  status: string,
): "green" | "red" | "yellow" | "gray" {
  const s = String(status).toUpperCase();
  if (s === "APPROVED") return "green";
  if (s === "REJECTED") return "red";
  if (s === "UNDER_REVIEW") return "yellow";
  return "gray";
}

export default function TrainerCertificatePage() {
  const { user, loading: authLoading } = useAuth();
  const [trainer, setTrainer] = useState<TrainerMe | null>(null);
  const [verification, setVerification] = useState<VerificationApiRow | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);
  const [loadingV, setLoadingV] = useState(true);
  const [verifying, setVerifying] = useState(false);

  const loadTrainer = useCallback(() => {
    if (!user || user.role !== "TRAINER") return;
    void apiFetch("/api/trainer/me", { credentials: "include" })
      .then((r) => r.json())
      .then((d: { trainer: TrainerMe | null }) => setTrainer(d.trainer))
      .catch(() => setTrainer(null));
  }, [user]);

  const loadVerification = useCallback(() => {
    setLoadingV(true);
    void apiFetch("/api/trainer/verification", { credentials: "include" })
      .then(async (r) => {
        if (r.status === 404) return null;
        if (!r.ok) return null;
        return (await r.json()) as VerificationApiRow;
      })
      .then((d) => setVerification(d))
      .catch(() => setVerification(null))
      .finally(() => setLoadingV(false));
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== "TRAINER") {
      setLoadingMe(false);
      return;
    }
    setLoadingMe(true);
    void apiFetch("/api/trainer/me", { credentials: "include" })
      .then((r) => r.json())
      .then((d: { trainer: TrainerMe | null }) => setTrainer(d.trainer))
      .catch(() => setTrainer(null))
      .finally(() => setLoadingMe(false));
  }, [user, authLoading]);

  useEffect(() => {
    if (authLoading || !user || user.role !== "TRAINER") return;
    loadVerification();
  }, [authLoading, user, loadVerification]);

  const handleCertificateUpdated = useCallback(() => {
    setVerifying(true);
    loadTrainer();
    loadVerification();
    const delays = [3000, 6000, 10000, 15000];
    for (const ms of delays) {
      window.setTimeout(() => {
        loadVerification();
        loadTrainer();
      }, ms);
    }
    window.setTimeout(() => setVerifying(false), delays[delays.length - 1]! + 500);
  }, [loadTrainer, loadVerification]);

  if (authLoading || loadingMe) {
    return <div className="p-6 text-sm text-[color:var(--text-muted)]">Loading…</div>;
  }

  if (!user) return <Navigate to="/login?from=/trainer/certificate" replace />;
  if (user.role !== "TRAINER") return <Navigate to="/" replace />;
  if (!trainer) return <Navigate to="/trainer/dashboard" replace />;

  const uploaded = hasUploadedCertificate(trainer.certFileUrl);
  const previewUrl = uploaded ? trainer.certFileUrl : null;

  return (
    <div className="space-y-6">
      <TrainerPageHeader
        title="Certificate"
        icon={<TrainerNavIconCertificate />}
        description="View your HRDC certificate, AI verification summary, and account status."
      />

      <Card>
        <CardContent className="mt-0">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <CertificatePreviewBlock
                certFileUrl={previewUrl}
                title="Preview"
                footerCaption={uploaded ? trainer.fullName : null}
              />
              {!uploaded ? (
                <p className="text-sm text-[color:var(--text-muted)]">
                  No certificate file is on record yet. Complete trainer registration and upload your
                  HRDC certificate (PDF or image) so it appears here.
                </p>
              ) : null}
              <TrainerCertificateReupload
                disabled={verifying}
                onUpdated={handleCertificateUpdated}
              />
            </div>

            <div className="space-y-4">
              <AiVerificationReportPanel
                verification={verification}
                loading={loadingV || verifying}
                onRefresh={loadVerification}
                showRefresh
              />

              <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
                <div className="text-sm font-semibold">Account status</div>
                <p className="mt-3 text-xs text-[color:var(--text-muted)]">
                  Final approval is decided by an administrator.
                </p>
                <div className="mt-2">
                  <Badge tone={accountStatusBadgeTone(trainer.status)}>
                    {accountStatusLabel(trainer.status)}
                  </Badge>
                </div>
                {trainer.status.toUpperCase() === "REJECTED" && trainer.adminNote ? (
                  <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
                    <div className="font-semibold">Note from admin</div>
                    <div className="mt-1 whitespace-pre-wrap">{trainer.adminNote}</div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
