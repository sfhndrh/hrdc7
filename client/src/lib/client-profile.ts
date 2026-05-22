/** Employer / client profile types and field metadata for signup and profile UI. */

import {
  COMPANY_SIZE_OPTIONS,
  GOVERNMENT_LEVEL_OPTIONS,
  HR_DEPARTMENT_OPTIONS,
  INDUSTRY_OPTIONS,
  INSTITUTION_TYPE_OPTIONS,
  ORGANIZATION_TYPE_OPTIONS,
  OTHER_OPTION,
} from "@/lib/client-profile-options";

export { OTHER_OPTION } from "@/lib/client-profile-options";
export {
  COMPANY_SIZE_OPTIONS,
  GOVERNMENT_LEVEL_OPTIONS,
  HR_DEPARTMENT_OPTIONS,
  INDUSTRY_OPTIONS,
  INSTITUTION_TYPE_OPTIONS,
  ORGANIZATION_TYPE_OPTIONS,
} from "@/lib/client-profile-options";

export type ClientProfileType =
  | "COMPANY"
  | "ORGANIZATION"
  | "CLUB"
  | "GOVERNMENT"
  | "INSTITUTION"
  | "INDIVIDUAL"
  | "HR_DEPARTMENT";

export type DescribesYouKey =
  | "company"
  | "organization"
  | "club"
  | "institution"
  | "government"
  | "hr_department"
  | "individual";

export type ClientProfileData = {
  describesYou?: DescribesYouKey;
  website?: string;
  street?: string;
  city?: string;
  state?: string;
  companyName?: string;
  ssmNumber?: string;
  companySize?: string;
  hrdcRegistered?: "Yes" | "No" | "";
  organizationName?: string;
  registrationNumber?: string;
  organizationType?: string;
  clubName?: string;
  universityCommunity?: string;
  clubCategory?: string;
  socialMediaLink?: string;
  agencyName?: string;
  department?: string;
  governmentLevel?: string;
  officeAddress?: string;
  institutionName?: string;
  institutionType?: string;
  institutionTypeOther?: string;
  industryOther?: string;
  organizationTypeOther?: string;
  departmentOther?: string;
  companySizeOther?: string;
  governmentLevelOther?: string;
  /** @deprecated legacy; use street/city/state */
  campusLocation?: string;
  employerName?: string;
  occupation?: string;
  interests?: string;
  preferredTrainingCategories?: string[];
};

export const DESCRIBES_YOU_OPTIONS: {
  key: DescribesYouKey;
  label: string;
  profileType: ClientProfileType;
}[] = [
  { key: "company", label: "Company", profileType: "COMPANY" },
  { key: "organization", label: "Organization / NGO", profileType: "ORGANIZATION" },
  { key: "club", label: "Club / Association", profileType: "CLUB" },
  { key: "institution", label: "Educational Institution", profileType: "INSTITUTION" },
  { key: "government", label: "Government Agency", profileType: "GOVERNMENT" },
  { key: "hr_department", label: "HR / Department Representative", profileType: "HR_DEPARTMENT" },
];

export const PROFILE_TYPE_OPTIONS: { value: ClientProfileType; label: string }[] = [
  { value: "COMPANY", label: "Company" },
  { value: "ORGANIZATION", label: "Organization" },
  { value: "CLUB", label: "Club" },
  { value: "GOVERNMENT", label: "Government" },
  { value: "INSTITUTION", label: "Institution" },
  { value: "HR_DEPARTMENT", label: "HR / Department" },
];

export const CLIENT_REGISTER_STEPS = ["About you", "Account", "Profile details"] as const;

export function profileTypeLabel(type: ClientProfileType | string | null | undefined): string {
  return PROFILE_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? "Employer";
}

