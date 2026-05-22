"use client";

import { useEffect, useState } from "react";
import { apiAssetUrl, apiFetch } from "@/lib/api";
import { Navigate, useParams } from "react-router-dom";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-widgets";
import { PageHeaderIconTpCourses } from "@/components/dashboard/page-header-icons";
import { Button, ButtonLink, cn } from "@/components/ui/button";
import { formatRm, type TpCourse } from "@/lib/tp-platform";
import { useTpOutlet } from "@/hooks/use-tp-outlet";

type TpCourseDetail = TpCourse & {
  createdAt?: string;
  updatedAt?: string;
};

export default function TpCourseDetailPage() {
  const { id } = useParams();
  const { approved } = useTpOutlet();
  const [course, setCourse] = useState<TpCourseDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setNotFound(false);
    void apiFetch(`/api/tp/courses/${encodeURIComponent(id)}`, { credentials: "include" })
      .then(async (r) => {
        if (r.status === 404) {
          setNotFound(true);
          return null;
        }
        if (!r.ok) throw new Error(`Request failed (${r.status})`);
        return (await r.json()) as { course: TpCourseDetail };
      })
      .then((d) => {
        if (d?.course) setCourse(d.course);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (!approved) {
    return (
      <div className="p-6 text-sm text-[color:var(--text-muted)]">
        Course details unlock after your training provider account is approved.
      </div>
    );
  }

  if (!id) return null;
  if (notFound) return <Navigate to="/tp/courses" replace />;
  if (loading || !course) {
    return (
      <div className="p-6 text-sm text-[color:var(--text-muted)]">Loading course details…</div>
    );
  }

  const fee =
    Number(course.courseFee) > 0
      ? formatRm(Number(course.courseFee))
      : "Contact for pricing";

  return (
    <div className="space-y-6 p-6">
      <DashboardPageHeader
        title="Course details"
        icon={<PageHeaderIconTpCourses />}
        right={
          <ButtonLink href="/tp/courses" variant="outline" size="sm">
            Back to courses
          </ButtonLink>
        }
      />

      <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-[color:var(--text)]">{course.title}</h1>
        <p className="mt-1 text-sm text-[color:var(--text-muted)]">{course.category}</p>
        {course.courseCode ? (
          <p className="mt-2 text-sm text-[color:var(--text-muted)]">
            Course code:{" "}
            <span className="font-medium text-[color:var(--text)]">{course.courseCode}</span>
          </p>
        ) : null}
      </div>

      <Section title="Course overview">
        <FieldGrid>
          <Field label="Course code" value={course.courseCode || "—"} />
          <Field label="Duration" value={course.duration || "—"} />
          <Field label="Fee" value={fee} />
          <Field label="Delivery mode" value={course.deliveryMode || "—"} />
          <Field label="Language" value={course.language || "—"} />
          <Field label="Skill level" value={course.skillLevel || "—"} />
          <Field label="HRDC claimable" value={course.hrdcClaimable || "—"} />
          <Field
            label="Max participants"
            value={course.maxParticipants ? String(course.maxParticipants) : "—"}
          />
          <Field
            label="Training location"
            value={course.trainingLocation?.trim() || "—"}
            wide
          />
        </FieldGrid>
      </Section>

      <Section title="Description">
        <Field label="About this course" value={course.description || "—"} wide multiline />
      </Section>

      <Section title="Learning outcomes">
        <Field
          label="What participants will learn"
          value={course.learningOutcomes || "—"}
          wide
          multiline
        />
      </Section>

      {course.materialsNote?.trim() ? (
        <Section title="Course materials">
          <Field label="Materials note" value={course.materialsNote} wide multiline />
        </Section>
      ) : null}

      {course.brochureUrl || course.slidesUrl || course.sampleMaterialsUrl ? (
        <Section title="Uploaded files">
          <FieldGrid>
            {course.brochureUrl ? (
              <Field label="Brochure">
                <DocLink url={course.brochureUrl} />
              </Field>
            ) : null}
            {course.slidesUrl ? (
              <Field label="Slides">
                <DocLink url={course.slidesUrl} />
              </Field>
            ) : null}
            {course.sampleMaterialsUrl ? (
              <Field label="Sample materials">
                <DocLink url={course.sampleMaterialsUrl} />
              </Field>
            ) : null}
          </FieldGrid>
        </Section>
      ) : null}
    </div>
  );
}

function DocLink({ url }: { url: string }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => window.open(apiAssetUrl(url), "_blank", "noopener,noreferrer")}
    >
      View file
    </Button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm">
      <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function FieldGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2">{children}</div>;
}

function Field({
  label,
  value,
  children,
  wide,
  multiline,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
  wide?: boolean;
  multiline?: boolean;
}) {
  const body =
    children ??
    (
      <div
        className={cn(
          "text-sm font-medium text-[color:var(--text)]",
          multiline && "whitespace-pre-wrap leading-6",
        )}
      >
        {value}
      </div>
    );

  return (
    <div
      className={cn(
        "rounded-xl border border-[color:var(--admin-search-border)] bg-[color:var(--admin-search-bg)] p-4",
        wide && "md:col-span-2",
      )}
    >
      <div className="text-xs font-medium uppercase tracking-wide text-[color:var(--text-muted)]">
        {label}
      </div>
      <div className="mt-2">{body}</div>
    </div>
  );
}
