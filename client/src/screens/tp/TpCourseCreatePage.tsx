"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "@/lib/api";

import { emptyCourseForm, TpCourseForm } from "@/components/tp/tp-course-form";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-widgets";
import { PageHeaderIconTpCourses } from "@/components/dashboard/page-header-icons";
import { ButtonLink } from "@/components/ui/button";
import { useTpOutlet } from "@/hooks/use-tp-outlet";

export default function TpCourseCreatePage() {
  const navigate = useNavigate();
  const { approved } = useTpOutlet();
  const [form, setForm] = useState(emptyCourseForm);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!approved) {
    return (
      <div className="p-6 text-sm text-[color:var(--text-muted)]">
        Course management unlocks after your training provider account is approved.
      </div>
    );
  }

  async function saveCourse(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    const res = await apiFetch("/api/tp/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(typeof j?.error === "string" ? j.error : "Failed to create course");
      return;
    }
    const j = (await res.json()) as { course?: { id?: string } };
    if (j.course?.id) {
      navigate(`/tp/courses/${j.course.id}`);
      return;
    }
    navigate("/tp/courses");
  }

  return (
    <div className="space-y-6 p-6">
      <DashboardPageHeader
        title="Create course"
        description="Add a new training programme"
        icon={<PageHeaderIconTpCourses />}
        right={
          <ButtonLink href="/tp/courses" variant="outline" size="sm">
            Back to courses
          </ButtonLink>
        }
      />

      <TpCourseForm
        form={form}
        setForm={setForm}
        onSubmit={(e) => void saveCourse(e)}
        saving={saving}
        error={err}
        submitLabel="Create course"
        cancelHref="/tp/courses"
      />
    </div>
  );
}
