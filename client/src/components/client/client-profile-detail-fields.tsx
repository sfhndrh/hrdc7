"use client";

import {
  OTHER_OPTION,
  profileDetailFields,
  type ClientProfileData,
  type ClientProfileType,
  type ProfileFieldDef,
} from "@/lib/client-profile";
import {
  RegisterField,
  RegisterFieldGrid,
  registerInputClass,
  registerTextareaClass,
} from "@/components/register/register-form-primitives";
import { TagListEditor } from "@/components/register/trainer-field-widgets";
import { MALAYSIA_STATES } from "@/lib/malaysia-states";

function SelectWithOther({
  field,
  htmlId,
  selected,
  otherValue,
  onSelectedChange,
  onOtherChange,
}: {
  field: ProfileFieldDef;
  htmlId: string;
  selected: string;
  otherValue: string;
  onSelectedChange: (value: string) => void;
  onOtherChange: (value: string) => void;
}) {
  const showOther = selected === OTHER_OPTION;
  const otherId = field.otherKey ? `${htmlId}-other` : undefined;

  return (
    <div className="space-y-2">
      <select
        id={htmlId}
        required={field.required && !showOther}
        value={selected}
        onChange={(e) => onSelectedChange(e.target.value)}
        className={registerInputClass}
      >
        <option value="">Select</option>
        {(field.options ?? []).map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      {showOther && field.otherKey ? (
        <input
          id={otherId}
          type="text"
          required={field.required}
          value={otherValue}
          placeholder={`Specify ${field.label.toLowerCase()}`}
          onChange={(e) => onOtherChange(e.target.value)}
          className={registerInputClass}
          aria-label={`${field.label} (other)`}
        />
      ) : null}
    </div>
  );
}

export function ClientProfileDetailFields({
  profileType,
  profileData,
  onChange,
  idPrefix = "co",
}: {
  profileType: ClientProfileType;
  profileData: ClientProfileData;
  onChange: (next: ClientProfileData) => void;
  idPrefix?: string;
}) {
  const fields = profileDetailFields(profileType);

  function set<K extends keyof ClientProfileData>(key: K, value: ClientProfileData[K]) {
    onChange({ ...profileData, [key]: value });
  }

  return (
    <RegisterFieldGrid>
      {fields.map((field) => {
        const key = field.key;
        const htmlId = `${idPrefix}-${String(key)}`;
        const value =
          key === "preferredTrainingCategories"
            ? profileData.preferredTrainingCategories
            : (profileData[key as keyof ClientProfileData] as string | undefined) ?? "";

        if (field.type === "select" && field.options) {
          const otherKey = field.otherKey;
          const otherValue = otherKey
            ? ((profileData[otherKey] as string | undefined) ?? "")
            : "";
          return (
            <RegisterField
              key={String(key)}
              label={field.label}
              htmlFor={htmlId}
              required={field.required}
              wide={field.wide}
            >
              <SelectWithOther
                field={field}
                htmlId={htmlId}
                selected={typeof value === "string" ? value : ""}
                otherValue={otherValue}
                onSelectedChange={(v) => {
                  const next: ClientProfileData = { ...profileData, [key]: v };
                  if (v !== OTHER_OPTION && otherKey) {
                    next[otherKey] = "";
                  }
                  onChange(next);
                }}
                onOtherChange={(v) => {
                  if (otherKey) onChange({ ...profileData, [otherKey]: v });
                }}
              />
            </RegisterField>
          );
        }

        if (field.type === "tags" && key === "preferredTrainingCategories") {
          return (
            <RegisterField
              key={String(key)}
              label={field.label}
              required={field.required}
              wide={field.wide}
            >
              <TagListEditor
                tags={profileData.preferredTrainingCategories ?? []}
                onChange={(tags) => set("preferredTrainingCategories", tags)}
                placeholder={field.placeholder ?? "Add category and press Enter"}
              />
            </RegisterField>
          );
        }

        if (field.type === "textarea") {
          return (
            <RegisterField
              key={String(key)}
              label={field.label}
              htmlFor={htmlId}
              required={field.required}
              wide={field.wide}
            >
              <textarea
                id={htmlId}
                value={typeof value === "string" ? value : ""}
                placeholder={field.placeholder}
                onChange={(e) => set(key as keyof ClientProfileData, e.target.value as never)}
                className={registerTextareaClass}
              />
            </RegisterField>
          );
        }

        if (field.type === "select-yes-no") {
          return (
            <RegisterField
              key={String(key)}
              label={field.label}
              htmlFor={htmlId}
              required={field.required}
            >
              <select
                id={htmlId}
                required={field.required}
                value={typeof value === "string" ? value : ""}
                onChange={(e) =>
                  set("hrdcRegistered", e.target.value as ClientProfileData["hrdcRegistered"])
                }
                className={registerInputClass}
              >
                <option value="">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </RegisterField>
          );
        }

        if (field.type === "state" || key === "state") {
          return (
            <RegisterField
              key={String(key)}
              label={field.label}
              htmlFor={htmlId}
              required={field.required}
            >
              <select
                id={htmlId}
                required={field.required}
                value={typeof value === "string" ? value : ""}
                onChange={(e) => set("state", e.target.value)}
                className={registerInputClass}
              >
                <option value="">Select state</option>
                {MALAYSIA_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </RegisterField>
          );
        }

        return (
          <RegisterField
            key={String(key)}
            label={field.label}
            htmlFor={htmlId}
            required={field.required}
            wide={field.wide}
          >
            <input
              id={htmlId}
              type={field.type === "url" ? "url" : "text"}
              required={field.required}
              value={typeof value === "string" ? value : ""}
              placeholder={field.placeholder}
              onChange={(e) => set(key as keyof ClientProfileData, e.target.value as never)}
              className={registerInputClass}
            />
          </RegisterField>
        );
      })}
    </RegisterFieldGrid>
  );
}
