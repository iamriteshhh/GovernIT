"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { ShieldCheck, X } from "lucide-react";

const KEY = "governit_privacy_acknowledged";
const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function isAcknowledged(): boolean {
  try {
    return localStorage.getItem(KEY) !== null;
  } catch {
    return true; // storage blocked: do not nag on every page
  }
}

export function CookieConsentBanner() {
  // Server render: hidden, so markup matches until the browser can read storage.
  const visible = !useSyncExternalStore(subscribe, isAcknowledged, () => true);

  const handleAcknowledge = () => {
    try {
      localStorage.setItem(KEY, "true");
    } catch {
      // ignore
    }
    listeners.forEach((l) => l());
  };

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Privacy and Cookie Notice"
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-4xl rounded-2xl border border-line bg-surface p-4 shadow-card backdrop-blur-md sm:flex sm:items-center sm:justify-between sm:p-5"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-success-bg text-success">
          <ShieldCheck className="h-4 w-4" />
        </div>
        <div className="text-xs leading-relaxed text-muted">
          <p className="font-semibold text-fg">
            Civic Privacy Notice: Zero Advertising Trackers
          </p>
          <p className="mt-0.5">
            GovernIT does not use commercial advertising cookies, cross-site trackers, or behavioral analytics. Only strictly necessary operational session cookies are used for editorial security. Learn more in our{" "}
            <Link
              href="/privacy"
              className="font-medium text-success underline hover:text-success"
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
          className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-card transition-colors hover:bg-primary-hover"
        >
          Acknowledge &amp; Dismiss
        </button>
        <button
          onClick={handleAcknowledge}
          aria-label="Close privacy notice"
          className="rounded-lg p-1.5 text-muted hover:bg-surface-muted hover:text-muted"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
