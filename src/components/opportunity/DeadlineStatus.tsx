"use client";

import { useEffect, useState } from "react";
import { evaluateApplicationStatus, LifecycleState } from "@/domain/status";
import { formatDateTimeIST, msUntilNextISTMidnight } from "@/lib/dates";
import { StatusBadge } from "./StatusBadge";

interface DeadlineStatusProps {
  opensAt: string | null;
  closesAt: string | null;
  isRolling: boolean;
  lifecycle: LifecycleState;
  /** Server render time, so the first client render matches the HTML exactly. */
  serverNow: string;
  layout?: "card" | "detail";
}

const MAX_TIMER_MS = 2 ** 31 - 1;

/**
 * Re-evaluates status in the browser and refreshes itself at the next IST midnight,
 * at the opening/closing instant, and once a minute only during the final 24 hours.
 */
function useLiveNow(serverNow: string, opensAt: string | null, closesAt: string | null): Date {
  const [now, setNow] = useState(() => new Date(serverNow));

  useEffect(() => {
    const current = new Date();
    // First client pass: catch up from the server render time immediately.
    if (Math.abs(current.getTime() - now.getTime()) > 1000) {
      const id = window.setTimeout(() => setNow(new Date()), 0);
      return () => window.clearTimeout(id);
    }
    const upcoming = [opensAt, closesAt]
      .map((i) => (i ? new Date(i).getTime() - current.getTime() : Infinity))
      .filter((ms) => ms > 0);
    const nextEdge = Math.min(msUntilNextISTMidnight(current), ...upcoming);
    const finalDay = upcoming.some((ms) => ms < 24 * 60 * 60 * 1000);
    const delay = Math.min(finalDay ? 60_000 : nextEdge + 50, nextEdge + 50, MAX_TIMER_MS);
    const id = window.setTimeout(() => setNow(new Date()), delay);
    return () => window.clearTimeout(id);
  }, [now, opensAt, closesAt]);

  return now;
}

function hoursLeft(closesAt: string, now: Date): number {
  return Math.max(0, Math.floor((new Date(closesAt).getTime() - now.getTime()) / 3_600_000));
}

export function DeadlineStatus({ opensAt, closesAt, isRolling, lifecycle, serverNow, layout = "card" }: DeadlineStatusProps) {
  const now = useLiveNow(serverNow, opensAt, closesAt);
  const evaluation = evaluateApplicationStatus({ opensAt, closesAt, isRolling, lifecycle }, now);
  const actionable = evaluation.status === "APPLICATION_OPEN" || evaluation.status === "CLOSING_SOON";

  let remaining: string | null = null;
  if (actionable && closesAt) {
    remaining =
      evaluation.daysLeft === 0
        ? `${hoursLeft(closesAt, now)} hours left today`
        : evaluation.daysLeft === 1
        ? "1 day left"
        : `${evaluation.daysLeft} days left`;
  }

  return (
    <div className={layout === "detail" ? "flex flex-col gap-2" : "flex flex-col gap-1.5"}>
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge evaluation={evaluation} />
        {remaining && (
          <span
            className={`text-sm font-semibold ${evaluation.status === "CLOSING_SOON" ? "text-urgent" : "text-fg"}`}
          >
            {remaining}
          </span>
        )}
      </div>
      <p className="text-sm text-muted">
        {actionable && closesAt
          ? `Registration closes ${formatDateTimeIST(closesAt)}`
          : evaluation.displayText}
      </p>
    </div>
  );
}