export function parseProfileData(raw: unknown): ClientProfileData {
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

export function formatAddressParts(data: ClientProfileData, fallbackAddress?: string | null): string {
  const parts = [data.street, data.city, data.state].map((p) => p?.trim()).filter(Boolean);
  if (parts.length) return parts.join("\n");
  return fallbackAddress?.trim() ?? "";
}

function normalizeSelectForEdit(
  pd: ClientProfileData,
  key: keyof ClientProfileData,
  otherKey: keyof ClientProfileData,
  options: readonly string[],
): ClientProfileData {
  const v = (pd[key] as string | undefined)?.trim() ?? "";
  if (!v) return pd;
  if ((options as readonly string[]).includes(v)) return pd;
  if (v === OTHER_OPTION) return pd;
  const other = (pd[otherKey] as string | undefined)?.trim();
  if (other) return { ...pd, [key]: OTHER_OPTION, [otherKey]: other };
  return { ...pd, [key]: OTHER_OPTION, [otherKey]: v };
}

function hydrateSelectFieldsFromDefinitions(
  profileType: ClientProfileType,
  pd: ClientProfileData,
): ClientProfileData {
  let next = { ...pd };
  for (const field of profileDetailFields(profileType)) {
    if (field.type === "select" && field.options && field.otherKey) {
      next = normalizeSelectForEdit(
        next,
        field.key as keyof ClientProfileData,
        field.otherKey,
        field.options,
      );
    }
  }
  return next;
}

/** Merge DB row + JSON profileData for edit/registration-aligned forms. */
export function hydrateProfileDataForEdit(
  profileType: ClientProfileType | string,
  row: {
    companyName: string;
    regNumber: string;
    industry: string;
    address: string | null;
  },
  existing: ClientProfileData,
): ClientProfileData {
  const t = profileType as ClientProfileType;
  let pd: ClientProfileData = { ...existing };

  if (t === "INSTITUTION" && pd.campusLocation && !pd.street) {
    pd = { ...pd, street: pd.campusLocation };
  }

  const addr = splitAddressLines(row.address);

  switch (t) {
    case "COMPANY":
      pd = {
        ...pd,
        companyName: pd.companyName?.trim() || row.companyName,
        ssmNumber: pd.ssmNumber?.trim() || row.regNumber,
        industry: pd.industry?.trim() || row.industry,
        street: pd.street?.trim() || addr.street,
        city: pd.city?.trim() || addr.city,
        state: pd.state?.trim() || addr.state,
      };
      break;
    case "ORGANIZATION":
      pd = {
        ...pd,
        organizationName: pd.organizationName?.trim() || row.companyName,
        registrationNumber: pd.registrationNumber?.trim() || row.regNumber,
        organizationType: pd.organizationType?.trim() || row.industry,
        street: pd.street?.trim() || addr.street,
        city: pd.city?.trim() || addr.city,
        state: pd.state?.trim() || addr.state,
      };
      break;
    case "CLUB":
      pd = {
        ...pd,
        clubName: pd.clubName?.trim() || row.companyName,
        clubCategory: pd.clubCategory?.trim() || row.industry,
        street: pd.street?.trim() || addr.street,
        city: pd.city?.trim() || addr.city,
        state: pd.state?.trim() || addr.state,
      };
      break;
    case "GOVERNMENT": {
      const govAddr = splitAddressLines(row.address);
      const singleLine =
        row.address && !row.address.includes("\n") ? row.address.trim() : "";
      pd = {
        ...pd,
        agencyName: pd.agencyName?.trim() || row.companyName,
        governmentLevel: pd.governmentLevel?.trim() || row.industry,
        officeAddress: pd.officeAddress?.trim() || govAddr.street || singleLine,
        city: pd.city?.trim() || govAddr.city,
        state: pd.state?.trim() || govAddr.state,
      };
      break;
    }
    case "INSTITUTION":
      pd = {
        ...pd,
        institutionName: pd.institutionName?.trim() || row.companyName,
        institutionType: pd.institutionType?.trim() || row.industry,
        street: pd.street?.trim() || addr.street,
        city: pd.city?.trim() || addr.city,
        state: pd.state?.trim() || addr.state,
      };
      break;
    case "HR_DEPARTMENT":
      pd = {
        ...pd,
        employerName: pd.employerName?.trim() || row.companyName,
        industry: pd.industry?.trim() || row.industry,
        street: pd.street?.trim() || addr.street,
        city: pd.city?.trim() || addr.city,
        state: pd.state?.trim() || addr.state,
      };
      break;
    case "INDIVIDUAL":
      pd = {
        ...pd,
        industry: pd.industry?.trim() || row.industry,
        occupation: pd.occupation?.trim() || row.industry,
      };
      break;
    default:
      pd = {
        ...pd,
        street: pd.street?.trim() || addr.street,
        city: pd.city?.trim() || addr.city,
        state: pd.state?.trim() || addr.state,
      };
  }

  return hydrateSelectFieldsFromDefinitions(t, pd);
}

/** @deprecated Use hydrateProfileDataForEdit */
export function legacyProfileDataFromRow(
  profileType: ClientProfileType | string,
  row: {
    companyName: string;
    regNumber: string;
    industry: string;
    address: string | null;
  },
  existing: ClientProfileData,
): ClientProfileData {
  return hydrateProfileDataForEdit(profileType, row, existing);
}

export function describesYouDisplayLabel(
  profileData: ClientProfileData,
  profileType: ClientProfileType,
): string {
  const key = profileData.describesYou;
  if (key) {
    const opt = DESCRIBES_YOU_OPTIONS.find((o) => o.key === key);
    if (opt) return opt.label;
  }
  return profileTypeLabel(profileType);
}

export function profileDetailsSectionTitle(profileType: ClientProfileType): string {
  switch (profileType) {
    case "COMPANY":
      return "Company details";
    case "ORGANIZATION":
      return "Organization details";
    case "CLUB":
      return "Club details";
    case "GOVERNMENT":
      return "Government details";
    case "INSTITUTION":
      return "Institution details";
    case "HR_DEPARTMENT":
      return "Department details";
    case "INDIVIDUAL":
      return "Individual details";
    default:
      return "Profile details";
  }
}

export function splitAddressLines(address: string | null | undefined): {
  street: string;
  city: string;
  state: string;
} {
  const lines = (address ?? "").split("\n").map((l) => l.trim());
  return {
    street: lines[0] ?? "",
    city: lines[1] ?? "",
    state: lines[2] ?? "",
  };
}

/** Primary display name for banner and lists */
export function clientDisplayName(
  profileType: ClientProfileType | string,
  companyName: string,
  contactName: string,
  profileData: ClientProfileData,
): string {
  const pd = profileData;
  switch (profileType as ClientProfileType) {
    case "ORGANIZATION":
      return pd.organizationName?.trim() || companyName.trim() || contactName.trim() || "Your profile";
    case "CLUB":
      return pd.clubName?.trim() || companyName.trim() || "Your profile";
    case "GOVERNMENT":
      return pd.agencyName?.trim() || companyName.trim() || "Your profile";
    case "INSTITUTION":
      return pd.institutionName?.trim() || companyName.trim() || "Your profile";
    case "HR_DEPARTMENT":
      return pd.employerName?.trim() || companyName.trim() || "Your profile";
    case "INDIVIDUAL":
      return contactName.trim() || companyName.trim() || "Your profile";
    default:
      return companyName.trim() || contactName.trim() || "Your profile";
  }
}

export type ProfileFieldDef = {
  key: keyof ClientProfileData | "industry";
  label: string;
  wide?: boolean;
  type?: "text" | "url" | "textarea" | "select-yes-no" | "tags" | "select" | "state";
  placeholder?: string;
  required?: boolean;
  options?: readonly string[];
  otherKey?: keyof ClientProfileData;
};

/** Resolved value for a select (uses *Other when choice is Other). */
export function selectFieldValue(
  data: ClientProfileData,
  key: keyof ClientProfileData,
  otherKey?: keyof ClientProfileData,
): string {
  const selected = (data[key] as string | undefined)?.trim() ?? "";
  if (selected === OTHER_OPTION && otherKey) {
    return (data[otherKey] as string | undefined)?.trim() ?? "";
  }
  return selected;
}

export function validateProfileDetailField(
  data: ClientProfileData,
  field: ProfileFieldDef,
): string | null {
  if (!field.required) return null;

  if (field.type === "select") {
    const selected = (data[field.key as keyof ClientProfileData] as string | undefined)?.trim() ?? "";
    if (!selected) return `${field.label} is required.`;
    if (selected === OTHER_OPTION && field.otherKey) {
      const other = (data[field.otherKey] as string | undefined)?.trim() ?? "";
      if (!other) return `Please specify ${field.label.toLowerCase()}.`;
    }
    return null;
  }

  if (field.key === "preferredTrainingCategories") {
    if (!(data.preferredTrainingCategories?.length ?? 0)) {
      return `${field.label} is required.`;
    }
    return null;
  }

  if (field.type === "select-yes-no") {
    const v = data.hrdcRegistered;
    if (v !== "Yes" && v !== "No") return `${field.label} is required.`;
    return null;
  }

  const v =
    field.key === "industry"
      ? selectFieldValue(data, "industry", "industryOther")
      : ((data[field.key as keyof ClientProfileData] as string | undefined)?.trim() ?? "");
  if (!v) return `${field.label} is required.`;
  return null;
}

export function validateProfileDetailFields(
  profileType: ClientProfileType,
  data: ClientProfileData,
): string | null {
  for (const field of profileDetailFields(profileType)) {
    const err = validateProfileDetailField(data, field);
    if (err) return err;
  }
  return null;
}

export function profileDetailFields(profileType: ClientProfileType): ProfileFieldDef[] {
  const addr: ProfileFieldDef[] = [
    { key: "street", label: "Street address", wide: true, required: true, placeholder: "Unit, building, street" },
    { key: "city", label: "City", required: true, placeholder: "e.g. Kuala Lumpur" },
    { key: "state", label: "State", type: "text", required: true, placeholder: "Select or enter state" },
  ];

  const stateField: ProfileFieldDef = {
    key: "state",
    label: "State",
    type: "state",
    required: true,
  };

  switch (profileType) {
    case "COMPANY":
      return [
        { key: "companyName", label: "Company name", required: true },
        { key: "ssmNumber", label: "SSM number", required: true },
        {
          key: "industry",
          label: "Industry",
          type: "select",
          options: INDUSTRY_OPTIONS,
          otherKey: "industryOther",
          required: true,
        },
        {
          key: "companySize",
          label: "Company size",
          type: "select",
          options: COMPANY_SIZE_OPTIONS,
          otherKey: "companySizeOther",
        },
        { key: "website", label: "Website", type: "url", placeholder: "https://…" },
        ...addr.map((f) => (f.key === "state" ? stateField : f)),
        { key: "hrdcRegistered", label: "HRDC registered?", type: "select-yes-no", required: true },
      ];
    case "ORGANIZATION":
      return [
        { key: "organizationName", label: "Organization name", required: true },
        { key: "registrationNumber", label: "Registration number", required: true },
        {
          key: "organizationType",
          label: "Organization type",
          type: "select",
          options: ORGANIZATION_TYPE_OPTIONS,
          otherKey: "organizationTypeOther",
          required: true,
        },
        { key: "website", label: "Website", type: "url" },
        ...addr.map((f) => (f.key === "state" ? stateField : f)),
      ];
    case "CLUB":
      return [
        { key: "clubName", label: "Club name", required: true },
        { key: "universityCommunity", label: "University / community", required: true },
        { key: "clubCategory", label: "Club category", required: true },
        { key: "socialMediaLink", label: "Social media link", type: "url" },
        { key: "street", label: "Address", wide: true },
        { key: "city", label: "City" },
        stateField,
      ];
    case "GOVERNMENT":
      return [
        { key: "agencyName", label: "Agency name", required: true },
        {
          key: "governmentLevel",
          label: "Government level",
          type: "select",
          options: GOVERNMENT_LEVEL_OPTIONS,
          otherKey: "governmentLevelOther",
          required: true,
        },
        {
          key: "officeAddress",
          label: "Office address",
          wide: true,
          required: true,
          placeholder: "Unit, building, street",
        },
        { key: "city", label: "City", required: true, placeholder: "e.g. Putrajaya" },
        stateField,
      ];
    case "INSTITUTION":
      return [
        { key: "institutionName", label: "Institution name", required: true },
        {
          key: "institutionType",
          label: "Institution type",
          type: "select",
          options: INSTITUTION_TYPE_OPTIONS,
          otherKey: "institutionTypeOther",
          required: true,
        },
        { key: "street", label: "Address", wide: true, required: true, placeholder: "Campus, building, street" },
        { key: "city", label: "City", required: true, placeholder: "e.g. Shah Alam" },
        stateField,
        { key: "website", label: "Website", type: "url" },
      ];
    case "HR_DEPARTMENT":
      return [
        { key: "employerName", label: "Employer / company name", required: true },
        {
          key: "department",
          label: "Department",
          type: "select",
          options: HR_DEPARTMENT_OPTIONS,
          otherKey: "departmentOther",
          required: true,
        },
        {
          key: "industry",
          label: "Industry",
          type: "select",
          options: INDUSTRY_OPTIONS,
          otherKey: "industryOther",
          required: true,
        },
        ...addr.map((f) => (f.key === "state" ? stateField : f)),
      ];
    case "INDIVIDUAL":
      return [
        { key: "occupation", label: "Occupation", required: true },
        { key: "industry", label: "Industry", required: true },
        { key: "interests", label: "Interests", wide: true, type: "textarea" },
        {
          key: "preferredTrainingCategories",
          label: "Preferred training categories",
          wide: true,
          type: "tags",
        },
      ];
    default:
      return addr;
  }
}

/** Read-only fields for profile view */
export type ProfileDisplayRow = { label: string; value: string; wide?: boolean; multiline?: boolean };

export function profileDisplayRows(
  profileType: ClientProfileType | string,
  row: {
    companyName: string;
    regNumber: string;
    industry: string;
    contactName: string;
    contactEmail: string | null;
    phone: string;
    address: string | null;
    userEmail: string;
  },
  profileData: ClientProfileData,
): { title: string; rows: ProfileDisplayRow[] }[] {
  const pd = profileData;
  const email = row.contactEmail?.trim() || row.userEmail || "—";
  const account: ProfileDisplayRow[] = [
    { label: "Profile type", value: profileTypeLabel(profileType) },
    { label: "Full name", value: row.contactName?.trim() || "—" },
    { label: "Email", value: email },
    { label: "Phone number", value: row.phone?.trim() || "—" },
  ];

  const sections: { title: string; rows: ProfileDisplayRow[] }[] = [
    { title: "Account", rows: account },
  ];

  const detailRows: ProfileDisplayRow[] = [];
  const push = (label: string, value: string | undefined, opts?: { wide?: boolean; multiline?: boolean }) => {
    const v = value?.trim();
    if (v) detailRows.push({ label, value: v, ...opts });
  };

  switch (profileType as ClientProfileType) {
    case "COMPANY":
      push("Company name", row.companyName || pd.companyName);
      push("SSM number", row.regNumber || pd.ssmNumber);
      push("Industry", row.industry || selectFieldValue(pd, "industry", "industryOther"));
      push(
        "Company size",
        selectFieldValue(pd, "companySize", "companySizeOther") || pd.companySize,
      );
      push("Website", pd.website);
      push("Address", formatAddressParts(pd, row.address), { wide: true, multiline: true });
      push("HRDC registered?", pd.hrdcRegistered);
      sections.push({ title: "Company details", rows: detailRows });
      break;
    case "ORGANIZATION":
      push("Organization name", pd.organizationName || row.companyName);
      push("Registration number", pd.registrationNumber || row.regNumber);
      push(
        "Organization type",
        selectFieldValue(pd, "organizationType", "organizationTypeOther") || pd.organizationType,
      );
      push("Website", pd.website);
      push("Address", formatAddressParts(pd, row.address), { wide: true, multiline: true });
      sections.push({ title: "Organization details", rows: detailRows });
      break;
    case "CLUB":
      push("Club name", pd.clubName || row.companyName);
      push("University / community", pd.universityCommunity);
      push("Club category", pd.clubCategory);
      push("Social media", pd.socialMediaLink);
      push("Address", formatAddressParts(pd, row.address), { wide: true, multiline: true });
      sections.push({ title: "Club details", rows: detailRows });
      break;
    case "GOVERNMENT": {
      const govAddr = [pd.officeAddress, pd.city, pd.state].map((p) => p?.trim()).filter(Boolean);
      push("Agency name", pd.agencyName || row.companyName);
      push(
        "Government level",
        selectFieldValue(pd, "governmentLevel", "governmentLevelOther") || pd.governmentLevel,
      );
      push("Office address", govAddr.length ? govAddr.join("\n") : row.address ?? undefined, {
        wide: true,
        multiline: true,
      });
      sections.push({ title: "Government details", rows: detailRows });
      break;
    }
    case "INSTITUTION":
      push("Institution name", pd.institutionName || row.companyName);
      push(
        "Institution type",
        selectFieldValue(pd, "institutionType", "institutionTypeOther") || pd.institutionType,
      );
      push(
        "Address",
        formatAddressParts(pd, row.address) || pd.campusLocation,
        { wide: true, multiline: true },
      );
      push("Website", pd.website);
      sections.push({ title: "Institution details", rows: detailRows });
      break;
    case "HR_DEPARTMENT":
      push("Employer / company", pd.employerName || row.companyName);
      push(
        "Department",
        selectFieldValue(pd, "department", "departmentOther") || pd.department,
      );
      push("Industry", row.industry || selectFieldValue(pd, "industry", "industryOther"));
      push("Address", formatAddressParts(pd, row.address), { wide: true, multiline: true });
      sections.push({ title: "Department details", rows: detailRows });
      break;
    case "INDIVIDUAL":
      push("Occupation", pd.occupation);
      push("Industry", row.industry || pd.industry);
      push("Interests", pd.interests, { wide: true, multiline: true });
      push(
        "Preferred training categories",
        (pd.preferredTrainingCategories ?? []).join(", "),
        { wide: true },
      );
      sections.push({ title: "Individual details", rows: detailRows });
      break;
    default:
      push("Name", row.companyName);
      push("Industry", row.industry);
      push("Address", row.address ?? undefined, { wide: true, multiline: true });
      if (detailRows.length) sections.push({ title: "Details", rows: detailRows });
  }

  return sections;
}
