import type { ReactNode } from "react";

import { cn } from "@/components/ui/button";

/** Matches login form input styling */
export const registerInputClass =
  "h-10 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)]/60 px-3 text-sm text-[color:var(--text)] shadow-inner outline-none transition-[box-shadow,border-color] placeholder:text-[color:var(--text-muted)] focus:border-sky-300 focus:ring-2 focus:ring-sky-200/60";
export const registerTextareaClass =
  "min-h-[5rem] w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)]/60 px-3 py-2.5 text-sm text-[color:var(--text)] shadow-inner outline-none transition-[box-shadow,border-color] placeholder:text-[color:var(--text-muted)] focus:border-sky-300 focus:ring-2 focus:ring-sky-200/60";

export function RegisterSection({
  title,
  children,
  titleClassName,
  contentClassName,
  hideTitle,
}: {
  title: string;
  children: ReactNode;
  /** e.g. text-left for section heading alignment */
  titleClassName?: string;
  contentClassName?: string;
  /** Hide heading when the step label is shown in a stepper */
  hideTitle?: boolean;
}) {
  return (
    <section className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)]/35 p-5">
      {hideTitle ? null : (
        <h2
          className={cn(
            "text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]",
            titleClassName,
          )}
        >
          {title}
        </h2>
      )}
      <div className={cn(!hideTitle && "mt-4", contentClassName)}>{children}</div>
    </section>
  );
}

export function RegisterFieldGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2">{children}</div>;
}

function RegisterFieldLabel({
  label,
  htmlFor,
  required,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
}) {
  const content = (
    <>
      {label}
      {required ? <span className="ml-0.5 font-normal text-red-600">*</span> : null}
    </>
  );
  if (htmlFor) {
    return (
      <label htmlFor={htmlFor} className="text-sm font-semibold text-[color:var(--text)]">
        {content}
      </label>
    );
  }
  return <div className="text-sm font-semibold text-[color:var(--text)]">{content}</div>;
}

export function RegisterField({
  label,
  htmlFor,
  children,
  wide,
  required,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
  wide?: boolean;
  required?: boolean;
}) {
  return (
    <div className={`space-y-1.5 ${wide ? "md:col-span-2" : ""}`}>
      <RegisterFieldLabel label={label} htmlFor={htmlFor} required={required} />
      <div>{children}</div>
    </div>
  );
}
