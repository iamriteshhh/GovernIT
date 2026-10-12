"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, RefreshCw } from "lucide-react";
import { splitIst } from "./FormKit";

export function SourceCheckButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/sources/${id}/check`, { method: "POST" });
      const json = await res.json();
      setMsg(res.ok ? `Done: ${json.result?.outcome ?? "no result"}` : json.error ?? "Check failed");
      router.refresh();
    } catch {
      setMsg("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={run}
        disabled={busy}
        aria-label={`Check ${name} now`}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-fg hover:bg-surface-muted disabled:opacity-50"
      >
        <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} aria-hidden />
        {busy ? "Checking…" : "Check now"}
      </button>
      {msg && <p role="status" className="mt-1 text-sm text-muted">{msg}</p>}
    </div>
  );
}

interface Candidate {
  id: string;
  kind: string;
  title: string;
  reason: string;
  evidenceUrl: string | null;
  proposed: Record<string, unknown>;
  current: Record<string, unknown> | null;
  createdAt: string;
  sourceName: string;
  listing: { name: string; href: string } | null;
}

const DATE_FIELDS = ["opensAt", "closesAt", "examDate"] as const;
const show = (v: unknown) => (v === null || v === undefined || v === "" ? "—" : typeof v === "object" ? JSON.stringify(v) : String(v));

export function ReviewCard({ candidate: c }: { candidate: Candidate }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const editable = c.kind === "DATE_CHANGE" || c.kind === "NEW_OPPORTUNITY";
  const [corr, setCorr] = useState<Record<string, string>>(() =>
    Object.fromEntries(DATE_FIELDS.map((f) => [f, splitIst(c.proposed[f] as string | null).date]))
  );
  const keys = [...new Set([...Object.keys(c.current ?? {}), ...Object.keys(c.proposed)])].filter(
    (k) => !["ambiguous", "evidenceUrl", "externalId", "stateCode", "updatedAt"].includes(k) || c.kind === "NOTICE_UPDATED"
  );

  async function decide(action: "approve" | "reject") {
    setBusy(true);
    setError(null);
    try {
      // Only send corrections the reviewer actually changed from the proposal.
      const corrections = editable
        ? Object.fromEntries(
            DATE_FIELDS.filter((f) => corr[f] !== splitIst(c.proposed[f] as string | null).date).map((f) => [f, corr[f] || null])
          )
        : undefined;
      const res = await fetch(`/api/admin/review/${c.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note, corrections: corrections && Object.keys(corrections).length ? corrections : undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Review failed");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Review failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="rounded-2xl border border-line bg-surface p-5">
      <p className="text-sm font-semibold text-muted">
        {c.kind.replace(/_/g, " ").toLowerCase()} · {c.sourceName} · queued {c.createdAt}
      </p>
      <h3 className="mt-1 text-lg font-bold text-fg">{c.title}</h3>
      {c.listing && (
        <p className="text-sm">
          Listing: <a href={c.listing.href} className="font-semibold text-link underline">{c.listing.name}</a>
        </p>
      )}
      <p className="mt-2 text-base text-muted">{c.reason}</p>
      {c.evidenceUrl && (
        <a href={c.evidenceUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-11 items-center gap-1 break-all text-base font-semibold text-link underline">
          Open official evidence <ExternalLink className="h-4 w-4" aria-hidden />
        </a>
      )}

      <table className="mt-3 w-full text-sm">
        <thead>
          <tr className="text-left text-muted"><th className="py-1 pr-3">Field</th><th className="py-1 pr-3">Current</th><th className="py-1">Official source says</th></tr>
        </thead>
        <tbody>
          {keys.map((k) => (
            <tr key={k} className="border-t border-line">
              <td className="py-1 pr-3 font-semibold text-fg">{k}</td>
              <td className="py-1 pr-3 break-all text-muted">{show(c.current?.[k])}</td>
              <td className="py-1 break-all text-fg">{show(c.proposed[k])}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {editable && (
        <fieldset className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <legend className="text-sm font-semibold text-fg">Correct before approving (IST dates, optional)</legend>
          {DATE_FIELDS.map((f) => (
            <label key={f} className="text-sm text-fg">
              {f}
              <input
                type="date"
                value={corr[f]}
                onChange={(e) => setCorr((p) => ({ ...p, [f]: e.target.value }))}
                className="mt-1 block min-h-11 w-full rounded-xl border border-line bg-surface px-3 text-base"
              />
            </label>
          ))}
        </fieldset>
      )}

      <label className="mt-3 block text-sm font-semibold text-fg">
        Review note (what you checked)
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="mt-1 block min-h-11 w-full rounded-xl border border-line bg-surface px-3 text-base"
        />
      </label>
      {error && <p role="alert" className="mt-2 text-sm text-danger">{error}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" disabled={busy || note.trim().length < 3} onClick={() => decide("approve")}
          className="min-h-11 rounded-xl bg-primary px-5 text-base font-semibold text-primary-fg hover:bg-primary-hover disabled:opacity-50">
          {c.kind === "NEW_OPPORTUNITY" ? "Approve as draft" : ["DATE_CHANGE", "LINK_CHANGE", "STATUS_CHANGE"].includes(c.kind) ? "Approve change" : "Acknowledge"}
        </button>
        <button type="button" disabled={busy || note.trim().length < 3} onClick={() => decide("reject")}
          className="min-h-11 rounded-xl border border-line px-5 text-base font-semibold text-fg hover:bg-surface-muted disabled:opacity-50">
          Reject
        </button>
      </div>
    </article>
  );
}
