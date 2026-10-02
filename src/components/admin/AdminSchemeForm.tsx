"use client";

import { useState } from "react";
import { X, Save, AlertCircle } from "lucide-react";

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
    deadline?: string | null;
    stateId?: string | null;
    officialApplyUrl?: string;
    isPublished?: boolean;
    isArchived?: boolean;
  };
  organizations: Array<{ id: string; name: string }>;
  states: Array<{ id: string; name: string }>;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AdminSchemeForm({
  initialData,
  organizations,
  states,
  isOpen,
  onClose,
  onSuccess,
}: AdminSchemeFormProps) {
  const isEditing = Boolean(initialData?.id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: initialData?.name ?? "",
    slug: initialData?.slug ?? "",
    departmentId: initialData?.departmentId ?? (organizations[0]?.id || ""),
    whoCanBenefit: initialData?.whoCanBenefit ?? "",
    eligibility: initialData?.eligibility ?? "",
    benefits: initialData?.benefits ?? "",
    requiredDocuments: initialData?.requiredDocuments ?? "",
    applicationProcess: initialData?.applicationProcess ?? "",
    deadline: initialData?.deadline ? initialData.deadline.substring(0, 10) : "",
    stateId: initialData?.stateId ?? "",
    officialApplyUrl: initialData?.officialApplyUrl ?? "",
    officialGuidelineUrl: "",
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
        departmentId: formData.departmentId,
        whoCanBenefit: formData.whoCanBenefit.trim(),
        eligibility: formData.eligibility.trim(),
        benefits: formData.benefits.trim(),
        requiredDocuments: formData.requiredDocuments.trim(),
        applicationProcess: formData.applicationProcess.trim(),
        stateId: formData.stateId || null,
        officialApplyUrl: formData.officialApplyUrl.trim(),
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
        isPublished: formData.isPublished,
      };

      if (!isEditing) {
        if (!formData.officialGuidelineUrl) {
          setError("At least one official ministry guideline URL is required.");
          setLoading(false);
          return;
        }
        payload.sources = [
          {
            url: formData.officialGuidelineUrl.trim(),
            type: "OFFICIAL_GUIDELINE",
            title: `${formData.name} Official Ministry Guidelines`,
          },
        ];
      }

      const url = isEditing ? `/api/admin/schemes/${initialData!.id}` : "/api/admin/schemes";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to save scheme record");
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save scheme");
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
              {isEditing ? "Edit Citizen Scheme" : "Create New Verified Public Scheme"}
            </h3>
            <p className="text-xs text-slate-500">
              {isEditing ? "Update scheme benefits, eligibility and deadlines" : "Add official ministry backed public scheme"}
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
              <label className="block font-medium text-slate-700 dark:text-slate-300">Scheme Name *</label>
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
                placeholder="e.g. PM Kisan Samman Nidhi"
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
                placeholder="e.g. pm-kisan"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300">Administering Ministry / Dept *</label>
              <select
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
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
                <option value="">Central Scheme</option>
                {states.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300">Target Beneficiary Summary *</label>
            <input
              type="text"
              required
              value={formData.whoCanBenefit}
              onChange={(e) => setFormData({ ...formData, whoCanBenefit: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-950"
              placeholder="e.g. Small and marginal farmer families with cultivable landholding"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300">Detailed Eligibility Criteria *</label>
            <textarea
              rows={2}
              required
              value={formData.eligibility}
              onChange={(e) => setFormData({ ...formData, eligibility: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-950"
              placeholder="Eligibility conditions..."
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300">Benefits Provided *</label>
            <textarea
              rows={2}
              required
              value={formData.benefits}
              onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-950"
              placeholder="Financial assistance of ₹6,000 per year..."
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300">Required Documents *</label>
              <input
                type="text"
                required
                value={formData.requiredDocuments}
                onChange={(e) => setFormData({ ...formData, requiredDocuments: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-950"
                placeholder="Aadhaar, Land records, Bank account details"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300">Application Process *</label>
              <input
                type="text"
                required
                value={formData.applicationProcess}
                onChange={(e) => setFormData({ ...formData, applicationProcess: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-950"
                placeholder="Online via portal or Common Service Centres (CSCs)"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300">Official Portal / Apply URL *</label>
              <input
                type="url"
                required
                value={formData.officialApplyUrl}
                onChange={(e) => setFormData({ ...formData, officialApplyUrl: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-950"
                placeholder="https://pmkisan.gov.in"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300">Application Deadline (if applicable)</label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-950"
              />
            </div>
          </div>

          {!isEditing && (
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300">
                Official Guidelines URL * (Anti-Fabrication Rule)
              </label>
              <input
                type="url"
                required
                value={formData.officialGuidelineUrl}
                onChange={(e) => setFormData({ ...formData, officialGuidelineUrl: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-950"
                placeholder="https://pmkisan.gov.in/guidelines.pdf"
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
                {loading ? "Saving..." : isEditing ? "Save Changes" : "Create Scheme"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
