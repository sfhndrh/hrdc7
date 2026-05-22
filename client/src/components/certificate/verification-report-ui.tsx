import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiAssetUrl } from "@/lib/api";

export type VerificationApiRow = {
  ai_recommendation: "APPROVE" | "REJECT" | "MANUAL_REVIEW" | null;
  confidence_score: number;
  flags: string[];
  summary: string | null;
  overallPassed: boolean;
  certIsHrdc: boolean;
  certExpired: boolean;
  certHasSeal: boolean;
  certTampered: boolean;
  nameMatchesReg: boolean;
  cert_name: string | null;
  cert_number: string | null;
  cert_issue_date: string | null;
  cert_expiry_date: string | null;
  cert_domain: string | null;
};

export const FLAG_LABELS: Record<string, string> = {
  not_hrdc_certificate: "Not an HRDC certificate",
  cert_expired: "Certificate is expired",
  name_mismatch: "Name does not match registration",
  no_official_seal: "No official seal detected",
  suspected_tampered: "Document may have been tampered",
  low_image_quality: "Image quality too low",
  missing_key_fields: "Key fields unreadable",
  wrong_document_type: "Wrong document type",
  verification_service_error: "Verification error — review manually",
};

export function isPdf(url: string) {
  return /\.pdf(\?|#|$)/i.test(url);
}

export function CertificatePreviewBlock(props: {
  certFileUrl: string | null | undefined;
  title?: string;
  emptyClassName?: string;
  pdfLinkLabel?: string;
  footerCaption?: string | null;
}) {
  const title = props.title ?? "Certificate preview";
  const pdfLabel = props.pdfLinkLabel ?? "Open / download";
  return (
    <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
      <div className="text-sm font-semibold">{title}</div>
      {props.certFileUrl ? (
        isPdf(props.certFileUrl) ? (
          <div className="mt-3 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] p-4 text-sm text-[color:var(--text-muted)]">
            <div className="font-medium text-[color:var(--text)]">PDF certificate</div>
            <a
              href={apiAssetUrl(props.certFileUrl)}
              className="mt-2 inline-flex text-sm font-semibold text-[color:var(--primary)] underline"
              target="_blank"
              rel="noreferrer"
            >
              {pdfLabel}
            </a>
          </div>
        ) : (
          <img
            src={apiAssetUrl(props.certFileUrl)}
            alt="Trainer certificate"
            className="mt-3 w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)]"
          />
        )
      ) : (
        <div
          className={
            props.emptyClassName ??
            "mt-3 grid h-80 place-items-center rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] text-sm text-[color:var(--text-muted)]"
          }
        >
          No certificate file available
        </div>
      )}
      {props.footerCaption ? (
        <div className="mt-2 text-center text-xs text-[color:var(--text-muted)]">{props.footerCaption}</div>
      ) : null}
    </div>
  );
}

export function AiVerificationReportPanel(props: {
  verification: VerificationApiRow | null;
  loading: boolean;
  onRefresh?: () => void;
  rerun?: { busy: boolean; onRerun: () => void } | null;
  /** When false, no Refresh controls are shown (trainer certificate view). Default true. */
  showRefresh?: boolean;
}) {
  const { verification, loading, onRefresh, rerun, showRefresh = true } = props;
  const confidence = verification?.confidence_score ?? 0;
  const flags = verification?.flags ?? [];
  const rec = verification?.ai_recommendation ?? null;

  return (
    <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
      <div className="text-sm font-semibold text-[color:var(--text)]">AI Verification Report</div>

      {loading ? (
        <div className="py-6 text-sm text-[color:var(--text-muted)]">Loading…</div>
      ) : !verification ? (
        <div className="mt-3 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4 text-sm text-[color:var(--text-muted)]">
          <div className="font-semibold text-[color:var(--text)]">
            Verification pending — check back shortly
          </div>
          {showRefresh ? (
            <div className="mt-3">
              <Button type="button" variant="outline" size="sm" onClick={() => onRefresh?.()}>
                Refresh
              </Button>
            </div>
          ) : null}
        </div>
      ) : (
        <>
          <div
            className={`mt-3 rounded-xl border-l-4 p-4 ${
              rec === "APPROVE"
                ? "border-green-500 bg-[color:var(--verify-approve-bg)]"
                : rec === "REJECT"
                  ? "border-red-500 bg-[color:var(--verify-reject-bg)]"
                  : "border-amber-500 bg-[color:var(--verify-review-bg)]"
            }`}
          >
            <div
              className={`text-sm font-semibold ${
                rec === "APPROVE"
                  ? "text-[color:var(--verify-approve-text)]"
                  : rec === "REJECT"
                    ? "text-[color:var(--verify-reject-text)]"
                    : "text-[color:var(--verify-review-text)]"
              }`}
            >
              AI Recommendation: {String(rec ?? "").replace(/_/g, " ")}
            </div>
            <div
              className={`mt-1 text-xs ${
                rec === "APPROVE"
                  ? "text-[color:var(--verify-approve-muted)]"
                  : rec === "REJECT"
                    ? "text-[color:var(--verify-reject-muted)]"
                    : "text-[color:var(--verify-review-muted)]"
              }`}
            >
              {confidence} / 100 confidence
            </div>
            <div className="mt-2 h-2 w-full rounded bg-[color:var(--verify-progress-track)]">
              <div
                className="h-2 rounded bg-[color:var(--primary)]"
                style={{ width: `${Math.max(0, Math.min(100, confidence))}%` }}
              />
            </div>
          </div>

          {flags.length ? (
            <div className="mt-4">
              <div className="text-sm font-semibold text-[color:var(--text)]">Issues detected</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {flags.map((f) => (
                  <Badge key={f} tone="red">
                    {FLAG_LABELS[f] ?? f}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-4 overflow-visible rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-[color:var(--border)] bg-gradient-to-r from-[#0b1f3b] to-[#1e3a8a] px-4 py-3">
              <div className="text-sm font-semibold text-white">Extracted data</div>
              <div className="text-xs font-semibold text-white/80">Verified fields & checks</div>
            </div>
            <div className="divide-y divide-[color:var(--border)]">
              <TableRow
                label="HRDC certificate"
                value={verification.certIsHrdc ? "Yes" : "No"}
                status={verification.certIsHrdc ? "ok" : "bad"}
                helpText="Checks whether the uploaded document appears to be a genuine HRD Corp (HRDC) trainer certificate (correct layout, logo, wording, and document type)."
              />
              <TableRow
                label="Name on certificate"
                value={verification.cert_name ?? ""}
                helpText="Extracts the trainee/trainer name printed on the certificate for comparison against the name used during registration."
              />
              <TableRow
                label="Matches registration"
                value={verification.nameMatchesReg ? "Yes" : "No"}
                status={verification.nameMatchesReg ? "ok" : "bad"}
                helpText="Verifies whether the certificate name matches the trainer's registered full name (allowing for minor formatting differences)."
              />
              <TableRow
                label="Certificate number"
                value={verification.cert_number ?? ""}
                helpText="Extracts the certificate reference/ID number if present. Used as an additional authenticity signal and for admin cross-checking."
              />
              <TableRow
                label="Issue date"
                value={verification.cert_issue_date ?? ""}
                helpText="Extracts the issue/awarded date printed on the certificate."
              />
              <TableRow
                label="Expiry date"
                value={verification.cert_expiry_date ?? ""}
                status={verification.certExpired ? "bad" : "ok"}
                helpText="Extracts the expiry/valid-until date and checks whether the certificate is currently expired."
              />
              <TableRow
                label="Official seal"
                value={verification.certHasSeal ? "Present" : "Missing"}
                status={verification.certHasSeal ? "ok" : "bad"}
                helpText="Checks for presence of an official stamp/seal/signature mark typically found on authentic certificates."
              />
              <TableRow
                label="Suspected tampered"
                value={verification.certTampered ? "Yes" : "No"}
                status={verification.certTampered ? "bad" : "ok"}
                helpText="Detects signs of tampering (inconsistent fonts, edits, artifacts, missing elements, or unusual formatting). If suspected, the application should be manually reviewed."
              />
            </div>
          </div>

          <div className="mt-4">
            <div className="text-xs font-semibold tracking-widest text-[color:var(--text-muted)]">
              AI ANALYSIS
            </div>
            <div className="mt-2 rounded-lg border border-[color:var(--border)] bg-[color:var(--verify-analysis-bg)] p-4 text-sm text-[color:var(--text)]">
              {verification.summary ?? ""}
            </div>
          </div>

          {showRefresh || rerun ? (
            <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
              {showRefresh ? (
                <Button type="button" variant="outline" size="sm" onClick={() => onRefresh?.()}>
                  Refresh
                </Button>
              ) : null}
              {rerun ? (
                <Button type="button" size="sm" disabled={rerun.busy} onClick={rerun.onRerun}>
                  Re-run AI Verification
                </Button>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

function TableRow(props: {
  label: string;
  value: string;
  status?: "ok" | "bad";
  helpText?: string;
}) {
  return (
    <div className="group grid grid-cols-[1fr_1fr_84px] items-center gap-3 px-4 py-3 text-sm transition hover:bg-[color:var(--hover-subtle)]">
      <div className="flex items-center gap-2 font-medium text-[color:var(--text)]">
        <span>{props.label}</span>
        {props.helpText ? <InfoTip text={props.helpText} /> : null}
      </div>
      <div className="truncate font-semibold text-[color:var(--text)]">
        {props.value?.trim?.() ? props.value : <span className="font-normal text-[color:var(--text-muted)]">—</span>}
      </div>
      <div className="flex items-center justify-end">
        {props.status === "ok" ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-[color:var(--verify-pass-bg)] px-3 py-1 text-xs font-semibold text-[color:var(--verify-pass-text)] ring-1 ring-[color:var(--verify-pass-icon)]/40">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-[color:var(--verify-pass-icon)] text-white">
              ✓
            </span>
            Pass
          </span>
        ) : props.status === "bad" ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-[color:var(--verify-fail-bg)] px-3 py-1 text-xs font-semibold text-[color:var(--verify-fail-text)] ring-1 ring-[color:var(--verify-fail-icon)]/40">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-[color:var(--verify-fail-icon)] text-white">
              ×
            </span>
            Fail
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-[color:var(--verify-neutral-bg)] px-3 py-1 text-xs font-semibold text-[color:var(--verify-neutral-text)] ring-1 ring-[color:var(--verify-neutral-ring)]">
            —
          </span>
        )}
      </div>
    </div>
  );
}

function InfoTip(props: { text: string }) {
  return (
    <span className="relative inline-flex items-center">
      <span
        tabIndex={0}
        role="button"
        aria-label="Field info"
        className="grid h-5 w-5 place-items-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] text-[11px] font-bold text-[color:var(--text-muted)] shadow-sm outline-none transition hover:bg-[color:var(--hover-subtle)] focus-visible:ring-2 focus-visible:ring-[color:var(--primary)]"
      >
        i
      </span>
      <span
        className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 hidden w-72 -translate-x-1/2 whitespace-normal rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] p-3 text-xs font-medium leading-relaxed text-[color:var(--text)] shadow-lg group-hover:block group-focus-within:block"
      >
        {props.text}
      </span>
    </span>
  );
}
