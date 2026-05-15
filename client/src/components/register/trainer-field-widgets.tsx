"use client";

import { useState } from "react";

import { registerInputClass } from "@/components/register/register-form-primitives";
import { cn } from "@/components/ui/button";
import { DELIVERY_MODE_OPTIONS } from "@/lib/trainer-delivery-modes";

export { DELIVERY_MODE_OPTIONS } from "@/lib/trainer-delivery-modes";

export function TagListEditor({
  tags,
  onChange,
  placeholder = "Type a topic, then tap Add",
  maxTags = 30,
  hint,
  disabled = false,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  hint?: string;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState("");

  function addFromDraft() {
    if (disabled) return;
    const t = draft.trim();
    if (!t || tags.includes(t) || tags.length >= maxTags) return;
    onChange([...tags, t]);
    setDraft("");
  }

  const hasTags = tags.length > 0;

  return (
    <div className={hasTags || hint ? "space-y-2" : undefined}>
      {hint ? <p className="text-xs text-[color:var(--text-muted)]">{hint}</p> : null}
      {hasTags ? (
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-white px-2.5 py-1 text-sm text-[color:var(--text)]"
            >
              {t}
              {!disabled ? (
                <button
                  type="button"
                  className="rounded-full p-0.5 text-[color:var(--text-muted)] hover:bg-sky-100 hover:text-[color:var(--text)]"
                  aria-label={`Remove ${t}`}
                  onClick={() => onChange(tags.filter((x) => x !== t))}
                >
                  ×
                </button>
              ) : null}
            </span>
          ))}
        </div>
      ) : null}
      {!disabled ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            className={cn(registerInputClass, "sm:min-w-[12rem] sm:flex-1")}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addFromDraft();
              }
            }}
            placeholder={placeholder}
          />
          <button
            type="button"
            className="h-10 shrink-0 rounded-md border border-[color:var(--border)] bg-white px-3 text-sm font-medium text-[color:var(--text)] hover:bg-[color:var(--surface-muted)]"
            onClick={addFromDraft}
          >
            Add
          </button>
        </div>
      ) : null}
    </div>
  );
}

/** For server `<form>` POST: one hidden input per tag. */
export function FormTagList({
  name,
  initialTags,
  disabled = false,
}: {
  name: string;
  initialTags: string[];
  disabled?: boolean;
}) {
  const [tags, setTags] = useState(initialTags);
  return (
    <>
      {tags.map((t) => (
        <input type="hidden" key={t} name={name} value={t} />
      ))}
      <TagListEditor
        tags={tags}
        onChange={setTags}
        placeholder="e.g. Leadership fundamentals"
        hint="Add each area separately (e.g. Leadership, HRDC compliance)."
        disabled={disabled}
      />
    </>
  );
}

export function FormDeliveryModeCheckboxes({
  initialModes,
  disabled = false,
}: {
  initialModes: string[];
  disabled?: boolean;
}) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(initialModes));

  function toggle(opt: string) {
    if (disabled) return;
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(opt)) n.delete(opt);
      else n.add(opt);
      return n;
    });
  }

  return (
    <div className="space-y-2">
      {[...selected].map((v) => (
        <input type="hidden" key={v} name="deliveryModes" value={v} />
      ))}
      <div className="grid gap-2 sm:grid-cols-2">
        {DELIVERY_MODE_OPTIONS.map((opt) => (
          <label
            key={opt}
            className={cn(
              "flex items-center gap-2 rounded-lg border border-sky-100 bg-white px-3 py-2 text-sm text-[color:var(--text)]",
              disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer hover:bg-sky-50/60",
            )}
          >
            <input
              type="checkbox"
              checked={selected.has(opt)}
              onChange={() => toggle(opt)}
              disabled={disabled}
              className="h-4 w-4 rounded border-[color:var(--border)] text-sky-600"
            />
            {opt}
          </label>
        ))}
      </div>
    </div>
  );
}

export function FormTravelWillingBlock({
  initialWilling,
  initialLocations,
  disabled = false,
}: {
  initialWilling: "Yes" | "No" | "";
  initialLocations: string[];
  disabled?: boolean;
}) {
  const [willing, setWilling] = useState<"Yes" | "No" | "">(initialWilling || "");
  const [locations, setLocations] = useState(initialLocations);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <label
          className={cn(
            "flex items-center gap-2 text-sm font-medium text-[color:var(--text)]",
            disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer",
          )}
        >
          <input
            type="radio"
            name="willingToTravel"
            value="Yes"
            checked={willing === "Yes"}
            onChange={() => setWilling("Yes")}
            disabled={disabled}
            className="h-4 w-4 border-[color:var(--border)] text-sky-600"
          />
          Yes
        </label>
        <label
          className={cn(
            "flex items-center gap-2 text-sm font-medium text-[color:var(--text)]",
            disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer",
          )}
        >
          <input
            type="radio"
            name="willingToTravel"
            value="No"
            checked={willing === "No"}
            onChange={() => {
              setWilling("No");
              setLocations([]);
            }}
            disabled={disabled}
            className="h-4 w-4 border-[color:var(--border)] text-sky-600"
          />
          No
        </label>
      </div>
      {willing === "Yes" ? (
        <div className="rounded-lg border border-dashed border-sky-200 bg-sky-50/50 p-3">
          <div className="text-xs font-medium uppercase tracking-wide text-[color:var(--text-muted)]">
            Where can you travel?
          </div>
          <p className="mt-1 text-xs text-[color:var(--text-muted)]">
            Add regions or cities (e.g. Klang Valley, Penang).
          </p>
          <div className="mt-3">
            {locations.map((t) => (
              <input type="hidden" key={t} name="travelLocations" value={t} />
            ))}
            <TagListEditor
              tags={locations}
              onChange={setLocations}
              placeholder="Add a location and press Enter"
              disabled={disabled}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
