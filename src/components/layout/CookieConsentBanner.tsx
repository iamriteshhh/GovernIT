"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShieldCheck, X } from "lucide-react";

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem("governit_privacy_acknowledged");
      if (!consent) {
        setVisible(true);
      }
    } catch {
      // Storage access blocked or restricted
    }
  }, []);

  const handleAcknowledge = () => {
    try {
      localStorage.setItem("governit_privacy_acknowledged", "true");
    } catch {
      // ignore
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Privacy and Cookie Notice"
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 sm:flex sm:items-center sm:justify-between sm:p-5"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
          <ShieldCheck className="h-4 w-4" />
        </div>
        <div className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
          <p className="font-semibold text-slate-900 dark:text-white">
            Civic Privacy Notice: Zero Advertising Trackers
          </p>
          <p className="mt-0.5">
            GovernIT does not use commercial advertising cookies, cross-site trackers, or behavioral analytics. Only strictly necessary operational session cookies are used for editorial security. Learn more in our{" "}
            <Link
              href="/privacy"
              className="font-medium text-emerald-600 underline hover:text-emerald-500 dark:text-emerald-400"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2.5 sm:mt-0 sm:shrink-0">
        <button
          onClick={handleAcknowledge}
          className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
        >
          Acknowledge &amp; Dismiss
        </button>
        <button
          onClick={handleAcknowledge}
          aria-label="Close privacy notice"
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
