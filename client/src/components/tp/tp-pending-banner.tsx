import { Badge } from "@/components/ui/badge";
import { tpIsApproved, tpStatusLabel, type TpOrg } from "@/lib/tp-platform";

export function TpPendingBanner({ org }: { org: TpOrg }) {
  const approved = tpIsApproved(org.status);
  if (approved) return null;

  const rejected = org.status.toUpperCase() === "REJECTED";

  return (
    <div
      className={
        rejected
          ? "rounded-xl border border-red-200 bg-[color:var(--danger-hover-bg)] p-4 text-sm"
          : "rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-sm dark:border-amber-900/50 dark:bg-amber-950/30"
      }
    >
      <div className="flex flex-wrap items-center gap-3">
        <Badge tone={rejected ? "red" : "yellow"}>{tpStatusLabel(org.status)}</Badge>
        <span className="text-[color:var(--text-muted)]">
          {rejected
            ? "Your application was not approved. Contact support or update documents and re-apply."
            : "Your account is awaiting administrator approval. You can view your profile; course and schedule tools unlock after approval."}
        </span>
      </div>
      {org.adminNote ? (
        <p className="mt-3 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-[color:var(--text-muted)]">
          <span className="font-medium text-[color:var(--text)]">Admin note:</span> {org.adminNote}
        </p>
      ) : null}
    </div>
  );
}
