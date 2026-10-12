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
  applyLinkKind: string;
  lifecycle: string;
  lifecycleNote: string | null;
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
  applyLinkKind: string;
  lifecycle: string;
  lifecycleNote: string | null;
  opensAt: string | null;
  closesAt: string | null;
  isRolling: boolean;
  programEndsAt: string | null;
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
    pendingReviews: number;
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
    // Verification must describe real evidence; a bare click is not a check.
    const notes = window.prompt(
      `What did you confirm for "${name}" on the official source? (e.g. "Last date 05.11.2026 matches notification 11/2026")`
    );
    if (!notes || notes.trim().length < 5) {
      setMessage("Verification not recorded: describe what you checked (at least 5 characters).");
      return;
    }
    setVerifyingId(id);
    setMessage(null);

    try {
      const payload = type === "exam" ? { examId: id, notes: notes.trim() } : { schemeId: id, notes: notes.trim() };

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
      <div className="flex flex-col gap-4 rounded-3xl border border-line bg-surface p-6 shadow-card sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-success" />
            <h2 className="text-xl font-bold tracking-tight text-fg">
              Authenticated Session: <span className="text-success">@{adminUsername}</span>
            </h2>
          </div>
          <p className="mt-1 text-xs text-muted">
            Every change and verification you make is recorded in the audit log under your name.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setEditingExam(undefined);
              setExamModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary min-h-11 px-3.5 text-sm font-semibold text-white shadow-card hover:bg-primary-hover"
          >
            <Plus className="h-3.5 w-3.5" />
            New Exam
          </button>

          <button
            onClick={() => {
              setEditingScheme(undefined);
              setSchemeModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary min-h-11 px-3.5 text-sm font-semibold text-white shadow-card hover:bg-primary-hover"
          >
            <Plus className="h-3.5 w-3.5" />
            New Scheme
          </button>

          <a
            href="/admin/sources"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-line bg-surface px-3.5 text-sm font-semibold text-fg hover:bg-surface-muted"
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
            Sources &amp; review queue
          </a>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface min-h-11 px-3.5 text-sm font-semibold text-muted shadow-card hover:bg-surface-muted"
          >
            <LogOut className="h-3.5 w-3.5 text-muted" />
            Sign Out
          </button>
        </div>
      </div>

      {message && (
        <div className="flex items-center gap-2 rounded-2xl border border-success-line bg-success-bg p-4 text-xs font-semibold text-success">
          <CheckCircle className="h-4 w-4 shrink-0 text-success" />
          <span>{message}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Published Exams</span>
            <FileText className="h-4 w-4 text-muted" />
          </div>
          <p className="mt-3 text-3xl font-extrabold text-fg">{stats.totalExams}</p>
          <p className="mt-1 text-sm text-muted">Live on the public site</p>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Published Schemes</span>
            <Database className="h-4 w-4 text-muted" />
          </div>
          <p className="mt-3 text-3xl font-extrabold text-fg">{stats.totalSchemes}</p>
          <p className="mt-1 text-sm text-muted">Live on the public site</p>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Pending reviews</span>
            <Building2 className="h-4 w-4 text-muted" />
          </div>
          <p className="mt-3 text-3xl font-extrabold text-fg">{stats.pendingReviews}</p>
          <a href="/admin/sources" className="mt-1 inline-block text-sm font-semibold text-link underline">Open review queue</a>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Verification Audits</span>
            <ShieldCheck className="h-4 w-4 text-success" />
          </div>
          <p className="mt-3 text-3xl font-extrabold text-fg">{stats.totalVerifications}</p>
          <p className="mt-1 text-sm text-muted">Total audits recorded</p>
        </div>
      </div>

      {/* Tabs and Search Header */}
      <div className="rounded-3xl border border-line bg-surface p-6 shadow-card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("exams")}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
                activeTab === "exams"
                  ? "bg-primary text-white"
                  : "bg-surface-muted text-muted hover:bg-surface-muted"
              }`}
            >
              Government Exams ({exams.length})
            </button>
            <button
              onClick={() => setActiveTab("schemes")}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
                activeTab === "schemes"
                  ? "bg-primary text-white"
                  : "bg-surface-muted text-muted hover:bg-surface-muted"
              }`}
            >
              Citizen Schemes ({schemes.length})
            </button>
          </div>

          {/* Search form */}
          <form method="GET" className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted" />
            <input
              type="text"
              name="search"
              defaultValue={pagination.search}
              placeholder="Search all records..."
              className="w-full rounded-xl border border-line bg-surface-muted py-1.5 pl-8 pr-3 text-xs text-fg placeholder:text-muted focus:bg-surface"
            />
          </form>
        </div>

        {/* Exams Table */}
        {activeTab === "exams" && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line text-muted uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3">Opportunity</th>
                  <th className="py-3 px-3">Conducting Body</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Last Verified</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {exams.map((e) => (
                  <tr key={e.id} className="hover:bg-surface-muted">
                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-fg">{e.name}</div>
                      <div className="text-xs text-muted font-mono">{e.slug}</div>
                    </td>
                    <td className="py-3.5 px-3 text-muted">{e.conductingBody}</td>
                    <td className="py-3.5 px-3">
                      <div className="flex flex-wrap gap-1">
                        <span
                          className={`rounded px-1.5 py-0.5 text-xs font-semibold ${
                            e.isPublished
                              ? "bg-success-bg text-success"
                              : "bg-urgent-bg text-urgent"
                          }`}
                        >
                          {e.isPublished ? "Live" : "Draft"}
                        </span>
                        {e.isArchived && (
                          <span className="rounded bg-surface-muted px-1.5 py-0.5 text-xs font-semibold text-muted">
                            Archived
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-muted">
                      {verifiedMap[e.id] ?? (e.lastVerifiedAt ? formatDateIST(e.lastVerifiedAt) : "Never")}
                      {e.lastVerifiedBy && (
                        <div className="text-xs text-muted">by @{e.lastVerifiedBy}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingExam(e);
                            setExamModalOpen(true);
                          }}
                          className="rounded-lg border border-line p-1 text-muted hover:bg-surface-muted"
                          title="Edit Exam"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleTogglePublish("exam", e.id, e.isPublished, e.name)}
                          disabled={actionLoadingId === e.id}
                          className="rounded-lg border border-line p-1 text-muted hover:bg-surface-muted"
                          title={e.isPublished ? "Unpublish" : "Publish"}
                        >
                          {e.isPublished ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          onClick={() => handleToggleArchive("exam", e.id, e.isArchived, e.name)}
                          disabled={actionLoadingId === e.id}
                          className="rounded-lg border border-line p-1 text-muted hover:bg-surface-muted"
                          title={e.isArchived ? "Unarchive" : "Archive"}
                        >
                          <Archive className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleVerify("exam", e.id, e.name)}
                          disabled={verifyingId === e.id}
                          className="inline-flex items-center gap-1 rounded-lg bg-success-bg px-2 py-1 text-xs font-semibold text-success ring-1 ring-inset ring-success-line hover:bg-success-bg"
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
              <thead className="border-b border-line text-muted uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3">Scheme Name</th>
                  <th className="py-3 px-3">Ministry / Dept</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Last Verified</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {schemes.map((s) => (
                  <tr key={s.id} className="hover:bg-surface-muted">
                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-fg">{s.name}</div>
                      <div className="text-xs text-muted font-mono">{s.slug}</div>
                    </td>
                    <td className="py-3.5 px-3 text-muted">{s.department}</td>
                    <td className="py-3.5 px-3">
                      <div className="flex flex-wrap gap-1">
                        <span
                          className={`rounded px-1.5 py-0.5 text-xs font-semibold ${
                            s.isPublished
                              ? "bg-success-bg text-success"
                              : "bg-urgent-bg text-urgent"
                          }`}
                        >
                          {s.isPublished ? "Live" : "Draft"}
                        </span>
                        {s.isArchived && (
                          <span className="rounded bg-surface-muted px-1.5 py-0.5 text-xs font-semibold text-muted">
                            Archived
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-muted">
                      {verifiedMap[s.id] ?? (s.lastVerifiedAt ? formatDateIST(s.lastVerifiedAt) : "Never")}
                      {s.lastVerifiedBy && (
                        <div className="text-xs text-muted">by @{s.lastVerifiedBy}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingScheme(s);
                            setSchemeModalOpen(true);
                          }}
                          className="rounded-lg border border-line p-1 text-muted hover:bg-surface-muted"
                          title="Edit Scheme"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleTogglePublish("scheme", s.id, s.isPublished, s.name)}
                          disabled={actionLoadingId === s.id}
                          className="rounded-lg border border-line p-1 text-muted hover:bg-surface-muted"
                          title={s.isPublished ? "Unpublish" : "Publish"}
                        >
                          {s.isPublished ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          onClick={() => handleToggleArchive("scheme", s.id, s.isArchived, s.name)}
                          disabled={actionLoadingId === s.id}
                          className="rounded-lg border border-line p-1 text-muted hover:bg-surface-muted"
                          title={s.isArchived ? "Unarchive" : "Archive"}
                        >
                          <Archive className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleVerify("scheme", s.id, s.name)}
                          disabled={verifyingId === s.id}
                          className="inline-flex items-center gap-1 rounded-lg bg-success-bg px-2 py-1 text-xs font-semibold text-success ring-1 ring-inset ring-success-line hover:bg-success-bg"
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
