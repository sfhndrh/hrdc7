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

export function TrainerNavIconSettings({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15.5a3.5 3.5 0 110-7 3.5 3.5 0 010 7z" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.4 15a1.8 1.8 0 00.36 1.98l.05.05a2 2 0 01-1.42 3.41 2 2 0 01-1.41-.59l-.05-.05a1.8 1.8 0 00-1.98-.36 1.8 1.8 0 00-1.09 1.64V22a2 2 0 01-4 0v-.07a1.8 1.8 0 00-1.09-1.64 1.8 1.8 0 00-1.98.36l-.05.05a2 2 0 01-2.83 0 2 2 0 010-2.82l.05-.05A1.8 1.8 0 005 15a1.8 1.8 0 00-1.64-1.09H3.3a2 2 0 010-4h.06A1.8 1.8 0 005 8.82a1.8 1.8 0 00-.36-1.98l-.05-.05A2 2 0 016.01 3.3l.05.05A1.8 1.8 0 008.04 3a1.8 1.8 0 001.09-1.64V1.3a2 2 0 014 0v.06A1.8 1.8 0 0014.22 3a1.8 1.8 0 001.98-.36l.05-.05A2 2 0 0119.08 3.3a2 2 0 010 2.83l-.05.05A1.8 1.8 0 0019 8.82c.24.55.35 1.15.35 1.76 0 .61-.11 1.21-.35 1.76a1.8 1.8 0 001.4 2.66z"
      />
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
