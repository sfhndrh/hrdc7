"use client";

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "@/lib/api";

import {
  courseToFormValues,
  TpCourseForm,
  type TpCourseFormValues,
} from "@/components/tp/tp-course-form";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-widgets";
import { PageHeaderIconTpCourses } from "@/components/dashboard/page-header-icons";
import { ButtonLink } from "@/components/ui/button";
import type { TpCourse } from "@/lib/tp-platform";
import { useTpOutlet } from "@/hooks/use-tp-outlet";

export default function TpCourseEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { approved } = useTpOutlet();
  const [form, setForm] = useState<TpCourseFormValues | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    void apiFetch(`/api/tp/courses/${encodeURIComponent(id)}`, { credentials: "include" })
      .then(async (r) => {
        if (!r.ok) throw new Error(`Request failed (${r.status})`);
        return (await r.json()) as { course: TpCourse };
      })
      .then((d) => setForm(courseToFormValues(d.course)))
      .catch(() => setForm(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (!approved) {
    return (
      <div className="p-6 text-sm text-[color:var(--text-muted)]">
        Course management unlocks after your training provider account is approved.
      </div>
    );
  }

  if (!id) return null;

  async function saveCourse(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setErr(null);
    const res = await apiFetch(`/api/tp/courses/${encodeURIComponent(id!)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(typeof j?.error === "string" ? j.error : "Failed to update course");
      return;
    }
    navigate(`/tp/courses/${id}`);
  }

  return (
    <div className="space-y-6 p-6">
      <DashboardPageHeader
        title="Edit course"
        description="Update your training programme details"
        icon={<PageHeaderIconTpCourses />}
        right={
          <ButtonLink href={`/tp/courses/${id}`} variant="outline" size="sm">
            Back to course
          </ButtonLink>
        }
      />

      {loading ? (
        <p className="text-sm text-[color:var(--text-muted)]">Loading course…</p>
      ) : !form ? (
        <p className="text-sm text-red-700">Course not found.</p>
      ) : (
        <TpCourseForm
          form={form}
          setForm={setForm}
          onSubmit={(e) => void saveCourse(e)}
          saving={saving}
          error={err}
          submitLabel="Save changes"
          cancelHref={`/tp/courses/${id}`}
        />
      )}
    </div>
  );
}
