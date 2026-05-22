import { z } from "zod";

export const CLIENT_PROFILE_TYPES = [
  "COMPANY",
  "ORGANIZATION",
  "CLUB",
  "GOVERNMENT",
  "INSTITUTION",
  "INDIVIDUAL",
  "HR_DEPARTMENT",
] as const;

export type ClientProfileType = (typeof CLIENT_PROFILE_TYPES)[number];

const PROFILE_TYPE_LABELS: Record<ClientProfileType, string> = {
  COMPANY: "Company",
  ORGANIZATION: "Organization",
  CLUB: "Club",
  GOVERNMENT: "Government",
  INSTITUTION: "Institution",
  INDIVIDUAL: "Individual",
  HR_DEPARTMENT: "HR / Department",
};

export function profileTypeLabel(type: string | null | undefined): string {
  if (type && type in PROFILE_TYPE_LABELS) {
    return PROFILE_TYPE_LABELS[type as ClientProfileType];
  }
  return PROFILE_TYPE_LABELS.COMPANY;
}

const profileTypeSchema = z.enum(CLIENT_PROFILE_TYPES);

const profilePhotoSchema = z.preprocess(
  (v) => (v == null || v === "" ? null : String(v).trim()),
  z
    .string()
    .max(600)
    .nullable()
    .refine(
      (s) =>
        s === null ||
        s.startsWith("/api/uploads/company-photos/") ||
        /^https:\/\//i.test(s),
      "Invalid profile photo",
    ),
);

const profileDataSchema = z
  .record(z.string(), z.unknown())
  .optional()
  .transform((r) => (r && typeof r === "object" ? r : {}));

export const registerClientSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
    fullName: z.string().trim().min(2).max(120),
    phone: z.string().trim().min(5).max(40),
    profileType: profileTypeSchema,
    profilePhoto: profilePhotoSchema,
    profileData: profileDataSchema,
    contactEmail: z.string().email().optional(),
  })
  .superRefine((data, ctx) =>
    profileDataRefine(
      { profileType: data.profileType, profileData: data.profileData as Record<string, unknown> },
      ctx,
    ),
  );

const OTHER = "Other";

function str(pd: Record<string, unknown>, key: string): string {
  const v = pd[key];
  return typeof v === "string" ? v.trim() : "";
}

function effectiveStr(pd: Record<string, unknown>, key: string, otherKey?: string): string {
  const selected = str(pd, key);
  if (selected === OTHER && otherKey) return str(pd, otherKey);
  return selected;
}

