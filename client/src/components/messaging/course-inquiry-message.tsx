import {
  isCourseInquiryMessage,
  parseCourseInquiryMessage,
} from "@/lib/course-message-attachment";

export function ChatMessageBody({
  body,
  isMine,
}: {
  body: string;
  isMine: boolean;
}) {
  if (!isCourseInquiryMessage(body)) {
    return <p className="whitespace-pre-wrap">{body}</p>;
  }

  const parsed = parseCourseInquiryMessage(body);
  if (!parsed) {
    return <p className="whitespace-pre-wrap">{body}</p>;
  }

  const cardClass = isMine
    ? "rounded-lg border border-white/25 bg-white/10 p-3 text-left"
    : "rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3 text-left";

  return (
    <div className="space-y-2">
      <div className={cardClass}>
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide opacity-90">
          <PaperclipIcon className="h-3.5 w-3.5 shrink-0" />
          Course details
        </div>
        <div className="mt-2 text-sm font-semibold leading-snug">{parsed.title}</div>
        <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] leading-snug opacity-95">
          <Dt label="Provider" value={parsed.provider} />
          <Dt label="Code" value={parsed.code} />
          <Dt label="Category" value={parsed.category} />
          <Dt label="Duration" value={parsed.duration} />
          <Dt label="Fee" value={parsed.fee} />
          <Dt label="Delivery" value={parsed.delivery} />
          <Dt label="HRDC" value={parsed.hrdc} />
          <Dt label="Language" value={parsed.language} />
          {parsed.location !== "—" ? (
            <Dt label="Location" value={parsed.location} className="col-span-2" />
          ) : null}
        </dl>
      </div>
      {parsed.intro ? (
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{parsed.intro}</p>
      ) : null}
    </div>
  );
}

function Dt({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="opacity-70">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function PaperclipIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"
      />
    </svg>
  );
}
