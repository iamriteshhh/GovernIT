"use client";

import { useState } from "react";
import { X, Save, AlertCircle } from "lucide-react";

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

export function AdminExamForm({
  initialData,
  organizations,
  states,
  isOpen,
  onClose,
  onSuccess,
}: AdminExamFormProps) {
  const isEditing = Boolean(initialData?.id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: initialData?.name ?? "",
    slug: initialData?.slug ?? "",
    conductingBodyId: initialData?.conductingBodyId ?? (organizations[0]?.id || ""),
    department: initialData?.department ?? "",
    educationEligibility: initialData?.educationEligibility ?? "",
    ageEligibility: initialData?.ageEligibility ?? "",
    stateId: initialData?.stateId ?? "",
    examDate: initialData?.examDate ? initialData.examDate.substring(0, 10) : "",
    admitCardDate: initialData?.admitCardDate ? initialData.admitCardDate.substring(0, 10) : "",
    resultStatus: initialData?.resultStatus ?? "",
    applicationFee: initialData?.applicationFee ?? "",
    vacancyCount: initialData?.vacancyCount ? String(initialData.vacancyCount) : "",
    officialApplyUrl: initialData?.officialApplyUrl ?? "",
    opensAt: initialData?.opensAt ? initialData.opensAt.substring(0, 10) : new Date().toISOString().substring(0, 10),
    closesAt: initialData?.closesAt ? initialData.closesAt.substring(0, 10) : "",
    officialNotificationUrl: "",
    isPublished: initialData?.isPublished ?? true,
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload: Record<string, unknown> = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        conductingBodyId: formData.conductingBodyId,
        department: formData.department.trim() || undefined,
        educationEligibility: formData.educationEligibility.trim(),
        ageEligibility: formData.ageEligibility.trim(),
        stateId: formData.stateId || null,
        examDate: formData.examDate ? new Date(formData.examDate).toISOString() : null,
        admitCardDate: formData.admitCardDate ? new Date(formData.admitCardDate).toISOString() : null,
        resultStatus: formData.resultStatus.trim() || undefined,
        applicationFee: formData.applicationFee.trim() || undefined,
        vacancyCount: formData.vacancyCount ? Number(formData.vacancyCount) : null,
        officialApplyUrl: formData.officialApplyUrl.trim(),
        opensAt: new Date(formData.opensAt).toISOString(),
        closesAt: formData.closesAt ? new Date(formData.closesAt).toISOString() : null,
        isPublished: formData.isPublished,
      };

      if (!isEditing) {
        if (!formData.officialNotificationUrl) {
          setError("At least one official gazette / notification source URL is required.");
          setLoading(false);
          return;
        }
        payload.sources = [
          {
            url: formData.officialNotificationUrl.trim(),
            type: "OFFICIAL_NOTIFICATION",
            title: `${formData.name} Official Gazette Notification`,
          },
        ];
      }

      const url = isEditing ? `/api/admin/exams/${initialData!.id}` : "/api/admin/exams";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to save exam record");
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save exam");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {isEditing ? "Edit Government Exam" : "Create New Verified Exam"}
            </h3>
            <p className="text-xs text-slate-500">
              {isEditing ? "Update official timelines and details" : "Add official gazette backed recruitment"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300">Exam Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    name: e.target.value,
                    slug: isEditing ? formData.slug : e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
                  });
                }}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-950"
                placeholder="e.g. UPSC Civil Services Exam 2026"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300">Slug (URL identifier) *</label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-950"
                placeholder="e.g. upsc-cse-2026"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300">Conducting Body *</label>
              <select
                value={formData.conductingBodyId}
                onChange={(e) => setFormData({ ...formData, conductingBodyId: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-950"
              >
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300">State / Central Classification</label>
              <select
                value={formData.stateId}
                onChange={(e) => setFormData({ ...formData, stateId: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-950"
              >
                <option value="">Central / All-India</option>
                {states.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300">Education Eligibility *</label>
              <input
                type="text"
                required
                value={formData.educationEligibility}
                onChange={(e) => setFormData({ ...formData, educationEligibility: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-950"
                placeholder="e.g. Bachelor's Degree in any discipline"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300">Age Eligibility *</label>
              <input
                type="text"
                required
                value={formData.ageEligibility}
                onChange={(e) => setFormData({ ...formData, ageEligibility: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-950"
                placeholder="e.g. 21 to 32 years"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300">Application Open Date *</label>
              <input
                type="date"
                required
                value={formData.opensAt}
                onChange={(e) => setFormData({ ...formData, opensAt: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-950"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300">Application Deadline</label>
              <input
                type="date"
                value={formData.closesAt}
                onChange={(e) => setFormData({ ...formData, closesAt: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-950"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300">Exam Date</label>
              <input
                type="date"
                value={formData.examDate}
                onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-950"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300">Official Apply Portal URL *</label>
              <input
                type="url"
                required
                value={formData.officialApplyUrl}
                onChange={(e) => setFormData({ ...formData, officialApplyUrl: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-950"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300">Vacancy Count</label>
              <input
                type="number"
                value={formData.vacancyCount}
                onChange={(e) => setFormData({ ...formData, vacancyCount: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-950"
                placeholder="e.g. 1056"
              />
            </div>
          </div>

          {!isEditing && (
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300">
                Official Gazette / Notification URL * (Anti-Fabrication Rule)
              </label>
              <input
                type="url"
                required
                value={formData.officialNotificationUrl}
                onChange={(e) => setFormData({ ...formData, officialNotificationUrl: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-950"
                placeholder="https://upsc.gov.in/..."
              />
            </div>
          )}

          <div className="flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPublished}
                onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Publish immediately on public site
              </span>
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
              >
                <Save className="h-3.5 w-3.5" />
                {loading ? "Saving..." : isEditing ? "Save Changes" : "Create Exam"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
