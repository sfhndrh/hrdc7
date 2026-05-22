"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "@/lib/api";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-widgets";
import { PageHeaderIconTpCourses } from "@/components/dashboard/page-header-icons";
import { Button, ButtonLink } from "@/components/ui/button";
import {
  TP_COURSE_CATEGORIES,
  TP_DELIVERY_MODES,
  TP_SKILL_LEVELS,
} from "@/lib/tp-platform";
import { useTpOutlet } from "@/hooks/use-tp-outlet";
import {
  registerInputClass,
  registerTextareaClass,
} from "@/components/register/register-form-primitives";

const emptyCourse = () => ({
  title: "",
  courseCode: "",
  category: TP_COURSE_CATEGORIES[0],
  description: "",
  learningOutcomes: "",
  duration: "",
  deliveryMode: TP_DELIVERY_MODES[0] as (typeof TP_DELIVERY_MODES)[number],
  hrdcClaimable: "Yes" as "Yes" | "No",
  courseFee: 0,
  maxParticipants: 20,
  materialsNote: "",
  language: "English",
  skillLevel: TP_SKILL_LEVELS[0],
  trainingLocation: "",
  brochureUrl: null as string | null,
  slidesUrl: null as string | null,
  sampleMaterialsUrl: null as string | null,
});

export default function TpCourseCreatePage() {
  const navigate = useNavigate();
  const { approved } = useTpOutlet();
  const [form, setForm] = useState(emptyCourse);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!approved) {
    return (
      <div className="p-6 text-sm text-[color:var(--text-muted)]">
        Course management unlocks after your training provider account is approved.
      </div>
    );
  }

  async function uploadCourseFile(file: File): Promise<string> {
    const fd = new FormData();
    fd.append("file", file);
    const res = await apiFetch("/api/uploads/tp-course-file", {
      method: "POST",
      body: fd,
      credentials: "include",
    });
    if (!res.ok) throw new Error("Upload failed");
    const j = (await res.json()) as { url: string };
    return j.url;
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

      <form
        onSubmit={(e) => void saveCourse(e)}
        className="mx-auto max-w-3xl space-y-6 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm"
      >
        {err ? <p className="text-sm text-red-700">{err}</p> : null}

        <FormField label="Course title">
          <input
            className={registerInputClass}
            required
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
        </FormField>
        <FormField label="Course ID / code">
          <input
            className={registerInputClass}
            required
            value={form.courseCode}
            onChange={(e) => setForm((f) => ({ ...f, courseCode: e.target.value }))}
          />
        </FormField>
        <FormField label="Category">
          <select
            className={registerInputClass}
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          >
            {TP_COURSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Description">
          <textarea
            className={registerTextareaClass}
            rows={4}
            required
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </FormField>
        <FormField label="Learning outcomes">
          <textarea
            className={registerTextareaClass}
            rows={4}
            required
            value={form.learningOutcomes}
            onChange={(e) => setForm((f) => ({ ...f, learningOutcomes: e.target.value }))}
          />
        </FormField>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Duration">
            <input
              className={registerInputClass}
              placeholder="e.g. 2 days"
              required
              value={form.duration}
              onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
            />
          </FormField>
          <FormField label="Delivery mode">
            <select
              className={registerInputClass}
              value={form.deliveryMode}
              onChange={(e) =>
                setForm((f) => ({ ...f, deliveryMode: e.target.value as typeof f.deliveryMode }))
              }
            >
              {TP_DELIVERY_MODES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="HRDC claimable">
            <select
              className={registerInputClass}
              value={form.hrdcClaimable}
              onChange={(e) =>
                setForm((f) => ({ ...f, hrdcClaimable: e.target.value as "Yes" | "No" }))
              }
            >
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </FormField>
          <FormField label="Course fee (MYR)">
            <input
              className={registerInputClass}
              type="number"
              min={0}
              required
              value={form.courseFee}
              onChange={(e) => setForm((f) => ({ ...f, courseFee: Number(e.target.value) }))}
            />
          </FormField>
          <FormField label="Max participants">
            <input
              className={registerInputClass}
              type="number"
              min={1}
              required
              value={form.maxParticipants}
              onChange={(e) => setForm((f) => ({ ...f, maxParticipants: Number(e.target.value) }))}
            />
          </FormField>
          <FormField label="Language">
            <input
              className={registerInputClass}
              required
              value={form.language}
              onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))}
            />
          </FormField>
          <FormField label="Skill level">
            <select
              className={registerInputClass}
              value={form.skillLevel}
              onChange={(e) => setForm((f) => ({ ...f, skillLevel: e.target.value }))}
            >
              {TP_SKILL_LEVELS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Training location">
            <input
              className={registerInputClass}
              value={form.trainingLocation}
              onChange={(e) => setForm((f) => ({ ...f, trainingLocation: e.target.value }))}
            />
          </FormField>
        </div>

        <FormField label="Course materials note">
          <textarea
            className={registerTextareaClass}
            rows={2}
            value={form.materialsNote}
            onChange={(e) => setForm((f) => ({ ...f, materialsNote: e.target.value }))}
          />
        </FormField>

        <FileField
          label="Brochure"
          onFile={(f) =>
            void uploadCourseFile(f).then((url) => setForm((x) => ({ ...x, brochureUrl: url })))
          }
        />
        <FileField
          label="Slides"
          onFile={(f) =>
            void uploadCourseFile(f).then((url) => setForm((x) => ({ ...x, slidesUrl: url })))
          }
        />
        <FileField
          label="Sample materials"
          onFile={(f) =>
            void uploadCourseFile(f).then((url) =>
              setForm((x) => ({ ...x, sampleMaterialsUrl: url })),
            )
          }
        />

        <div className="flex flex-wrap justify-end gap-3 border-t border-[color:var(--border)] pt-4">
          <ButtonLink href="/tp/courses" variant="outline" type="button">
            Cancel
          </ButtonLink>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Create course"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-semibold text-[color:var(--text)]">{label}</span>
      {children}
    </label>
  );
}

function FileField({ label, onFile }: { label: string; onFile: (f: File) => void }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-semibold text-[color:var(--text)]">{label}</span>
      <input
        type="file"
        className="block w-full text-sm"
        accept=".pdf,.png,.jpg,.jpeg,.ppt,.pptx"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
    </label>
  );
}
