import { cn } from "@/components/ui/button";

const iconClass = "h-5 w-5 shrink-0 text-white";

/** White line icons for use inside `DashboardPageHeader` (gradient box). */
export function PageHeaderIconDashboard({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn(iconClass, className)} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 13h6V4H4v9zm10 7h6V11h-6v9zM4 20h6v-5H4v5zm10-9h6V4h-6v7z" />
    </svg>
  );
}

export function PageHeaderIconUsers({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn(iconClass, className)} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-1a4 4 0 00-4-4H5a4 4 0 00-4 4v1" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12a4 4 0 100-8 4 4 0 000 8z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-1a4 4 0 00-3-3.87" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

export function PageHeaderIconBuilding({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn(iconClass, className)} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 21V7a2 2 0 012-2h10a2 2 0 012 2v14" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01" />
    </svg>
  );
}

export function PageHeaderIconReceipt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn(iconClass, className)} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 14h6m-6-4h6M7 21l1-1 2 1 2-1 2 1 2-1 2 1 1-1V3l-1 1-2-1-2 1-2-1-2 1-2-1-1 1v18z" />
    </svg>
  );
}

export function PageHeaderIconCard({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn(iconClass, className)} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  );
}

export function PageHeaderIconSettings({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn(iconClass, className)} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15.5a3.5 3.5 0 110-7 3.5 3.5 0 010 7z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.8 1.8 0 00.36 1.98l.05.05a2 2 0 01-1.42 3.41 2 2 0 01-1.41-.59l-.05-.05a1.8 1.8 0 00-1.98-.36 1.8 1.8 0 00-1.09 1.64V22a2 2 0 01-4 0v-.07a1.8 1.8 0 00-1.09-1.64 1.8 1.8 0 00-1.98.36l-.05.05a2 2 0 01-2.83 0 2 2 0 010-2.82l.05-.05A1.8 1.8 0 005 15a1.8 1.8 0 00-1.64-1.09H3.3a2 2 0 010-4h.06A1.8 1.8 0 005 8.82a1.8 1.8 0 00-.36-1.98l-.05-.05A2 2 0 016.01 3.3l.05.05A1.8 1.8 0 008.04 3a1.8 1.8 0 001.09-1.64V1.3a2 2 0 014 0v.06A1.8 1.8 0 0014.22 3a1.8 1.8 0 001.98-.36l.05-.05A2 2 0 0119.08 3.3a2 2 0 010 2.83l-.05.05A1.8 1.8 0 0019 8.82c.24.55.35 1.15.35 1.76 0 .61-.11 1.21-.35 1.76a1.8 1.8 0 001.4 2.66z" />
    </svg>
  );
}

export function PageHeaderIconSearch({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn(iconClass, className)} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path strokeLinecap="round" d="M20 20l-3.3-3.3" />
    </svg>
  );
}

export function PageHeaderIconUser({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn(iconClass, className)} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-1a4 4 0 00-4-4H8a4 4 0 00-4 4v1" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function PageHeaderIconCertificate({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn(iconClass, className)} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 3h10a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6M9 11h6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 21l3-2 3 2v-4H9v4z" />
    </svg>
  );
}

export function PageHeaderIconHome({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn(iconClass, className)} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

export function PageHeaderIconList({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn(iconClass, className)} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  );
}

export function PageHeaderIconCourses({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn(iconClass, className)} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      />
    </svg>
  );
}

/** Training provider portal — matches `TpNavIconCourses`. */
export function PageHeaderIconTpCourses({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn(iconClass, className)} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16v12H4z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 6V4h8v2" />
    </svg>
  );
}

/** Training provider portal — matches `TpNavIconProfile`. */
export function PageHeaderIconTpProfile({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn(iconClass, className)} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 20a8 8 0 0 1 16 0" />
    </svg>
  );
}

export function PageHeaderIconCalendar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn(iconClass, className)} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 3v2M16 3v2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 5h12a2 2 0 012 2v13a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2z" />
    </svg>
  );
}

export function PageHeaderIconRatings({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn(iconClass, className)} fill="currentColor" aria-hidden>
      <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

export function PageHeaderIconApprove({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn(iconClass, className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2 4-4"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 22a10 10 0 100-20 10 10 0 000 20z"
      />
    </svg>
  );
}
