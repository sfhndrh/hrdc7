/** Dropdown choices for employer profile fields (registration + edit). */

export const OTHER_OPTION = "Other" as const;

export const COMPANY_SIZE_OPTIONS = [
  "1-50",
  "51-500",
  "501-5000",
  "5000+",
  OTHER_OPTION,
] as const;

export const INDUSTRY_OPTIONS = [
  "Information Technology",
  "Manufacturing",
  "Finance & Banking",
  "Healthcare",
  "Education",
  "Retail & E-commerce",
  "Construction",
  "Hospitality & Tourism",
  "Logistics & Transportation",
  "Professional Services",
  "Government & Public Sector",
  "Energy & Utilities",
  "Agriculture",
  "Real Estate",
  "Telecommunications",
  OTHER_OPTION,
] as const;

export const ORGANIZATION_TYPE_OPTIONS = [
  "NGO",
  "Foundation",
  "Charity",
  "Trade Association",
  "Professional Body",
  "Cooperative",
  "Religious Organization",
  "Community Group",
  "Social Enterprise",
  OTHER_OPTION,
] as const;

export const INSTITUTION_TYPE_OPTIONS = [
  "University",
  "College",
  "Polytechnic",
  "Secondary School",
  "Primary School",
  "Training Centre",
  "Research Institute",
  "International School",
  OTHER_OPTION,
] as const;

export const HR_DEPARTMENT_OPTIONS = [
  "Human Resources",
  "Learning & Development",
  "Training",
  "Talent Development",
  "People Operations",
  "Organizational Development",
  "Administration",
  "Operations",
  "Finance",
  "IT",
  OTHER_OPTION,
] as const;

export const GOVERNMENT_LEVEL_OPTIONS = [
  "Federal",
  "State",
  "Local",
  OTHER_OPTION,
] as const;
