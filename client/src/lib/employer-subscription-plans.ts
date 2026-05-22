/** Employer subscription tiers (client portal + public landing). */

export const EMPLOYER_PLAN_COMPARE_SUBTITLE =
  "No commission on bookings. Just a flat monthly subscription.";

export const EMPLOYER_PLAN_COMPARE_HEADING =
  "Start free, upgrade when you\u2019re ready";

export type EmployerPlanTier = {
  name: string;
  price: string;
  period: string;
  features: readonly string[];
};

export const EMPLOYER_PLAN_FREE: EmployerPlanTier = {
  name: "Free",
  price: "RM 0",
  period: "forever",
  features: [
    "Browse all published courses on the platform",
    "Blurred course titles, categories, and provider details",
    "Search and category filters do not return results",
  ],
};

export const EMPLOYER_PLAN_PRO: EmployerPlanTier = {
  name: "Pro",
  price: "RM 99",
  period: "per month",
  features: [
    "Unlock full course and provider details",
    "Search and filter courses by title, category, or provider",
    "View fees, duration, delivery mode, and locations",
    "Read descriptions, learning outcomes, and materials notes",
    "Download brochures, slides, and sample materials",
  ],
};
