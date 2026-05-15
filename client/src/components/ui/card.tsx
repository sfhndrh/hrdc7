import { cn } from "./button";

/**
 * `Card` was originally a white framed panel that wrapped page content.
 * It now renders as a transparent layout container so the dashboard
 * background shows through. Inner sections that still need a card look
 * (forms, sub-panels, etc.) use plain `bg-white rounded-xl border` divs.
 */
export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn(className)}>{children}</div>;
}

/**
 * `CardHeader` is now a page-style header: bold title + muted description
 * on the left, optional action on the right. No border, no padding —
 * sits directly on the page background.
 */
export function CardHeader({
  title,
  description,
  right,
}: {
  title: string;
  description?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="text-xl font-bold leading-tight text-[color:var(--text)]">
          {title}
        </div>
        {description ? (
          <div className="mt-0.5 text-sm text-[color:var(--text-muted)]">
            {description}
          </div>
        ) : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

/**
 * `CardContent` no longer paints a panel. It just adds top spacing so the
 * page body sits below the header.
 */
export function CardContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("mt-6", className)}>{children}</div>;
}
