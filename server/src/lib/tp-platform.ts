import { z } from "zod";

export const TP_STATUSES = [
  "PENDING",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
] as const;

export type TpStatus = (typeof TP_STATUSES)[number];

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

export const registerTpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  companyName: z.string().trim().min(2).max(200),
  companyEmail: z.string().email(),
  phone: z.string().trim().min(5).max(40),
  address: z.string().trim().min(5).max(1000),
  website: z.string().trim().max(500).optional().or(z.literal("")),
  hrdcTpId: z.string().trim().min(2).max(120),
  description: z.string().trim().max(5000).optional().or(z.literal("")),
  logoUrl: z.string().max(600).nullable().optional(),
  picName: z.string().trim().min(2).max(120),
  picPosition: z.string().trim().max(120).optional().or(z.literal("")),
  picEmail: z.string().email(),
  picPhone: z.string().trim().min(5).max(40),
  ssmCertUrl: z.string().min(1),
  hrdcDocUrl: z.string().min(1),
  businessLicenseUrl: z.string().max(600).optional().or(z.literal("")),
  bankProofUrl: z.string().max(600).optional().or(z.literal("")),
});

export const tpCourseSchema = z.object({
  title: z.string().trim().min(2).max(300),
  courseCode: z.string().trim().min(1).max(80),
  category: z.string().trim().min(1).max(120),
  description: z.string().trim().min(10).max(10000),
  learningOutcomes: z.string().trim().min(10).max(5000),
  duration: z.string().trim().min(1).max(120),
  deliveryMode: z.enum(TP_DELIVERY_MODES),
  hrdcClaimable: z.enum(["Yes", "No"]),
  courseFee: z.coerce.number().min(0),
  maxParticipants: z.coerce.number().int().min(1).max(10000),
  materialsNote: z.string().trim().max(2000).optional().or(z.literal("")),
  language: z.string().trim().min(1).max(80),
  skillLevel: z.string().trim().min(1).max(80),
  trainingLocation: z.string().trim().max(500).optional().or(z.literal("")),
  brochureUrl: z.string().max(600).nullable().optional(),
  slidesUrl: z.string().max(600).nullable().optional(),
  sampleMaterialsUrl: z.string().max(600).nullable().optional(),
  isPublished: z.boolean().optional(),
});

export const tpScheduleSchema = z.object({
  courseId: z.string().min(1),
  scheduledDate: z.string().trim().min(1),
  scheduledTime: z.string().trim().min(1).max(40),
  venue: z.string().trim().max(500).optional().or(z.literal("")),
  onlineMeetingLink: z.string().trim().max(500).optional().or(z.literal("")),
  trainerId: z.string().nullable().optional(),
  clientId: z.string().nullable().optional(),
  employerRequestId: z.string().nullable().optional(),
  status: z
    .enum(["DRAFT", "PROPOSED", "CONFIRMED", "COMPLETED", "CANCELLED"])
    .optional(),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const tpTrainerLinkSchema = z.object({
  trainerId: z.string().min(1),
});

export function tpIsApproved(status: string): boolean {
  return status === "APPROVED";
}

export function uploadUrlOk(url: string): boolean {
  return (
    url.startsWith("/api/uploads/tp-") ||
    url.startsWith("/api/uploads/certificates/") ||
    /^https:\/\//i.test(url)
  );
}
