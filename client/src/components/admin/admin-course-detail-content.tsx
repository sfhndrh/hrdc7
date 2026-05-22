"use client";

import { Link } from "@/components/link";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-widgets";
import { PageHeaderIconCourses } from "@/components/dashboard/page-header-icons";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import type { CatalogCourse } from "@/lib/training-courses-catalog";

export type AdminCourseDetailExtra = {
  materialsNote?: string | null;
  trainingLocation?: string | null;
  brochureUrl?: string | null;
  slidesUrl?: string | null;
  sampleMaterialsUrl?: string | null;
  tpOrgId?: string;
  companyName?: string;
};

export function AdminCourseDetailContent({
  course,
  extra,
}: {
  course: CatalogCourse;
  extra?: AdminCourseDetailExtra;
}) {
  const isPlatform = course.source === "platform";

  return (
    <div className="space-y-6 p-6">
      <DashboardPageHeader
        title={course.title}
        description={course.category}
        icon={<PageHeaderIconCourses />}
        right={
          <ButtonLink href="/admin/courses" variant="outline" size="sm">
            Back to courses
          </ButtonLink>
        }
      />

      <div className="flex flex-wrap gap-2">
        <Badge tone="gray">{course.category}</Badge>
        {isPlatform ? <Badge tone="blue">Platform</Badge> : <Badge tone="gray">HRDC directory</Badge>}
        {course.claimable ? <Badge tone="green">HRDC claimable</Badge> : null}
        {isPlatform && course.isPublished === false ? <Badge tone="yellow">Unpublished</Badge> : null}
      </div>

      <section className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm">
        <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
          Overview
        </h2>
        <dl className="mt-4 grid gap-4 md:grid-cols-2">
          {isPlatform ? (
            <Field label="Training provider" value={course.providerNames[0] ?? extra?.companyName ?? "—"} />
          ) : (
            <Field label="Providers offering this course" value={String(course.providerCount)} />
          )}
          <Field label="Course code" value={course.code || "—"} />
          <Field label={isPlatform ? "Skill level" : "Scheme"} value={course.scheme || "—"} />
          <Field label="Duration" value={course.duration || "—"} />
          <Field label="Fee" value={course.fee || "—"} />
          <Field label="Delivery mode" value={course.mode || "—"} />
          {isPlatform && course.language ? <Field label="Language" value={course.language} /> : null}
          {isPlatform && course.maxParticipants != null ? (
            <Field label="Max participants" value={String(course.maxParticipants)} />
          ) : null}
          {extra?.trainingLocation ? (
            <Field label="Training location" value={extra.trainingLocation} wide />
          ) : null}
        </dl>
      </section>

      {isPlatform && course.description ? (
        <section className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
            Description
          </h2>
          <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-[color:var(--text)]">
            {course.description}
          </p>
        </section>
      ) : null}

      {isPlatform && course.learningOutcomes ? (
        <section className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
            Learning outcomes
          </h2>
          <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-[color:var(--text)]">
            {course.learningOutcomes}
          </p>
        </section>
      ) : null}

      {extra?.materialsNote ? (
        <section className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
            Course materials
          </h2>
          <p className="mt-4 whitespace-pre-line text-sm text-[color:var(--text)]">{extra.materialsNote}</p>
        </section>
      ) : null}

      {isPlatform && (extra?.brochureUrl || extra?.slidesUrl || extra?.sampleMaterialsUrl) ? (
        <section className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
            Uploaded files
          </h2>
          <ul className="mt-4 space-y-2 text-sm">
            {extra.brochureUrl ? <DocLink label="Brochure" url={extra.brochureUrl} /> : null}
            {extra.slidesUrl ? <DocLink label="Slides" url={extra.slidesUrl} /> : null}
            {extra.sampleMaterialsUrl ? (
              <DocLink label="Sample materials" url={extra.sampleMaterialsUrl} />
            ) : null}
          </ul>
        </section>
      ) : null}

      {!isPlatform && course.providerNames.length > 0 ? (
        <section className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
            Training providers ({course.providerNames.length})
          </h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {course.providerNames.map((name) => (
              <li
                key={name}
                className="rounded-xl border border-[color:var(--admin-search-border)] bg-[color:var(--admin-search-bg)] px-4 py-3 text-sm font-medium text-[color:var(--text)]"
              >
                {name}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {isPlatform && extra?.tpOrgId ? (
        <p className="text-sm text-[color:var(--text-muted)]">
          <Link href={`/admin/tp-orgs/${extra.tpOrgId}`} className="font-medium text-sky-800 underline">
            View training provider account
          </Link>
        </p>
      ) : null}
    </div>
  );
}

function Field({
  label,
  value,
  wide,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border border-[color:var(--admin-search-border)] bg-[color:var(--admin-search-bg)] p-4 ${
        wide ? "md:col-span-2" : ""
      }`}
    >
      <div className="text-xs font-medium uppercase tracking-wide text-[color:var(--text-muted)]">{label}</div>
      <div className="mt-2 text-sm font-medium text-[color:var(--text)]">{value}</div>
    </div>
  );
}

function DocLink({ label, url }: { label: string; url: string }) {
  return (
    <li>
      <a href={url} target="_blank" rel="noreferrer" className="font-medium text-sky-800 underline hover:text-sky-950">
        {label}
      </a>
    </li>
  );
}
