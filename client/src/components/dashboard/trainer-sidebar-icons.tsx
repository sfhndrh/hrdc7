/**
 * Single source of truth for trainer portal sidebar + page-title icons (same SVGs everywhere).
 */
export function TrainerNavIconHome({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  );
}

export function TrainerNavIconProfile({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-1a4 4 0 00-4-4H8a4 4 0 00-4 4v1" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 12a4 4 0 100-8 4 4 0 000 8z" />
    </svg>
  );
}

export function TrainerNavIconCertificate({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 3h10a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6M9 11h6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 21l3-2 3 2v-4H9v4z" />
    </svg>
  );
}

export function TrainerNavIconInbox({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h16v10l-3 3H7l-3-3V4z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 14h4l2 3h4l2-3h4" />
    </svg>
  );
}

export function TrainerNavIconCalendar({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 3v2M16 3v2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 5h12a2 2 0 012 2v13a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2z" />
    </svg>
  );
}

export function TrainerNavIconSparkles({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3l1.5 4.5L11 9l-4.5 1.5L5 15l-1.5-4.5L1 9l2.5-1.5L5 3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 4l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 13l1.5 4.5L20 19l-4.5 1.5L14 25l-1.5-4.5L8 19l4.5-1.5L14 13z" />
    </svg>
  );
}