function requireSelect(
  pd: Record<string, unknown>,
  ctx: z.RefinementCtx,
  key: string,
  label: string,
  otherKey?: string,
) {
  const selected = str(pd, key);
  if (!selected) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `${label} is required`,
      path: ["profileData", key],
    });
    return;
  }
  if (selected === OTHER && otherKey && !str(pd, otherKey)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Please specify ${label.toLowerCase()}`,
      path: ["profileData", otherKey],
    });
  }
}

const profileDataRefine = (
  data: { profileType: ClientProfileType; profileData: Record<string, unknown> },
  ctx: z.RefinementCtx,
) => {
  const pd = data.profileData;
  const req = (path: string, msg: string) => {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: msg, path: ["profileData", path] });
  };

  switch (data.profileType) {
    case "COMPANY":
      if (!str(pd, "companyName")) req("companyName", "Company name is required");
      if (!str(pd, "ssmNumber")) req("ssmNumber", "SSM number is required");
      requireSelect(pd, ctx, "industry", "Industry", "industryOther");
      if (!str(pd, "street") || !str(pd, "city") || !str(pd, "state")) {
        req("street", "Complete address is required");
      }
      if (str(pd, "hrdcRegistered") !== "Yes" && str(pd, "hrdcRegistered") !== "No") {
        req("hrdcRegistered", "Select HRDC registered Yes or No");
      }
      break;
    case "ORGANIZATION":
      if (!str(pd, "organizationName")) req("organizationName", "Organization name is required");
      if (!str(pd, "registrationNumber")) req("registrationNumber", "Registration number is required");
      requireSelect(pd, ctx, "organizationType", "Organization type", "organizationTypeOther");
      if (!str(pd, "street") || !str(pd, "city") || !str(pd, "state")) {
        req("street", "Complete address is required");
      }
      break;
    case "CLUB":
      if (!str(pd, "clubName")) req("clubName", "Club name is required");
      if (!str(pd, "universityCommunity")) req("universityCommunity", "University / community is required");
      if (!str(pd, "clubCategory")) req("clubCategory", "Club category is required");
      break;
    case "GOVERNMENT":
      if (!str(pd, "agencyName")) req("agencyName", "Agency name is required");
      requireSelect(pd, ctx, "governmentLevel", "Government level", "governmentLevelOther");
      if (!str(pd, "officeAddress")) req("officeAddress", "Office address is required");
      if (!str(pd, "city")) req("city", "City is required");
      if (!str(pd, "state")) req("state", "State is required");
      break;
    case "INSTITUTION":
      if (!str(pd, "institutionName")) req("institutionName", "Institution name is required");
      requireSelect(pd, ctx, "institutionType", "Institution type", "institutionTypeOther");
      if (!str(pd, "street") || !str(pd, "city") || !str(pd, "state")) {
        req("street", "Complete address is required");
      }
      break;
    case "HR_DEPARTMENT":
      if (!str(pd, "employerName")) req("employerName", "Employer name is required");
      requireSelect(pd, ctx, "department", "Department", "departmentOther");
      requireSelect(pd, ctx, "industry", "Industry", "industryOther");
      if (!str(pd, "street") || !str(pd, "city") || !str(pd, "state")) {
        req("street", "Complete address is required");
      }
      break;
    case "INDIVIDUAL":
      if (!str(pd, "occupation")) req("occupation", "Occupation is required");
      requireSelect(pd, ctx, "industry", "Industry", "industryOther");
      break;
    default:
      break;
  }
};

export const patchClientSchema = z
  .object({
    fullName: z.preprocess(
      (v) => (v == null ? "" : String(v)),
      z.string().trim().min(2).max(120),
    ),
    contactEmail: z.string().email(),
    phone: z.string().trim().min(5).max(40),
    profileType: profileTypeSchema,
    profileData: profileDataSchema,
    profilePhoto: profilePhotoSchema.optional(),
  })
  .superRefine(profileDataRefine);

export type ClientProfileData = Record<string, unknown>;

function rowStr(pd: ClientProfileData, key: string): string {
  const v = pd[key];
  return typeof v === "string" ? v.trim() : "";
}

function rowEffective(pd: ClientProfileData, key: string, otherKey?: string): string {
  const selected = rowStr(pd, key);
  if (selected === OTHER && otherKey) return rowStr(pd, otherKey);
  return selected;
}

function formatAddress(pd: ClientProfileData): string | null {
  const parts = [rowStr(pd, "street"), rowStr(pd, "city"), rowStr(pd, "state")].filter(Boolean);
  if (parts.length) return parts.join("\n");
  return null;
}

function formatGovernmentAddress(pd: ClientProfileData): string | null {
  const parts = [
    rowStr(pd, "officeAddress"),
    rowStr(pd, "city"),
    rowStr(pd, "state"),
  ].filter(Boolean);
  return parts.length ? parts.join("\n") : null;
}

export function mapClientRegistration(input: {
  email: string;
  fullName: string;
  phone: string;
  profileType: ClientProfileType;
  profileData: ClientProfileData;
  contactEmail?: string;
}): {
  companyName: string;
  regNumber: string;
  industry: string;
  contactName: string;
  contactEmail: string;
  phone: string;
  address: string | null;
  profileType: ClientProfileType;
  profileDataJson: string;
} {
  const pd = input.profileData;
  const contactEmail = (input.contactEmail ?? input.email).trim().toLowerCase();
  let companyName = "";
  let regNumber = "";
  let industry = "";

  switch (input.profileType) {
    case "COMPANY":
      companyName = rowStr(pd, "companyName");
      regNumber = rowStr(pd, "ssmNumber");
      industry = rowEffective(pd, "industry", "industryOther");
      break;
    case "ORGANIZATION":
      companyName = rowStr(pd, "organizationName");
      regNumber = rowStr(pd, "registrationNumber");
      industry = rowEffective(pd, "organizationType", "organizationTypeOther") || "Organization";
      break;
    case "CLUB":
      companyName = rowStr(pd, "clubName");
      regNumber = "";
      industry = rowStr(pd, "clubCategory") || "Club";
      break;
    case "GOVERNMENT":
      companyName = rowStr(pd, "agencyName");
      regNumber = "";
      industry =
        rowEffective(pd, "governmentLevel", "governmentLevelOther") || "Government";
      break;
    case "INSTITUTION":
      companyName = rowStr(pd, "institutionName");
      regNumber = "";
      industry =
        rowEffective(pd, "institutionType", "institutionTypeOther") || "Education";
      break;
    case "HR_DEPARTMENT":
      companyName = rowStr(pd, "employerName");
      regNumber = "";
      industry = rowEffective(pd, "industry", "industryOther");
      break;
    case "INDIVIDUAL":
      companyName = input.fullName.trim();
      regNumber = "";
      industry =
        rowEffective(pd, "industry", "industryOther") ||
        rowStr(pd, "occupation") ||
        "Individual";
      break;
    default:
      companyName = input.fullName.trim();
      break;
  }

  const address =
    input.profileType === "GOVERNMENT"
      ? formatGovernmentAddress(pd)
      : formatAddress(pd);

  return {
    companyName: companyName || input.fullName.trim(),
    regNumber,
    industry: industry || "—",
    contactName: input.fullName.trim(),
    contactEmail,
    phone: input.phone.trim(),
    address,
    profileType: input.profileType,
    profileDataJson: JSON.stringify(pd),
  };
}

export function isClientProfileComplete(
  profileType: ClientProfileType,
  row: {
    companyName: string;
    regNumber: string;
    industry: string;
    contactName: string;
    contactEmail: string;
    phone: string;
    address: string | null;
  },
): boolean {
  if (row.contactName.length < 2 || row.contactEmail.length < 3 || row.phone.length < 5) {
    return false;
  }
  if (row.companyName.length < 2 || row.industry.length < 2) return false;

  switch (profileType) {
    case "COMPANY":
      return row.regNumber.length >= 2 && Boolean(row.address?.trim());
    case "ORGANIZATION":
      return row.regNumber.length >= 2 && Boolean(row.address?.trim());
    case "GOVERNMENT":
    case "INSTITUTION":
    case "HR_DEPARTMENT":
      return Boolean(row.address?.trim());
    case "INDIVIDUAL":
      return true;
    default:
      return true;
  }
}

export function parseProfileDataJson(raw: unknown): ClientProfileData {
  if (!raw) return {};
  if (typeof raw === "object" && raw !== null && !Array.isArray(raw)) {
    return raw as ClientProfileData;
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as ClientProfileData;
      }
    } catch {
      return {};
    }
  }
  return {};
}
