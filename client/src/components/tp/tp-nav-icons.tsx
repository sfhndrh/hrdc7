import { cn } from "@/components/ui/button";

const navIconClass = "h-5 w-5 shrink-0";

/** Sidebar nav icons for the training provider portal (match page header icons). */
export function TpNavIconCourses({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn(navIconClass, className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16v12H4z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 6V4h8v2" />
    </svg>
  );
}

export function TpNavIconProfile({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn(navIconClass, className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 20a8 8 0 0 1 16 0" />
    </svg>
  );
}

export function TpNavIconCalendar({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn(navIconClass, className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 3v2M16 3v2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 5h12a2 2 0 012 2v13a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2z"
      />
    </svg>
  );
}

export function TpNavIconTrainers({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn(navIconClass, className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function TpNavIconMessages({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn(navIconClass, className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export function TpNavIconRatings({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn(navIconClass, className)}
      fill="currentColor"
      aria-hidden
    >
      <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}
