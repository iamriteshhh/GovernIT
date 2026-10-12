import Link from "next/link";
import { Compass, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-success-bg text-success">
        <Compass className="h-8 w-8" />
      </div>
      <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">
        Opportunity Not Found
      </h1>
      <p className="mt-3 max-w-md text-sm text-muted">
        The exam or scheme you are searching for might have been archived, moved, or has not been announced yet.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-card hover:bg-primary-hover"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
        <Link
          href="/exams"
          className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-5 py-2.5 text-sm font-semibold text-muted shadow-card hover:bg-surface-muted"
        >
          Browse Exams
        </Link>
      </div>
    </div>
  );
}
