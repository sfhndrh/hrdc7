import { cn } from "./button";

type Tone = "gray" | "green" | "yellow" | "red" | "blue";

const tones: Record<Tone, string> = {
  gray:
    "border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text-muted)]",
  green: "border-emerald-200 bg-emerald-50 text-emerald-900",
  yellow: "border-orange-200 bg-orange-50 text-orange-900",
  red: "border-red-200 bg-red-50 text-red-900",
  blue:
    "border-[color:var(--accent)] bg-[color:var(--surface-muted)] text-[color:var(--text)]",
};

export function Badge({
  children,
  tone = "gray",
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

