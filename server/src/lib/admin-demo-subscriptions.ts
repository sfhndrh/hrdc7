/**
 * Demo subscription rows on `/admin/subscriptions` and matching detail payloads for
 * `/admin/subscriptions/[id]`. IDs stay stable so the list and detail stay in sync.
 */
export type DemoSubscriptionDetail = {
  companyName: string;
  contactEmail: string;
  planType: string;
  amountLabel: string;
  status: "PENDING_PAYMENT" | "PROOF_UPLOADED" | "ACTIVE" | "EXPIRED" | "REJECTED";
  requestedAtLabel: string;
  proofNote: string;
};

/** Stable sort times aligned with each demo's `requestedAtLabel`. */
export function demoSubscriptionRequestedMs(id: string): number {
  if (id === "demo-sub-1") return new Date(2026, 4, 10, 9, 15).getTime();
  if (id === "demo-sub-2") return new Date(2026, 4, 8, 14, 40).getTime();
  return 0;
}

export const DEMO_SUBSCRIPTION_DETAILS: Record<string, DemoSubscriptionDetail> = {
  "demo-sub-1": {
    companyName: "AIT Worldwide Logistics",
    contactEmail: "finance@ait-worldwide.example.com",
    planType: "monthly",
    amountLabel: "MYR 99.00",
    status: "PROOF_UPLOADED",
    requestedAtLabel: "10 May 2026, 9:15 am",
    proofNote: "Bank transfer slip (demo). Replace with real preview when storage is wired.",
  },
  "demo-sub-2": {
    companyName: "BrightLearn Academy",
    contactEmail: "billing@brightlearn.example.com",
    planType: "monthly",
    amountLabel: "MYR 99.00",
    status: "PENDING_PAYMENT",
    requestedAtLabel: "8 May 2026, 2:40 pm",
    proofNote: "No proof uploaded yet (demo).",
  },
};
