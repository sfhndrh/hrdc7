"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "@/lib/api";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-widgets";
import { PageHeaderIconCalendar } from "@/components/dashboard/page-header-icons";
import { Button, ButtonLink } from "@/components/ui/button";
import { TP_SCHEDULE_STATUSES } from "@/lib/tp-platform";
import { useTpOutlet } from "@/hooks/use-tp-outlet";
import {
  registerInputClass,
  registerTextareaClass,
} from "@/components/register/register-form-primitives";

type CourseOpt = { id: string; title: string };

export default function TpScheduleCreatePage() {
  const navigate = useNavigate();
  const { approved } = useTpOutlet();
  const [courses, setCourses] = useState<CourseOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    courseId: "",
    scheduledDate: "",
    scheduledTime: "09:00",
    venue: "",
    onlineMeetingLink: "",
    status: "PROPOSED" as (typeof TP_SCHEDULE_STATUSES)[number],
    notes: "",
  });

  useEffect(() => {
    void apiFetch("/api/tp/courses", { credentials: "include" })
      .then(async (cRes) => {
        const c = await cRes.json();
        setCourses(
          (c.courses ?? []).map((x: { id: string; title: string }) => ({
            id: x.id,
            title: x.title,
          })),
        );
      })
      .finally(() => setLoading(false));
  }, []);

  if (!approved) {
    return (
      <div className="p-6 text-sm text-[color:var(--text-muted)]">
        Schedule unlocks after approval.
      </div>
    );
  }

  async function createSchedule(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await apiFetch("/api/tp/schedules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        courseId: form.courseId,
        trainerId: null,
        employerRequestId: null,
        scheduledDate: form.scheduledDate,
        scheduledTime: form.scheduledTime,
        venue: form.venue,
        onlineMeetingLink: form.onlineMeetingLink,
        status: form.status,
        notes: form.notes,
      }),
    });
    setSaving(false);
    if (res.ok) navigate("/tp/schedules");
  }

  return (
    <div className="space-y-6 p-6">
      <DashboardPageHeader
        title="New schedule"
        description="Propose a training date and venue"
        icon={<PageHeaderIconCalendar />}
        right={
          <ButtonLink href="/tp/schedules" variant="outline" size="sm">
            Back to schedule
          </ButtonLink>
        }
      />

      {loading ? (
        <p className="text-sm text-[color:var(--text-muted)]">Loading…</p>
      ) : (
        <form
          onSubmit={(e) => void createSchedule(e)}
          className="mx-auto max-w-2xl space-y-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm"
        >
          <FormField label="Course">
            <select
              className={registerInputClass}
              required
              value={form.courseId}
              onChange={(e) => setForm((f) => ({ ...f, courseId: e.target.value }))}
            >
              <option value="">Select course…</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </FormField>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Date">
              <input
                type="date"
                className={registerInputClass}
                required
                value={form.scheduledDate}
                onChange={(e) => setForm((f) => ({ ...f, scheduledDate: e.target.value }))}
              />
            </FormField>
            <FormField label="Time">
              <input
                type="time"
                className={registerInputClass}
                required
                value={form.scheduledTime}
                onChange={(e) => setForm((f) => ({ ...f, scheduledTime: e.target.value }))}
              />
            </FormField>
          </div>
          <FormField label="Venue">
            <input
              className={registerInputClass}
              value={form.venue}
              onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))}
            />
          </FormField>
          <FormField label="Online meeting link">
            <input
              className={registerInputClass}
              value={form.onlineMeetingLink}
              onChange={(e) => setForm((f) => ({ ...f, onlineMeetingLink: e.target.value }))}
            />
          </FormField>
          <FormField label="Status">
            <select
              className={registerInputClass}
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({ ...f, status: e.target.value as typeof f.status }))
              }
            >
              {TP_SCHEDULE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Notes">
            <textarea
              className={registerTextareaClass}
              rows={3}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </FormField>

          <div className="flex flex-wrap justify-end gap-3 border-t border-[color:var(--border)] pt-4">
            <ButtonLink href="/tp/schedules" variant="outline" type="button">
              Cancel
            </ButtonLink>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save schedule"}
            </Button>
          </div>
        </form>
      )}
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
