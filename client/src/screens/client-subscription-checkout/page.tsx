import { Link } from "@/components/link";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-widgets";
import { PageHeaderIconReceipt } from "@/components/dashboard/page-header-icons";
import { Button } from "@/components/ui/button";

export default function ClientSubscriptionCheckoutPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/client/subscription"
          className="inline-flex items-center gap-1 text-sm text-[color:var(--text-muted)] hover:text-[color:var(--text)]"
        >
          <span aria-hidden>←</span> Back to Subscription
        </Link>
      </div>

      <DashboardPageHeader
        title="Pro plan — RM 99 / month"
        description="Complete your subscription: pay via bank transfer or QR, then upload your payment proof. Your subscription becomes active once admin verifies the proof."
        icon={<PageHeaderIconReceipt />}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-[color:var(--border)] bg-white p-6 shadow-sm">
          <div className="text-sm font-semibold text-[color:var(--text)]">
            Payment instructions
          </div>
          <div className="mt-2 text-sm text-[color:var(--text-muted)]">
            Admin will configure bank details + QR code in settings.
          </div>
          <div className="mt-4 grid gap-2 text-sm">
            <div className="grid grid-cols-[120px_1fr] gap-3">
              <div className="text-[color:var(--text-muted)]">Bank</div>
              <div className="font-medium text-[color:var(--text)]">—</div>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-3">
              <div className="text-[color:var(--text-muted)]">Account</div>
              <div className="font-medium text-[color:var(--text)]">—</div>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-3">
              <div className="text-[color:var(--text-muted)]">Amount</div>
              <div className="font-medium text-[color:var(--text)]">
                RM 99 / month
              </div>
            </div>
          </div>
          <div className="mt-4 grid h-44 place-items-center rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-muted)] text-sm text-[color:var(--text-muted)]">
            QR code image
          </div>
        </div>

        <div className="rounded-2xl border border-[color:var(--border)] bg-white p-6 shadow-sm">
          <div className="text-sm font-semibold text-[color:var(--text)]">
            Upload payment proof
          </div>
          <div className="mt-2 text-sm text-[color:var(--text-muted)]">
            Upload screenshot/receipt after you pay.
          </div>
          <input className="mt-4 block w-full text-sm" type="file" />
          <div className="mt-4 flex items-center justify-end gap-2">
            <Button variant="outline" type="button">
              Cancel
            </Button>
            <Button type="button">Upload proof</Button>
          </div>

          <div className="mt-6 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3 text-xs text-[color:var(--text-muted)]">
            Next: wire this to `Subscription` records and admin approval.
          </div>
        </div>
      </div>
    </div>
  );
}
