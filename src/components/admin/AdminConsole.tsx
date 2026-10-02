"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ShieldCheck, 
  Database, 
  FileText, 
  CheckCircle, 
  LogOut, 
  RefreshCw,
  Building2,
  Plus,
  Edit2,
  Eye,
  EyeOff,
  Archive,
  Search
} from "lucide-react";
import { formatDateIST } from "@/lib/dates";
import { AdminExamForm } from "./AdminExamForm";
import { AdminSchemeForm } from "./AdminSchemeForm";

interface AdminExamItem {
  id: string;
  name: string;
  slug: string;
  conductingBodyId: string;
  conductingBody: string;
  department: string | null;
  educationEligibility: string;
  ageEligibility: string;
  stateId: string | null;
  stateName: string | null;
  examDate: string | null;
  admitCardDate: string | null;
  resultStatus: string | null;
  applicationFee: string | null;
  vacancyCount: number | null;
  officialApplyUrl: string;
  opensAt: string | null;
  closesAt: string | null;
  lastVerifiedAt: string | null;
  lastVerifiedBy: string | null;
  isPublished: boolean;
  isArchived: boolean;
}

interface AdminSchemeItem {
  id: string;
  name: string;
  slug: string;
  departmentId: string;
  department: string;
  whoCanBenefit: string;
  eligibility: string;
  benefits: string;
  requiredDocuments: string;
  applicationProcess: string;
  stateId: string | null;
  stateName: string | null;
  officialApplyUrl: string;
  deadline: string | null;
  lastVerifiedAt: string | null;
  lastVerifiedBy: string | null;
  isPublished: boolean;
  isArchived: boolean;
}

interface AdminConsoleProps {
  adminUsername: string;
  stats: {
    totalExams: number;
    totalSchemes: number;
    totalOrgs: number;
    totalVerifications: number;
  };
  exams: AdminExamItem[];
  schemes: AdminSchemeItem[];
  organizations: Array<{ id: string; name: string }>;
  states: Array<{ id: string; name: string }>;
  pagination: {
    search: string;
    currentTab: string;
    currentPage: number;
    pageSize: number;
    totalExamPages: number;
    totalSchemePages: number;
  };
}

