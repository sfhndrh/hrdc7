"use client";

import { useEffect, useState } from "react";
import { apiAssetUrl, apiFetch } from "@/lib/api";
import { Navigate, useNavigate, useParams } from "react-router-dom";

import { TrainerPageHeader } from "@/components/dashboard/trainer-page-header";
import { PageHeaderIconCourses } from "@/components/dashboard/page-header-icons";
import { Button, ButtonLink } from "@/components/ui/button";

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
  tpOrgId: string | null;
  brochureUrl: string | null;
  slidesUrl: string | null;
  sampleMaterialsUrl: string | null;
};

export default function TrainerCourseDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    void apiFetch(`/api/trainer/courses/${encodeURIComponent(id)}`, {
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
  if (notFound) return <Navigate to="/trainer/courses" replace />;
  if (loading || !course) {
    return (
      <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-8 text-center text-sm text-[color:var(--text-muted)] shadow-sm">
        Loading course details…
      </div>
    );
  }

  const feeLabel =
    course.courseFee > 0 ? `RM ${course.courseFee.toLocaleString("en-MY")}` : "Contact for pricing";

  return (
    <div className="space-y-6">
      <TrainerPageHeader
        title="Course details"
        icon={<PageHeaderIconCourses />}
        right={
          <ButtonLink href="/trainer/courses" variant="outline" size="sm">
            Back to courses
          </ButtonLink>
        }
      />

      <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-[color:var(--text)]">{course.title}</h1>
        <p className="mt-1 text-sm text-[color:var(--text-muted)]">{course.category}</p>
        {course.hrdcClaimable === "Yes" ? (
          <span className="mt-3 inline-flex rounded-full border border-emerald-300 bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
            HRDC claimable
          </span>
        ) : null}
      </div>

      <Section title="Course overview">
        <FieldGrid>
          <Field label="Training provider" value={course.providerName} />
          <Field label="Course code" value={course.courseCode || "—"} />
          <Field label="Duration" value={course.duration || "—"} />
          <Field label="Fee" value={feeLabel} />
          <Field label="Delivery mode" value={course.deliveryMode || "—"} />
          <Field label="Language" value={course.language || "—"} />
          <Field label="Skill level" value={course.skillLevel || "—"} />
          <Field label="Max participants" value={String(course.maxParticipants || "—")} />
          <Field label="Training location" value={course.trainingLocation || "—"} wide />
        </FieldGrid>
      </Section>

      <Section title="Description">
        <Field label="About this course" value={course.description || "—"} wide multiline />
      </Section>

      <Section title="Learning outcomes">
        <Field label="What participants will learn" value={course.learningOutcomes || "—"} wide multiline />
      </Section>

      {course.materialsNote ? (
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

      {course.tpOrgId ? (
        <section className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
            Contact provider
          </h2>
          <p className="mt-2 text-sm text-[color:var(--text-muted)]">
            Ask {course.providerName} about this course. Course details will be shared in the
            conversation.
          </p>
          <Button
            type="button"
            variant="primary"
            className="mt-4"
            onClick={() =>
              navigate("/trainer/messages", {
                state: {
                  startPeer: {
                    id: course.tpOrgId as string,
                    name: course.providerName,
                    subtitle: "Training provider",
                    courseId: course.id,
                  },
                },
              })
            }
          >
            Contact training provider
          </Button>
        </section>
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
      <div className="text-xs font-semibold uppercase tracking-wide text-[color:var(--text-muted)]">
        {label}
      </div>
      <div className="mt-2">{body}</div>
    </div>
  );
}
