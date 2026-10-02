"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw, Home } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log sanitized error message to console without exposing internal details
    console.error("[APPLICATION ERROR]", error.message);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
        <AlertCircle className="h-8 w-8" />
      </div>

      <h1 className="mt-6 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
        Something went wrong
      </h1>

      <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
        We encountered an unexpected error while retrieving this opportunity. Our civic systems have logged this issue for editorial review.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Try Again
        </button>

        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <Home className="h-3.5 w-3.5" />
          Return Home
        </Link>
      </div>
    </div>
  );
}
