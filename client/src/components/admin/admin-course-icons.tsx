import { cn } from "@/components/ui/button";

const stroke = {
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** Sidebar / page header — training programme (clipboard). */
export function AdminNavIconCourses({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
      <path d="M4 6h16v12H4z" />
      <path d="M8 6V4h8v2" />
      <path d="M8 11h8M8 15h5" />
    </svg>
  );
}

export function AdminPageHeaderIconCourses({ className }: { className?: string }) {
  return <AdminNavIconCourses className={cn("h-5 w-5 shrink-0 text-white", className)} />;
}

function normalizeCategoryKey(category: string, title = ""): string {
  const hay = `${category} ${title}`.toLowerCase();
  if (hay.includes("leadership") || hay.includes("management")) return "leadership";
  if (
    hay.includes("digital") ||
    hay.includes("technology") ||
    hay.includes("microsoft") ||
    hay.includes("office") ||
    hay.includes("365") ||
    hay.includes("ai") ||
    hay.includes("chatgpt") ||
    hay.includes("copilot")
  ) {
    return "digital";
  }
  if (hay.includes("soft skill") || hay.includes("communication") || hay.includes("teamwork")) {
    return "soft-skills";
  }
  if (hay.includes("technical") || hay.includes("engineering")) return "technical";
  if (hay.includes("sales") || hay.includes("marketing")) return "sales";
  if (hay.includes("finance") || hay.includes("accounting")) return "finance";
  if (hay.includes("health") || hay.includes("safety")) return "health";
  if (hay.includes("compliance") || hay.includes("regulatory")) return "compliance";
  if (hay.includes("industry")) return "industry";
  if (hay.includes("excel") || hay.includes("power bi") || hay.includes("outlook")) return "digital";
  if (hay.includes("team") && !hay.includes("management")) return "soft-skills";
  return "other";
}

/** Icon for a course category or course row (uses category, then title). */
export function AdminCourseIcon({
  category,
  title = "",
  className,
}: {
  category: string;
  title?: string;
  className?: string;
}) {
  return <AdminCategoryIcon category={category} title={title} className={className} />;
}

/** Icon for category headers and course cards. */
export function AdminCategoryIcon({
  category,
  title = "",
  className,
}: {
  category: string;
  title?: string;
  className?: string;
}) {
  const key = normalizeCategoryKey(category, title);
  const cls = cn("h-5 w-5", className);

  switch (key) {
    case "leadership":
      return <IconUsers className={cls} />;
    case "digital":
      return <IconChip className={cls} />;
    case "soft-skills":
      return <IconChat className={cls} />;
    case "technical":
      return <IconWrench className={cls} />;
    case "sales":
      return <IconChart className={cls} />;
    case "finance":
      return <IconCurrency className={cls} />;
    case "health":
      return <IconShield className={cls} />;
    case "compliance":
      return <IconScale className={cls} />;
    case "industry":
      return <IconBuilding className={cls} />;
    default:
      return <IconClipboard className={cls} />;
  }
}

/** Background tint for course card icon badges by category. */
export function adminCourseIconBadgeClass(category: string, title = ""): string {
  const key = normalizeCategoryKey(category, title);
  const map: Record<string, string> = {
    leadership: "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300",
    digital: "bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300",
    "soft-skills": "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
    technical: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    sales: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300",
    finance: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    health: "bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300",
    compliance: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300",
    industry: "bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300",
    other: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  };
  return map[key] ?? map.other;
}

export function AdminStatIconTotalCourses({ className }: { className?: string }) {
  return <IconLayers className={cn("h-6 w-6 text-white", className)} />;
}

export function AdminStatIconCategories({ className }: { className?: string }) {
  return <IconGrid className={cn("h-6 w-6 text-white", className)} />;
}

export function AdminStatIconClaimable({ className }: { className?: string }) {
  return <IconBadgeCheck className={cn("h-6 w-6 text-white", className)} />;
}

function IconClipboard({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 12h6M9 16h4" />
    </svg>
  );
}

function IconLayers({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  );
}

function IconGrid({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
      <path d="M4 6h7v7H4V6zm9 0h7v7h-7V6zM4 15h7v7H4v-7zm9 0h7v7h-7v-7z" />
    </svg>
  );
}

function IconBadgeCheck({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
      <path d="M9 12l2 2 4-4" />
      <path d="M12 22a10 10 0 100-20 10 10 0 000 20z" />
    </svg>
  );
}

function IconUsers({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
      <path d="M17 21v-1a4 4 0 00-4-4H5a4 4 0 00-4 4v1" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-1a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function IconChip({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M9 9h.01M15 9h.01M9 15h6" />
      <path d="M12 4v2M8 2h8" />
    </svg>
  );
}

function IconChat({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
      <path d="M21 15a2 2 0 01-2 2H8l-5 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      <path d="M8 10h8M8 14h5" />
    </svg>
  );
}

function IconWrench({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
      <path d="M14.7 6.3a4 4 0 00-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 005.4-5.4l-2.1 2.1-2.8-2.8 2.1-2.1z" />
    </svg>
  );
}

function IconChart({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
      <path d="M4 19h16M7 16V8m5 8V5m5 11v-3" />
    </svg>
  );
}

function IconCurrency({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
      <path d="M12 2v20M17 7H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H7" />
    </svg>
  );
}

function IconShield({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
      <path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function IconScale({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
      <path d="M12 3v18M5 7h14M7 7l-3 5h6l-3-5zm10 0l-3 5h6l-3-5z" />
    </svg>
  );
}

function IconBuilding({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
      <path d="M3 21h18M5 21V7l7-4 7 4v14" />
      <path d="M9 10h.01M9 14h.01M15 10h.01M15 14h.01" />
    </svg>
  );
}
