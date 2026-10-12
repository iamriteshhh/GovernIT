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

interface AdminExamFormProps {
  initialData?: {
    id?: string;
    name?: string;
    slug?: string;
    conductingBodyId?: string;
    department?: string | null;
    educationEligibility?: string;
    ageEligibility?: string;
    stateId?: string | null;
    examDate?: string | null;
    admitCardDate?: string | null;
    resultStatus?: string | null;
    applicationFee?: string | null;
    vacancyCount?: number | null;
    officialApplyUrl?: string;
    applyLinkKind?: string;
    lifecycle?: string;
    lifecycleNote?: string | null;
    opensAt?: string | null;
    closesAt?: string | null;
    isPublished?: boolean;
    isArchived?: boolean;
  };
  organizations: Array<{ id: string; name: string }>;
  states: Array<{ id: string; name: string }>;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AdminExamForm({ initialData, organizations, states, isOpen, onClose, onSuccess }: AdminExamFormProps) {
  const isEditing = Boolean(initialData?.id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const opens = splitIst(initialData?.opensAt);
  const closes = splitIst(initialData?.closesAt);

  const [f, setF] = useState({
    name: initialData?.name ?? "",
    slug: initialData?.slug ?? "",
    conductingBodyId: initialData?.conductingBodyId ?? (organizations[0]?.id || ""),
    department: initialData?.department ?? "",
    educationEligibility: initialData?.educationEligibility ?? "",
    ageEligibility: initialData?.ageEligibility ?? "",
    stateId: initialData?.stateId ?? "",
    examDate: splitIst(initialData?.examDate).date,
    admitCardDate: splitIst(initialData?.admitCardDate).date,
    resultStatus: initialData?.resultStatus ?? "",
    applicationFee: initialData?.applicationFee ?? "",
    vacancyCount: initialData?.vacancyCount ? String(initialData.vacancyCount) : "",
    officialApplyUrl: initialData?.officialApplyUrl ?? "",
    applyLinkKind: initialData?.applyLinkKind ?? "APPLICATION_PORTAL",
    lifecycle: initialData?.lifecycle ?? "ACTIVE",
    lifecycleNote: initialData?.lifecycleNote ?? "",
    opensDate: opens.date,
    closesDate: closes.date,
    closesTime: closes.time || "23:59",
    officialNotificationUrl: "",
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
        conductingBodyId: f.conductingBodyId,
        department: f.department.trim() || null,
        educationEligibility: f.educationEligibility.trim(),
        ageEligibility: f.ageEligibility.trim(),
        stateId: f.stateId || null,
        examDate: f.examDate || null,
        admitCardDate: f.admitCardDate || null,
        resultStatus: f.resultStatus.trim() || null,
        applicationFee: f.applicationFee.trim() || null,
        vacancyCount: f.vacancyCount ? Number(f.vacancyCount) : null,
        officialApplyUrl: f.officialApplyUrl.trim(),
        applyLinkKind: f.applyLinkKind,
        lifecycle: f.lifecycle,
        lifecycleNote: f.lifecycleNote.trim() || null,
        opensAt: f.opensDate || null,
        closesAt: joinIst(f.closesDate, f.closesTime),
        isPublished: f.isPublished,
        isArchived: f.isArchived,
        verificationNote: f.verifyNow ? f.verificationNote.trim() : undefined,
      };

      if (!isEditing) {
        delete payload.isPublished;
        delete payload.isArchived;
        payload.sources = [
          { url: f.officialNotificationUrl.trim(), type: "OFFICIAL_NOTIFICATION", title: `${f.name} official notification` },
        ];
      }

      const res = await fetch(isEditing ? `/api/admin/exams/${initialData!.id}` : "/api/admin/exams", {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(describeApiError(json));

      // A newly created exam starts unpublished; publish after review from the table.
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save exam");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={isEditing ? "Edit exam" : "Add exam"}
      subtitle="All dates are Indian Standard Time. Enter only what the official notification states."
      error={error}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField label="Exam name" required value={f.name} onChange={set("name")} />
          <TextField label="Slug (URL identifier)" required value={f.slug} onChange={set("slug")} hint="Lowercase letters, numbers and hyphens" />
          <SelectField
            label="Conducting body"
            required
            value={f.conductingBodyId}
            onChange={set("conductingBodyId")}
            options={organizations.map((o) => ({ value: o.id, label: o.name }))}
          />
          <SelectField
            label="Location"
            value={f.stateId}
            onChange={set("stateId")}
            options={[{ value: "", label: "Central (all India)" }, ...states.map((s) => ({ value: s.id, label: s.name }))]}
          />
          <TextField label="Department / services" value={f.department} onChange={set("department")} />
          <TextField label="Application fee" value={f.applicationFee} onChange={set("applicationFee")} />
        </div>

        <TextArea label="Education eligibility" required value={f.educationEligibility} onChange={set("educationEligibility")} />
        <TextArea label="Age eligibility" required value={f.ageEligibility} onChange={set("ageEligibility")} />

        <fieldset className="grid grid-cols-1 gap-4 rounded-2xl border border-line p-4 sm:grid-cols-3">
          <legend className="px-1 text-base font-bold text-fg">Application window (IST)</legend>
          <TextField label="Registration opens" type="date" value={f.opensDate} onChange={set("opensDate")} hint="Leave empty if not published" />
          <TextField label="Last date" type="date" value={f.closesDate} onChange={set("closesDate")} />
          <TextField label="Last time" type="time" value={f.closesTime} onChange={set("closesTime")} hint="Default 11:59 pm" />
        </fieldset>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <TextField label="Exam date" type="date" value={f.examDate} onChange={set("examDate")} />
          <TextField label="Admit card date" type="date" value={f.admitCardDate} onChange={set("admitCardDate")} />
          <TextField label="Vacancies" type="number" value={f.vacancyCount} onChange={set("vacancyCount")} />
        </div>
        <TextField label="Result status" value={f.resultStatus} onChange={set("resultStatus")} hint='Use "Result declared" only after the official result is out' />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField label="Official application URL" type="url" required value={f.officialApplyUrl} onChange={set("officialApplyUrl")} />
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
            label="Official notification URL"
            type="url"
            required
            value={f.officialNotificationUrl}
            onChange={set("officialNotificationUrl")}
            hint="The notice PDF or page the dates come from (https)"
          />
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField label="Lifecycle" value={f.lifecycle} onChange={set("lifecycle")} options={LIFECYCLE_OPTIONS} />
          <TextField label="Lifecycle note" value={f.lifecycleNote} onChange={set("lifecycleNote")} hint="E.g. reason and official notice number" />
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
