"use client";

import { ReactNode, useEffect, useId, useRef } from "react";
import { AlertCircle, X } from "lucide-react";

const control = "mt-1 min-h-11 w-full rounded-xl border border-line bg-surface px-3 py-2 text-base text-fg";

export function TextField(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: "text" | "url" | "date" | "time" | "number";
  required?: boolean;
  placeholder?: string;
  hint?: string;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-fg">
        {props.label}
        {props.required && <span aria-hidden> *</span>}
      </label>
      <input
        id={id}
        type={props.type ?? "text"}
        required={props.required}
        value={props.value}
        placeholder={props.placeholder}
        onChange={(e) => props.onChange(e.target.value)}
        aria-describedby={props.hint ? `${id}-hint` : undefined}
        className={control}
      />
      {props.hint && (
        <p id={`${id}-hint`} className="mt-1 text-sm text-muted">
          {props.hint}
        </p>
      )}
    </div>
  );
}

export function TextArea(props: { label: string; value: string; onChange: (v: string) => void; required?: boolean; rows?: number }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-fg">
        {props.label}
        {props.required && <span aria-hidden> *</span>}
      </label>
      <textarea
        id={id}
        required={props.required}
        rows={props.rows ?? 3}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        className={control}
      />
    </div>
  );
}

export function SelectField(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
  required?: boolean;
  hint?: string;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-fg">
        {props.label}
        {props.required && <span aria-hidden> *</span>}
      </label>
      <select
        id={id}
        required={props.required}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        aria-describedby={props.hint ? `${id}-hint` : undefined}
        className={control}
      >
        {props.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {props.hint && (
        <p id={`${id}-hint`} className="mt-1 text-sm text-muted">
          {props.hint}
        </p>
      )}
    </div>
  );
}

export function CheckField(props: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  const id = useId();
  return (
    <div className="flex min-h-11 items-center gap-3">
      <input
        id={id}
        type="checkbox"
        checked={props.checked}
        onChange={(e) => props.onChange(e.target.checked)}
        className="h-5 w-5 rounded border-line accent-[var(--primary)]"
      />
      <label htmlFor={id} className="text-base text-fg">
        {props.label}
      </label>
    </div>
  );
}

/** Accessible modal: labelled dialog, Escape closes, focus moves inside on open. */
export function Modal(props: { title: string; subtitle?: string; error: string | null; onClose: () => void; children: ReactNode }) {
  const titleId = useId();
  const ref = useRef<HTMLDivElement>(null);
  const { onClose } = props;

  useEffect(() => {
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-line bg-surface p-6 shadow-card"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line pb-4">
          <div>
            <h2 id={titleId} className="text-xl font-bold text-fg">
              {props.title}
            </h2>
            {props.subtitle && <p className="mt-1 text-base text-muted">{props.subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-muted hover:bg-surface-muted"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        {props.error && (
          <div role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-danger-line bg-danger-bg p-3 text-base text-danger">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            <span>{props.error}</span>
          </div>
        )}
        {props.children}
      </div>
    </div>
  );
}

export const LINK_KIND_OPTIONS = [
  { value: "DIRECT_APPLICATION", label: "Direct application / registration form" },
  { value: "APPLICATION_PORTAL", label: "Official application portal (login / navigate to form)" },
  { value: "DEPARTMENT_SITE", label: "Department or scheme homepage only" },
];

export const LIFECYCLE_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "CANCELLED", label: "Cancelled (official notice)" },
  { value: "WITHDRAWN", label: "Withdrawn (official notice)" },
  { value: "SUPERSEDED", label: "Superseded by a newer notification" },
];

/** Splits an ISO instant into IST date + time inputs. */
export function splitIst(iso: string | null | undefined): { date: string; time: string } {
  if (!iso) return { date: "", time: "" };
  const shifted = new Date(new Date(iso).getTime() + 5.5 * 3_600_000).toISOString();
  return { date: shifted.slice(0, 10), time: shifted.slice(11, 16) };
}

/** Joins IST date + optional time into the format the API accepts. */
export function joinIst(date: string, time: string): string | null {
  if (!date) return null;
  return time ? `${date}T${time}` : date;
}

/** Turns a zod flatten() payload into one readable line. */
export function describeApiError(json: { error?: string; details?: { fieldErrors?: Record<string, string[]>; formErrors?: string[] } }) {
  const fields = Object.entries(json.details?.fieldErrors ?? {}).map(([k, v]) => `${k}: ${v.join(", ")}`);
  const form = json.details?.formErrors ?? [];
  return [json.error, ...form, ...fields].filter(Boolean).join(" — ") || "Save failed";
}
