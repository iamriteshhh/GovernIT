import Link from "next/link";
import { listNoticeSources, listOfficialNotices } from "@/server/services/notice-service";
import { load } from "@/server/services/load";
import { DataUnavailable } from "@/components/opportunity/DataUnavailable";
import { NoticeList, NOTICE_DISCLAIMER } from "@/components/opportunity/NoticeList";
import { formatDateTimeIST } from "@/lib/dates";
import { Info } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Latest Official Notices",
  description: "Latest notices, results and press releases from state public service commissions, linked to the official documents.",
};

export default async function NoticesPage({ searchParams }: { searchParams: Promise<{ source?: string }> }) {
  const { source } = await searchParams;
  const result = await load("NOTICES", () => Promise.all([listOfficialNotices({ sourceKey: source, limit: 150 }), listNoticeSources()]));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="border-b border-line pb-5">
        <h1 className="text-3xl font-bold tracking-tight text-fg">Latest official notices</h1>
        <p className="mt-2 max-w-3xl text-base text-muted">
          New notices, results, date changes and press releases from public service commissions, newest first.
        </p>
      </header>

      <p className="mt-6 flex items-start gap-2 rounded-2xl border border-info-line bg-info-bg p-4 text-base text-info">
        <Info className="mt-1 h-5 w-5 shrink-0" aria-hidden />
        {NOTICE_DISCLAIMER}
      </p>

      {!result.ok ? (
        <DataUnavailable what="notices" />
      ) : (
        <>
          <nav aria-label="Filter by commission" className="mt-6 flex flex-wrap gap-2">
            {[{ key: "", name: "All commissions" }, ...result.data[1]].map((s) => {
              const active = (source ?? "") === s.key;
              return (
                <Link
                  key={s.key || "all"}
                  href={s.key ? `/notices?source=${s.key}` : "/notices"}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex min-h-11 items-center rounded-xl border px-4 text-sm font-semibold ${
                    active ? "border-primary bg-primary text-primary-fg" : "border-line bg-surface text-fg hover:bg-surface-muted"
                  }`}
                >
                  {s.name}
                </Link>
              );
            })}
          </nav>
          <div className="mt-6">
            <NoticeList notices={result.data[0]} />
          </div>
          <p className="mt-4 text-sm text-muted">
            Last successful checks:{" "}
            {result.data[1].map((s) => `${s.name} ${s.lastSuccessAt ? formatDateTimeIST(s.lastSuccessAt) : "never"}`).join(" · ")}
          </p>
        </>
      )}
    </div>
  );
}
