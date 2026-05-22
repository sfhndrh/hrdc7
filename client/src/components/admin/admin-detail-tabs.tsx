"use client";

import { cn } from "@/components/ui/button";

export type AdminDetailTabId = "company" | "courses";

export function AdminDetailTabs({
  active,
  onChange,
  courseCount,
}: {
  active: AdminDetailTabId;
  onChange: (tab: AdminDetailTabId) => void;
  courseCount?: number;
}) {
  return (
    <div
      className="inline-flex rounded-xl border border-[color:var(--border)] bg-[color:var(--page-bg)] p-1"
      role="tablist"
      aria-label="Training provider details"
    >
      <TabButton active={active === "company"} onClick={() => onChange("company")}>
        Company details
      </TabButton>
      <TabButton active={active === "courses"} onClick={() => onChange("courses")}>
        Courses
        {courseCount != null ? (
          <span className="ml-1.5 tabular-nums text-[color:var(--text-muted)]">({courseCount})</span>
        ) : null}
      </TabButton>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
        active
          ? "bg-[color:var(--surface)] text-[color:var(--text)] shadow-sm ring-1 ring-[color:var(--border)]"
          : "text-[color:var(--text-muted)] hover:bg-[color:var(--hover-subtle)] hover:text-[color:var(--text)]",
      )}
    >
      {children}
    </button>
  );
}
