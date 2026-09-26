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
  Building2 
} from "lucide-react";
import { formatDateIST } from "@/lib/dates";

interface AdminConsoleProps {
  stats: {
    totalExams: number;
    totalSchemes: number;
    totalOrgs: number;
    totalVerifications: number;
  };
  recentExams: Array<{
    id: string;
    name: string;
    slug: string;
    conductingBody: string;
    lastVerifiedAt: string | null;
    isPublished: boolean;
  }>;
  recentSchemes: Array<{
    id: string;
    name: string;
    slug: string;
    department: string;
    lastVerifiedAt: string | null;
    isPublished: boolean;
  }>;
}

export function AdminConsole({ stats, recentExams, recentSchemes }: AdminConsoleProps) {
  const router = useRouter();
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verifiedMap, setVerifiedMap] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);

  const handleVerify = async (type: "exam" | "scheme", id: string, name: string) => {
    setVerifyingId(id);
    setMessage(null);

    try {
      const payload = type === "exam" ? { examId: id, notes: `Re-verified ${name} via admin console` } : { schemeId: id, notes: `Re-verified ${name} via admin console` };

      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setVerifiedMap((prev) => ({ ...prev, [id]: "Just now" }));
        setMessage(`Successfully recorded fresh verification audit for "${name}".`);
      } else {
        setMessage(`Verification failed for "${name}".`);
      }
    } catch {
      setMessage("Network error during verification.");
    } finally {
      setVerifyingId(null);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <div className="space-y-8">
      {/* Top Banner with Logout */}
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Authenticated Editorial Session
            </h2>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Audit trail active. You have full editorial rights to verify and manage public records.
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          <LogOut className="h-3.5 w-3.5 text-slate-500" />
          Sign Out
        </button>
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
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Published Exams
            </span>
            <FileText className="h-4 w-4 text-blue-500" />
          </div>
          <p className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white">
            {stats.totalExams}
          </p>
          <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400">100% Gazette backed</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Published Schemes
            </span>
            <Database className="h-4 w-4 text-purple-500" />
          </div>
          <p className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white">
            {stats.totalSchemes}
          </p>
          <p className="mt-1 text-[11px] text-purple-600 dark:text-purple-400">100% Ministry backed</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Conducting Bodies
            </span>
            <Building2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white">
            {stats.totalOrgs}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Central & State entities</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Verification Audits
            </span>
            <ShieldCheck className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white">
            {stats.totalVerifications}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Total audits recorded</p>
        </div>
      </div>

      {/* Verification Audit Action Table - Exams */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Government Exams Verification Desk
        </h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Click &ldquo;Audit &amp; Mark Verified&rdquo; after confirming dates against the official portal to update the public verification timestamp.
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 text-slate-400 uppercase tracking-wider dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Opportunity</th>
                <th className="py-3 px-4">Conducting Body</th>
                <th className="py-3 px-4">Last Verified</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentExams.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                  <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                    {e.name}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                    {e.conductingBody}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                    {verifiedMap[e.id] ?? formatDateIST(e.lastVerifiedAt)}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleVerify("exam", e.id, e.name)}
                      disabled={verifyingId === e.id}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 transition-colors"
                    >
                      <RefreshCw className={`h-3 w-3 ${verifyingId === e.id ? "animate-spin" : ""}`} />
                      Audit &amp; Mark Verified
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Verification Audit Action Table - Schemes */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Citizen Schemes Verification Desk
        </h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Verify and renew timestamps for central and state public assistance schemes.
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 text-slate-400 uppercase tracking-wider dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Scheme Name</th>
                <th className="py-3 px-4">Ministry / Department</th>
                <th className="py-3 px-4">Last Verified</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentSchemes.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                  <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                    {s.name}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                    {s.department}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                    {verifiedMap[s.id] ?? formatDateIST(s.lastVerifiedAt)}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleVerify("scheme", s.id, s.name)}
                      disabled={verifyingId === s.id}
                      className="inline-flex items-center gap-1 rounded-lg bg-purple-50 px-2.5 py-1.5 text-xs font-semibold text-purple-700 ring-1 ring-inset ring-purple-600/20 hover:bg-purple-100 dark:bg-purple-950/60 dark:text-purple-300 transition-colors"
                    >
                      <RefreshCw className={`h-3 w-3 ${verifyingId === s.id ? "animate-spin" : ""}`} />
                      Audit &amp; Mark Verified
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