export function AdminConsole({
  adminUsername,
  stats,
  exams,
  schemes,
  organizations,
  states,
  pagination,
}: AdminConsoleProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"exams" | "schemes">("exams");
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [verifiedMap, setVerifiedMap] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);

  // Form modals state
  const [examModalOpen, setExamModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<AdminExamItem | undefined>(undefined);

  const [schemeModalOpen, setSchemeModalOpen] = useState(false);
  const [editingScheme, setEditingScheme] = useState<AdminSchemeItem | undefined>(undefined);

  const handleVerify = async (type: "exam" | "scheme", id: string, name: string) => {
    setVerifyingId(id);
    setMessage(null);

    try {
      const payload = type === "exam"
        ? { examId: id, notes: `Re-verified ${name} via admin console` }
        : { schemeId: id, notes: `Re-verified ${name} via admin console` };

      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setVerifiedMap((prev) => ({ ...prev, [id]: "Just now by " + adminUsername }));
        setMessage(`Successfully recorded fresh verification audit for "${name}".`);
        router.refresh();
      } else {
        setMessage(`Verification failed for "${name}".`);
      }
    } catch {
      setMessage("Network error during verification.");
    } finally {
      setVerifyingId(null);
    }
  };

  const handleTogglePublish = async (type: "exam" | "scheme", id: string, current: boolean, name: string) => {
    setActionLoadingId(id);
    setMessage(null);

    try {
      const url = type === "exam" ? `/api/admin/exams/${id}` : `/api/admin/schemes/${id}`;
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !current }),
      });

      if (res.ok) {
        setMessage(`"${name}" is now ${!current ? "Published" : "Unpublished"}.`);
        router.refresh();
      } else {
        setMessage("Failed to update publication status.");
      }
    } catch {
      setMessage("Network error updating status.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleArchive = async (type: "exam" | "scheme", id: string, current: boolean, name: string) => {
    setActionLoadingId(id);
    setMessage(null);

    try {
      const url = type === "exam" ? `/api/admin/exams/${id}` : `/api/admin/schemes/${id}`;
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: !current }),
      });

      if (res.ok) {
        setMessage(`"${name}" is now ${!current ? "Archived" : "Restored from archive"}.`);
        router.refresh();
      } else {
        setMessage("Failed to update archive status.");
      }
    } catch {
      setMessage("Network error updating status.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <div className="space-y-8">
      {/* Top Banner with Active Admin Identity and Logout */}
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Authenticated Session: <span className="text-emerald-700 dark:text-emerald-400">@{adminUsername}</span>
            </h2>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Per-admin audit trail active. All verification timestamps and record mutations are attributed to your identity.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setEditingExam(undefined);
              setExamModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
          >
            <Plus className="h-3.5 w-3.5" />
            New Exam
          </button>

          <button
            onClick={() => {
              setEditingScheme(undefined);
              setSchemeModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
          >
            <Plus className="h-3.5 w-3.5" />
            New Scheme
          </button>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <LogOut className="h-3.5 w-3.5 text-slate-500" />
            Sign Out
          </button>
        </div>
      </div>

      {message && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
          <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Published Exams</span>
            <FileText className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          </div>
          <p className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white">{stats.totalExams}</p>
          <p className="mt-1 text-[11px] text-slate-500">100% Gazette backed</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Published Schemes</span>
            <Database className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          </div>
          <p className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white">{stats.totalSchemes}</p>
          <p className="mt-1 text-[11px] text-slate-500">100% Ministry backed</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Conducting Bodies</span>
            <Building2 className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          </div>
          <p className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white">{stats.totalOrgs}</p>
          <p className="mt-1 text-[11px] text-slate-400">Central & State entities</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Verification Audits</span>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white">{stats.totalVerifications}</p>
          <p className="mt-1 text-[11px] text-slate-400">Total audits recorded</p>
        </div>
      </div>

      {/* Tabs and Search Header */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("exams")}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
                activeTab === "exams"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              Government Exams ({exams.length})
            </button>
            <button
              onClick={() => setActiveTab("schemes")}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
                activeTab === "schemes"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              Citizen Schemes ({schemes.length})
            </button>
          </div>

          {/* Search form */}
          <form method="GET" className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              name="search"
              defaultValue={pagination.search}
              placeholder="Search all records..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </form>
        </div>

        {/* Exams Table */}
        {activeTab === "exams" && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 text-slate-400 uppercase tracking-wider dark:border-slate-800">
                <tr>
                  <th className="py-3 px-3">Opportunity</th>
                  <th className="py-3 px-3">Conducting Body</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Last Verified</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {exams.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-slate-900 dark:text-white">{e.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{e.slug}</div>
                    </td>
                    <td className="py-3.5 px-3 text-slate-600 dark:text-slate-400">{e.conductingBody}</td>
                    <td className="py-3.5 px-3">
                      <div className="flex flex-wrap gap-1">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                            e.isPublished
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                          }`}
                        >
                          {e.isPublished ? "Live" : "Draft"}
                        </span>
                        {e.isArchived && (
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            Archived
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-slate-600 dark:text-slate-400">
                      {verifiedMap[e.id] ?? (e.lastVerifiedAt ? formatDateIST(e.lastVerifiedAt) : "Never")}
                      {e.lastVerifiedBy && (
                        <div className="text-[10px] text-slate-400">by @{e.lastVerifiedBy}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingExam(e);
                            setExamModalOpen(true);
                          }}
                          className="rounded-lg border border-slate-200 p-1 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                          title="Edit Exam"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleTogglePublish("exam", e.id, e.isPublished, e.name)}
                          disabled={actionLoadingId === e.id}
                          className="rounded-lg border border-slate-200 p-1 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                          title={e.isPublished ? "Unpublish" : "Publish"}
                        >
                          {e.isPublished ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          onClick={() => handleToggleArchive("exam", e.id, e.isArchived, e.name)}
                          disabled={actionLoadingId === e.id}
                          className="rounded-lg border border-slate-200 p-1 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                          title={e.isArchived ? "Unarchive" : "Archive"}
                        >
                          <Archive className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleVerify("exam", e.id, e.name)}
                          disabled={verifyingId === e.id}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300"
                        >
                          <RefreshCw className={`h-3 w-3 ${verifyingId === e.id ? "animate-spin" : ""}`} />
                          Verify
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Schemes Table */}
        {activeTab === "schemes" && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 text-slate-400 uppercase tracking-wider dark:border-slate-800">
                <tr>
                  <th className="py-3 px-3">Scheme Name</th>
                  <th className="py-3 px-3">Ministry / Dept</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Last Verified</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {schemes.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-slate-900 dark:text-white">{s.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{s.slug}</div>
                    </td>
                    <td className="py-3.5 px-3 text-slate-600 dark:text-slate-400">{s.department}</td>
                    <td className="py-3.5 px-3">
                      <div className="flex flex-wrap gap-1">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                            s.isPublished
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                          }`}
                        >
                          {s.isPublished ? "Live" : "Draft"}
                        </span>
                        {s.isArchived && (
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            Archived
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-slate-600 dark:text-slate-400">
                      {verifiedMap[s.id] ?? (s.lastVerifiedAt ? formatDateIST(s.lastVerifiedAt) : "Never")}
                      {s.lastVerifiedBy && (
                        <div className="text-[10px] text-slate-400">by @{s.lastVerifiedBy}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingScheme(s);
                            setSchemeModalOpen(true);
                          }}
                          className="rounded-lg border border-slate-200 p-1 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                          title="Edit Scheme"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleTogglePublish("scheme", s.id, s.isPublished, s.name)}
                          disabled={actionLoadingId === s.id}
                          className="rounded-lg border border-slate-200 p-1 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                          title={s.isPublished ? "Unpublish" : "Publish"}
                        >
                          {s.isPublished ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          onClick={() => handleToggleArchive("scheme", s.id, s.isArchived, s.name)}
                          disabled={actionLoadingId === s.id}
                          className="rounded-lg border border-slate-200 p-1 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                          title={s.isArchived ? "Unarchive" : "Archive"}
                        >
                          <Archive className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleVerify("scheme", s.id, s.name)}
                          disabled={verifyingId === s.id}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300"
                        >
                          <RefreshCw className={`h-3 w-3 ${verifyingId === s.id ? "animate-spin" : ""}`} />
                          Verify
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <AdminExamForm
        isOpen={examModalOpen}
        initialData={editingExam}
        organizations={organizations}
        states={states}
        onClose={() => setExamModalOpen(false)}
        onSuccess={() => {
          setMessage(editingExam ? "Exam updated successfully." : "Exam created successfully.");
          router.refresh();
        }}
      />

      <AdminSchemeForm
        isOpen={schemeModalOpen}
        initialData={editingScheme}
        organizations={organizations}
        states={states}
        onClose={() => setSchemeModalOpen(false)}
        onSuccess={() => {
          setMessage(editingScheme ? "Scheme updated successfully." : "Scheme created successfully.");
          router.refresh();
        }}
      />
    </div>
  );
}
