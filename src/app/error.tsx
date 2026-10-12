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
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-urgent-bg text-urgent border border-urgent-line">
        <AlertCircle className="h-8 w-8" />
      </div>

      <h1 className="mt-6 text-2xl font-extrabold tracking-tight text-fg sm:text-3xl">
        Something went wrong
      </h1>

      <p className="mt-2 max-w-md text-sm text-muted leading-relaxed">
        We encountered an unexpected error while retrieving this opportunity. Our civic systems have logged this issue for editorial review.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-white shadow-card hover:bg-primary-hover"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Try Again
        </button>

        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-5 py-2.5 text-xs font-semibold text-muted shadow-card hover:bg-surface-muted"
        >
          <Home className="h-3.5 w-3.5" />
          Return Home
        </Link>
      </div>
    </div>
  );
}
