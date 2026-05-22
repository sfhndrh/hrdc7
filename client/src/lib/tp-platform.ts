export const TP_DELIVERY_MODES = ["Online", "Physical", "Hybrid"] as const;

export const TP_COURSE_CATEGORIES = [
  "Leadership & Management",
  "Digital & Technology",
  "Soft Skills",
  "Technical & Engineering",
  "Sales & Marketing",
  "Finance & Accounting",
  "Health & Safety",
  "Compliance & Regulatory",
  "Industry Specific",
  "Other",
] as const;

export const TP_SKILL_LEVELS = ["Beginner", "Intermediate", "Advanced", "All levels"] as const;

export const TP_SCHEDULE_STATUSES = [
  "DRAFT",
  "PROPOSED",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
] as const;

export type TpOrg = {
  id: string;
  companyName: string;
  ssmNumber: string;
  companyEmail: string;
  phone: string;
  address: string;
  website: string | null;
  hrdcTpId: string | null;
  logoUrl: string | null;
  description: string | null;
  picName: string;
  picPosition: string;
  picEmail: string;
  picPhone: string;
  ssmCertUrl: string;
  hrdcDocUrl: string;
  businessLicenseUrl: string;
  bankProofUrl: string;
  status: string;
  accountStatus: "ACTIVE" | "SUSPENDED";
  suspensionReason: string | null;
  adminNote: string | null;
  approvedAt: string | null;
  hrdcRegApprovedAt?: string | null;
  hrdcRegExpiresAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  user?: { email: string };
};

export type TpDashboard = {
  status: string;
  approved: boolean;
  courses: number;
  trainers: number;
  pendingRequests: number;
  upcomingTrainings: number;
  averageRating: number | null;
  ratingCount: number;
  revenueCompleted: number;
};

export type TpCourse = {
  id: string;
  title: string;
  courseCode: string;
  category: string;
  description: string;
  learningOutcomes: string;
  duration: string;
  deliveryMode: string;
  hrdcClaimable: string;
  courseFee: number;
  maxParticipants: number;
  materialsNote: string | null;
  language: string;
  skillLevel: string;
  trainingLocation: string | null;
  brochureUrl: string | null;
  slidesUrl: string | null;
  sampleMaterialsUrl: string | null;
  isPublished: boolean;
};

export function tpStatusLabel(status: string): string {
  const s = status.toUpperCase();
  if (s === "APPROVED") return "Approved";
  if (s === "PENDING") return "Pending review";
  if (s === "UNDER_REVIEW") return "Under review";
  if (s === "REJECTED") return "Rejected";
  return status;
}

export function tpIsApproved(status: string): boolean {
  return status.toUpperCase() === "APPROVED";
}

export function formatRm(amount: number): string {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    maximumFractionDigits: 0,
  }).format(amount);
}
