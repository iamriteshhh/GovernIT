import { AlertTriangle } from "lucide-react";

/** Shown when a data load fails. An outage must never look like "no opportunities". */
export function DataUnavailable({ what = "opportunities" }: { what?: string }) {
  return (
    <div role="alert" className="mt-8 rounded-2xl border border-danger-line bg-danger-bg p-6 text-danger">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-1 h-5 w-5 shrink-0" aria-hidden />
        <div>
          <h2 className="text-lg font-bold">We could not load {what} right now</h2>
          <p className="mt-1 text-base">
            This is a problem on our side. It does not mean there are no {what}. Please try again in a few
            minutes, or check the official government websites directly.
          </p>
        </div>
      </div>
    </div>
  );
}
