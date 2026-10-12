import { getDeadlineFirstGroups } from "@/server/services/discovery-service";
import { load } from "@/server/services/load";
import { DeadlineSections } from "@/components/opportunity/DeadlineSections";
import { DataUnavailable } from "@/components/opportunity/DataUnavailable";
import { Info } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Application Deadlines",
  description:
    "Government exams and schemes ordered by application deadline (IST): closing soon first, then open, opening soon, and records that need confirmation.",
};

export default async function ClosingSoonPage() {
  const result = await load("CLOSING_SOON", getDeadlineFirstGroups);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="border-b border-line pb-5">
        <h1 className="text-3xl font-bold tracking-tight text-fg">Application deadlines</h1>
        <p className="mt-2 max-w-3xl text-base text-muted">
          Everything you can still apply for, ordered by last date (Indian Standard Time). Closed, cancelled and withdrawn
          opportunities are not listed here.
        </p>
      </header>

      <p className="mt-6 flex items-start gap-2 rounded-2xl border border-info-line bg-info-bg p-4 text-base text-info">
        <Info className="mt-1 h-5 w-5 shrink-0" aria-hidden />
        Official portals are often slow on the last day. Apply at least a day early, and confirm dates in the official
        notification.
      </p>

      <div className="mt-10">
        {result.ok ? <DeadlineSections groups={result.data} /> : <DataUnavailable what="deadlines" />}
      </div>
    </div>
  );
}
