"use client";

import { useRef, useState } from "react";
import { apiAssetUrl, apiFetch } from "@/lib/api";
import { Button, ButtonLink } from "@/components/ui/button";
import {
  registerInputClass,
  registerTextareaClass,
} from "@/components/register/register-form-primitives";
import {
  TP_COURSE_CATEGORIES,
  TP_DELIVERY_MODES,
  TP_SKILL_LEVELS,
  type TpCourse,
} from "@/lib/tp-platform";

export type TpCourseFormValues = {
  title: string;
  courseCode: string;
  category: string;
  description: string;
  learningOutcomes: string;
  duration: string;
  deliveryMode: (typeof TP_DELIVERY_MODES)[number];
  hrdcClaimable: "Yes" | "No";
  courseFee: number;
  maxParticipants: number;
  materialsNote: string;
  language: string;
  skillLevel: string;
  trainingLocation: string;
  brochureUrl: string | null;
  slidesUrl: string | null;
  sampleMaterialsUrl: string | null;
};

export function emptyCourseForm(): TpCourseFormValues {
  return {
    title: "",
    courseCode: "",
    category: TP_COURSE_CATEGORIES[0],
    description: "",
    learningOutcomes: "",
    duration: "",
    deliveryMode: TP_DELIVERY_MODES[0],
    hrdcClaimable: "Yes",
    courseFee: 0,
    maxParticipants: 20,
    materialsNote: "",
    language: "English",
    skillLevel: TP_SKILL_LEVELS[0],
    trainingLocation: "",
    brochureUrl: null,
    slidesUrl: null,
    sampleMaterialsUrl: null,
  };
}

export function courseToFormValues(course: TpCourse): TpCourseFormValues {
  const category = TP_COURSE_CATEGORIES.includes(course.category as (typeof TP_COURSE_CATEGORIES)[number])
    ? course.category
    : TP_COURSE_CATEGORIES[TP_COURSE_CATEGORIES.length - 1];
  const deliveryMode = TP_DELIVERY_MODES.includes(
    course.deliveryMode as (typeof TP_DELIVERY_MODES)[number],
  )
    ? (course.deliveryMode as (typeof TP_DELIVERY_MODES)[number])
    : TP_DELIVERY_MODES[0];

  return {
    title: course.title,
    courseCode: course.courseCode,
    category,
    description: course.description,
    learningOutcomes: course.learningOutcomes,
    duration: course.duration,
    deliveryMode,
    hrdcClaimable: course.hrdcClaimable === "No" ? "No" : "Yes",
    courseFee: Number(course.courseFee) || 0,
    maxParticipants: Number(course.maxParticipants) || 1,
    materialsNote: course.materialsNote ?? "",
    language: course.language || "English",
    skillLevel: course.skillLevel || TP_SKILL_LEVELS[0],
    trainingLocation: course.trainingLocation ?? "",
    brochureUrl: course.brochureUrl,
    slidesUrl: course.slidesUrl,
    sampleMaterialsUrl: course.sampleMaterialsUrl,
  };
}

export function TpCourseForm({
  form,
  setForm,
  onSubmit,
  saving,
  error,
  submitLabel,
  cancelHref,
}: {
  form: TpCourseFormValues;
  setForm: React.Dispatch<React.SetStateAction<TpCourseFormValues>>;
  onSubmit: (e: React.FormEvent) => void;
  saving: boolean;
  error: string | null;
  submitLabel: string;
  cancelHref: string;
}) {
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

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto max-w-3xl space-y-6 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm"
    >
      {error ? <p className="text-sm text-red-700">{error}</p> : null}

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
        currentUrl={form.brochureUrl}
        onFile={async (f) => {
          const url = await uploadCourseFile(f);
          setForm((x) => ({ ...x, brochureUrl: url }));
        }}
      />
      <FileField
        label="Slides"
        currentUrl={form.slidesUrl}
        onFile={async (f) => {
          const url = await uploadCourseFile(f);
          setForm((x) => ({ ...x, slidesUrl: url }));
        }}
      />
      <FileField
        label="Sample materials"
        currentUrl={form.sampleMaterialsUrl}
        onFile={async (f) => {
          const url = await uploadCourseFile(f);
          setForm((x) => ({ ...x, sampleMaterialsUrl: url }));
        }}
      />

      <div className="flex flex-wrap justify-end gap-3 border-t border-[color:var(--border)] pt-4">
        <ButtonLink href={cancelHref} variant="outline" type="button">
          Cancel
        </ButtonLink>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
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

function FileField({
  label,
  currentUrl,
  onFile,
}: {
  label: string;
  currentUrl: string | null;
  onFile: (f: File) => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [pickedName, setPickedName] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const buttonLabel = uploading
    ? "Uploading…"
    : currentUrl || pickedName
      ? "Replace file"
      : "Choose file";

  const statusLabel =
    pickedName ?? (currentUrl ? "File uploaded" : "No file selected");

  return (
    <div className="block space-y-1.5">
      <span className="text-sm font-semibold text-[color:var(--text)]">{label}</span>
      {currentUrl ? (
        <p className="text-xs text-[color:var(--text-muted)]">
          Current file:{" "}
          <a
            href={apiAssetUrl(currentUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-sky-700 hover:underline"
          >
            View
          </a>
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          accept=".pdf,.png,.jpg,.jpeg,.ppt,.pptx"
          disabled={uploading}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            setUploadError(null);
            setPickedName(f.name);
            setUploading(true);
            void onFile(f)
              .catch(() => {
                setUploadError("Upload failed. Try again.");
                setPickedName(null);
              })
              .finally(() => {
                setUploading(false);
                e.target.value = "";
              });
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {buttonLabel}
        </Button>
        <span
          className={`min-w-0 max-w-full truncate text-xs ${
            pickedName || currentUrl
              ? "text-[color:var(--text)]"
              : "text-[color:var(--text-muted)]"
          }`}
          title={statusLabel}
        >
          {statusLabel}
        </span>
      </div>
      {uploadError ? <p className="text-xs text-red-700">{uploadError}</p> : null}
    </div>
  );
}
