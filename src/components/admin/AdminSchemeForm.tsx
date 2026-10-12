"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import {
  CheckField,
  describeApiError,
  joinIst,
  LIFECYCLE_OPTIONS,
  LINK_KIND_OPTIONS,
  Modal,
  SelectField,
  splitIst,
  TextArea,
  TextField,
} from "./FormKit";

interface AdminSchemeFormProps {
  initialData?: {
    id?: string;
    name?: string;
    slug?: string;
    departmentId?: string;
    whoCanBenefit?: string;
    eligibility?: string;
    benefits?: string;
    requiredDocuments?: string;
    applicationProcess?: string;
    opensAt?: string | null;
    closesAt?: string | null;
    isRolling?: boolean;
    programEndsAt?: string | null;
    stateId?: string | null;
    officialApplyUrl?: string;
    applyLinkKind?: string;
    lifecycle?: string;
    lifecycleNote?: string | null;
    isPublished?: boolean;
    isArchived?: boolean;
  };
  organizations: Array<{ id: string; name: string }>;
  states: Array<{ id: string; name: string }>;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AdminSchemeForm({ initialData, organizations, states, isOpen, onClose, onSuccess }: AdminSchemeFormProps) {
  const isEditing = Boolean(initialData?.id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const closes = splitIst(initialData?.closesAt);

  const [f, setF] = useState({
    name: initialData?.name ?? "",
    slug: initialData?.slug ?? "",
    departmentId: initialData?.departmentId ?? (organizations[0]?.id || ""),
    whoCanBenefit: initialData?.whoCanBenefit ?? "",
    eligibility: initialData?.eligibility ?? "",
    benefits: initialData?.benefits ?? "",
    requiredDocuments: initialData?.requiredDocuments ?? "",
    applicationProcess: initialData?.applicationProcess ?? "",
    opensDate: splitIst(initialData?.opensAt).date,
    closesDate: closes.date,
    closesTime: closes.time || "23:59",
    isRolling: initialData?.isRolling ?? false,
    programEndsDate: splitIst(initialData?.programEndsAt).date,
    stateId: initialData?.stateId ?? "",
    officialApplyUrl: initialData?.officialApplyUrl ?? "",
    applyLinkKind: initialData?.applyLinkKind ?? "DEPARTMENT_SITE",
    lifecycle: initialData?.lifecycle ?? "ACTIVE",
    lifecycleNote: initialData?.lifecycleNote ?? "",
    officialGuidelineUrl: "",
    isPublished: initialData?.isPublished ?? false,
    isArchived: initialData?.isArchived ?? false,
    verifyNow: false,
    verificationNote: "",
  });
  const set = <K extends keyof typeof f>(k: K) => (v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload: Record<string, unknown> = {
        name: f.name.trim(),
        slug: f.slug.trim(),
        departmentId: f.departmentId,
        whoCanBenefit: f.whoCanBenefit.trim(),
        eligibility: f.eligibility.trim(),
        benefits: f.benefits.trim(),
        requiredDocuments: f.requiredDocuments.trim(),
        applicationProcess: f.applicationProcess.trim(),
        opensAt: f.opensDate || null,
        closesAt: f.isRolling ? null : joinIst(f.closesDate, f.closesTime),
        isRolling: f.isRolling,
        programEndsAt: f.programEndsDate || null,
        stateId: f.stateId || null,
        officialApplyUrl: f.officialApplyUrl.trim(),
        applyLinkKind: f.applyLinkKind,
        lifecycle: f.lifecycle,
        lifecycleNote: f.lifecycleNote.trim() || null,
        isPublished: f.isPublished,
        isArchived: f.isArchived,
        verificationNote: f.verifyNow ? f.verificationNote.trim() : undefined,
      };

      if (!isEditing) {
        delete payload.isPublished;
        delete payload.isArchived;
        payload.sources = [
          { url: f.officialGuidelineUrl.trim(), type: "OFFICIAL_GUIDELINE", title: `${f.name} official guidelines` },
        ];
      }

      const res = await fetch(isEditing ? `/api/admin/schemes/${initialData!.id}` : "/api/admin/schemes", {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(describeApiError(json));

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save scheme");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={isEditing ? "Edit scheme" : "Add scheme"}
      subtitle="All dates are Indian Standard Time. Enter only what the official guidelines state."
      error={error}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField label="Scheme name" required value={f.name} onChange={set("name")} />
          <TextField label="Slug (URL identifier)" required value={f.slug} onChange={set("slug")} hint="Lowercase letters, numbers and hyphens" />
          <SelectField
            label="Ministry / department"
            required
            value={f.departmentId}
            onChange={set("departmentId")}
            options={organizations.map((o) => ({ value: o.id, label: o.name }))}
          />
          <SelectField
            label="Location"
            value={f.stateId}
            onChange={set("stateId")}
            options={[{ value: "", label: "Central (all India)" }, ...states.map((s) => ({ value: s.id, label: s.name }))]}
          />
        </div>

        <TextArea label="Who can benefit" required value={f.whoCanBenefit} onChange={set("whoCanBenefit")} />
        <TextArea label="Eligibility" required value={f.eligibility} onChange={set("eligibility")} />
        <TextArea label="Benefits" required value={f.benefits} onChange={set("benefits")} />
        <TextArea label="Documents needed" required value={f.requiredDocuments} onChange={set("requiredDocuments")} />
        <TextArea label="How to apply" required value={f.applicationProcess} onChange={set("applicationProcess")} rows={4} />

        <fieldset className="grid grid-cols-1 gap-4 rounded-2xl border border-line p-4 sm:grid-cols-3">
          <legend className="px-1 text-base font-bold text-fg">Application window (IST)</legend>
          <div className="sm:col-span-3">
            <CheckField label="Continuous enrolment: officially no fixed last date" checked={f.isRolling} onChange={set("isRolling")} />
          </div>
          <TextField label="Applications open" type="date" value={f.opensDate} onChange={set("opensDate")} hint="Leave empty if not published" />
          {!f.isRolling && (
            <>
              <TextField label="Last date" type="date" value={f.closesDate} onChange={set("closesDate")} />
              <TextField label="Last time" type="time" value={f.closesTime} onChange={set("closesTime")} hint="Default 11:59 pm" />
            </>
          )}
        </fieldset>

        <TextField
          label="Programme end date (not the application deadline)"
          type="date"
          value={f.programEndsDate}
          onChange={set("programEndsDate")}
          hint="Only if the scheme itself officially ends"
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField label="Official URL" type="url" required value={f.officialApplyUrl} onChange={set("officialApplyUrl")} />
          <SelectField
            label="What does this URL open?"
            value={f.applyLinkKind}
            onChange={set("applyLinkKind")}
            options={LINK_KIND_OPTIONS}
            hint="Controls the button label. Never mark a homepage as a direct form."
          />
        </div>
        {!isEditing && (
          <TextField
            label="Official guidelines URL"
            type="url"
            required
            value={f.officialGuidelineUrl}
            onChange={set("officialGuidelineUrl")}
            hint="The guideline document the details come from (https)"
          />
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField label="Lifecycle" value={f.lifecycle} onChange={set("lifecycle")} options={LIFECYCLE_OPTIONS} />
          <TextField label="Lifecycle note" value={f.lifecycleNote} onChange={set("lifecycleNote")} />
        </div>

        <div className="rounded-2xl border border-line p-4">
          <CheckField label="I checked these details against the official source just now" checked={f.verifyNow} onChange={set("verifyNow")} />
          {f.verifyNow && (
            <TextField label="What did you check?" required value={f.verificationNote} onChange={set("verificationNote")} hint="Recorded with your name in the verification history" />
          )}
        </div>

        {isEditing && (
          <div className="flex flex-wrap gap-6">
            <CheckField label="Published on the public site" checked={f.isPublished} onChange={set("isPublished")} />
            <CheckField label="Archived (kept for reference)" checked={f.isArchived} onChange={set("isArchived")} />
          </div>
        )}

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line pt-4">
          <button type="button" onClick={onClose} className="min-h-11 rounded-xl border border-line px-5 text-base font-semibold text-fg hover:bg-surface-muted">
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 text-base font-semibold text-primary-fg hover:bg-primary-hover disabled:opacity-50"
          >
            <Save className="h-4 w-4" aria-hidden />
            {loading ? "Saving…" : isEditing ? "Save changes" : "Create as draft"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
