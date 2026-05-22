"use client";

import { useEffect, useState } from "react";
import { apiAssetUrl, apiFetch } from "@/lib/api";
import { Navigate, useParams } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink, cn } from "@/components/ui/button";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-widgets";
import { PageHeaderIconCourses } from "@/components/dashboard/page-header-icons";
import { useAuth } from "@/auth/AuthProvider";

type CourseDetail = {
  id: string;
  title: string;
  courseCode: string;
  category: string;
  description: string;
  learningOutcomes: string;
  duration: string;
  deliveryMode: string;
  hrdcClaimable: string;
  courseFee: number;
  maxParticipants: number;
  language: string;
  skillLevel: string;
  trainingLocation: string | null;
  materialsNote: string | null;
  providerName: string;
  brochureUrl: string | null;
  slidesUrl: string | null;
  sampleMaterialsUrl: string | null;
};

export default function ClientCourseDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [subscribed, setSubscribed] = useState(false);
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void apiFetch("/api/client/me", { credentials: "include" })
      .then((r) => r.json())
      .then(
        (d: {
          client?: {
            subscription?: { status: string; expiresAt: string | null } | null;
          } | null;
        }) => {
          const sub = d.client?.subscription;
          const active =
            sub?.status === "ACTIVE" &&
            (!sub.expiresAt || new Date(sub.expiresAt) > new Date());
          setSubscribed(!!active);
        },
      );
  }, []);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    void apiFetch(`/api/client/courses/${encodeURIComponent(id)}`, {
      credentials: "include",
    })
      .then(async (r) => {
        if (r.status === 404) {
          setNotFound(true);
          return null;
        }
        if (!r.ok) throw new Error(`Request failed (${r.status})`);
        return (await r.json()) as { course: CourseDetail };
      })
      .then((d) => {
        if (d?.course) setCourse(d.course);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (!id) return null;
  if (notFound) return <Navigate to="/client/courses" replace />;
  if (loading || !course) {
    return (
      <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-8 text-center text-sm text-[color:var(--text-muted)] shadow-sm">
        Loading course details…
      </div>
    );
  }

  const isAdmin = user?.role === "ADMIN";
  const unlockContent = isAdmin || subscribed;
  const feeLabel =
    course.courseFee > 0 ? `RM ${course.courseFee.toLocaleString("en-MY")}` : "Contact for pricing";

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Course Details"
        icon={<PageHeaderIconCourses />}
        right={
          <ButtonLink href="/client/courses" variant="outline" size="sm">
            Back to courses
          </ButtonLink>
        }
      />

      <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm">
        <div
          className={cn(!unlockContent ? "select-none blur-sm pointer-events-none" : "")}
          aria-hidden={!unlockContent ? true : undefined}
        >
          <h1 className="text-2xl font-bold text-[color:var(--text)]">{course.title}</h1>
          <p className="mt-1 text-sm text-[color:var(--text-muted)]">{course.category}</p>
        </div>
        {isAdmin ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone="gray">Admin preview</Badge>
          </div>
        ) : null}
        {!unlockContent ? (
          <div className="mt-3">
            <ButtonLink size="sm" href="/client/subscription">
              Subscribe to unlock
            </ButtonLink>
          </div>
        ) : null}
      </div>

      <Section title="Course overview">
        <FieldGrid>
          <Field label="Training provider" value={course.providerName} locked={!unlockContent} />
          <Field label="Course code" value={course.courseCode || "—"} locked={!unlockContent} />
          <Field label="Duration" value={course.duration || "—"} locked={!unlockContent} />
          <Field label="Fee" value={feeLabel} locked={!unlockContent} />
          <Field label="Delivery mode" value={course.deliveryMode || "—"} locked={!unlockContent} />
          <Field label="Language" value={course.language || "—"} locked={!unlockContent} />
          <Field
            label="Max participants"
            value={String(course.maxParticipants || "—")}
            locked={!unlockContent}
          />
          <Field
            label="Training location"
            value={course.trainingLocation || "—"}
            locked={!unlockContent}
            wide
          />
        </FieldGrid>
      </Section>

      <Section title="Description">
        <Field
          label="About this course"
          value={course.description || "—"}
          locked={!unlockContent}
          wide
          multiline
        />
      </Section>

      <Section title="Learning outcomes">
        <Field
          label="What participants will learn"
          value={course.learningOutcomes || "—"}
          locked={!unlockContent}
          wide
          multiline
        />
      </Section>

      {course.materialsNote ? (
        <Section title="Course materials">
          <Field
            label="Materials note"
            value={course.materialsNote}
            locked={!unlockContent}
            wide
            multiline
          />
        </Section>
      ) : null}

      {course.brochureUrl || course.slidesUrl || course.sampleMaterialsUrl ? (
        <Section title="Uploaded files">
          <FieldGrid>
            {course.brochureUrl ? (
              <Field label="Brochure" locked={!unlockContent}>
                <DocLink url={course.brochureUrl} />
              </Field>
            ) : null}
            {course.slidesUrl ? (
              <Field label="Slides" locked={!unlockContent}>
                <DocLink url={course.slidesUrl} />
              </Field>
            ) : null}
            {course.sampleMaterialsUrl ? (
              <Field label="Sample materials" locked={!unlockContent}>
                <DocLink url={course.sampleMaterialsUrl} />
              </Field>
            ) : null}
          </FieldGrid>
        </Section>
      ) : null}

      {!subscribed && !isAdmin ? <SubscribeCallout /> : null}
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
  locked,
  wide,
  multiline,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
  locked?: boolean;
  wide?: boolean;
  multiline?: boolean;
}) {
  const body = children ?? (
    <div
      className={`text-sm font-medium text-[color:var(--text)] ${
        multiline ? "leading-6 whitespace-pre-line" : ""
      }`}
    >
      {value}
    </div>
  );

  return (
    <div
      className={`rounded-xl border border-[color:var(--admin-search-border)] bg-[color:var(--admin-search-bg)] p-4 ${
        wide ? "md:col-span-2" : ""
      }`}
    >
      <div className="flex items-center gap-2">
        <div className="text-xs font-medium uppercase tracking-wide text-[color:var(--text-muted)]">
          {label}
        </div>
        {locked ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">
            <LockIcon className="h-3 w-3" />
            Subscribe to view
          </span>
        ) : null}
      </div>
      <div
        className={`mt-2 ${locked ? "select-none blur-sm pointer-events-none" : ""}`}
        aria-hidden={locked ? true : undefined}
      >
        {body}
      </div>
    </div>
  );
}

function SubscribeCallout() {
  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-gradient-to-br from-orange-50 via-amber-50 to-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-base font-semibold text-[color:var(--text)]">
            Unlock full course details
          </div>
          <p className="mt-1 max-w-2xl text-sm text-[color:var(--text-muted)]">
            Subscribe to see provider contact info, fees, descriptions, learning outcomes, and
            downloadable materials.
          </p>
        </div>
        <ButtonLink size="lg" href="/client/subscription">
          Subscribe to unlock
        </ButtonLink>
      </div>
    </div>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className={className}
      aria-hidden
    >
      <rect x="4" y="11" width="16" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}
