"use client";

import { useNavigate } from "react-router-dom";

import {
  AdminCourseCardsGrid,
  AdminHrdcCourseCard,
} from "@/components/admin/admin-course-cards";
import { catalogCourseFromHrdc } from "@/lib/admin-course-detail";
import type { TrainingProvider } from "@/lib/training-providers";

function formatAddress(provider: TrainingProvider): string {
  const line = [provider.address, provider.state].map((s) => s.trim()).filter(Boolean).join(", ");
  return line || "—";
}

export function AdminHrdcProviderCompanyTab({ provider }: { provider: TrainingProvider }) {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
          Contact
        </h2>
        <dl className="grid gap-4 sm:grid-cols-2">
          <DetailRow
            label="Email"
            value={provider.email}
            href={provider.email ? `mailto:${provider.email}` : undefined}
          />
          <DetailRow label="Phone" value={provider.phone} />
        </dl>

        <div className="mt-6 border-t border-[color:var(--border)] pt-6">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
            Address
          </h3>
          <p className="text-sm leading-relaxed text-[color:var(--text)]">{formatAddress(provider)}</p>
        </div>
      </section>
    </div>
  );
}

export function AdminHrdcProviderCoursesTab({ provider }: { provider: TrainingProvider }) {
  if (provider.courses.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-[color:var(--border)] px-6 py-10 text-center text-sm text-[color:var(--text-muted)]">
        No courses listed.
      </p>
    );
  }

  return (
    <AdminCourseCardsGrid>
      {provider.courses.map((c, i) => (
        <AdminHrdcCourseCard
          key={`${c.code}-${c.title}-${i}`}
          course={c}
          onSelect={() =>
            navigate("/admin/courses/view", {
              state: { course: catalogCourseFromHrdc(c, provider.name) },
            })
          }
        />
      ))}
    </AdminCourseCardsGrid>
  );
}

function DetailRow({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <div className="rounded-xl border border-[color:var(--admin-search-border)] bg-[color:var(--admin-search-bg)] p-4">
      <dt className="text-xs font-medium uppercase tracking-wide text-[color:var(--text-muted)]">{label}</dt>
      <dd className="mt-2 min-w-0 break-words text-sm font-medium text-[color:var(--text)]">
        {href && value && value !== "—" ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-sky-700 hover:underline">
            {value}
          </a>
        ) : (
          value.trim() || "—"
        )}
      </dd>
    </div>
  );
}
