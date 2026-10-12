import Link from "next/link";
import { getDeadlineFirstGroups } from "@/server/services/discovery-service";
import { load } from "@/server/services/load";
import { DeadlineSections } from "@/components/opportunity/DeadlineSections";
import { DataUnavailable } from "@/components/opportunity/DataUnavailable";
import { NoticeList, NOTICE_DISCLAIMER } from "@/components/opportunity/NoticeList";
import { listOfficialNotices } from "@/server/services/notice-service";
import { BookOpen, Calendar, Clock, Newspaper, Search, ShieldCheck, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [result, notices] = await Promise.all([
    load("HOME", getDeadlineFirstGroups),
    load("HOME_NOTICES", () => listOfficialNotices({ limit: 8 })),
  ]);

  return (
    <div className="flex flex-col">
      <section className="border-b border-line bg-surface py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-fg sm:text-5xl">
              Government exams and schemes, deadline first
            </h1>
            <p className="mt-4 text-lg text-muted">
              See what is open, when it closes (Indian Standard Time), how recently we checked it, and where to apply on
              the official website.
            </p>

            <form action="/exams" method="GET" className="mx-auto mt-8 flex max-w-xl flex-col gap-2 sm:flex-row" role="search">
              <label htmlFor="home-search" className="sr-only">
                Search exams and recruitments
              </label>
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" aria-hidden />
                <input
                  id="home-search"
                  type="search"
                  name="search"
                  placeholder="For example: UPSC, SSC, Railway, Banking"
                  className="min-h-12 w-full rounded-xl border border-line bg-surface py-3 pl-12 pr-4 text-base text-fg placeholder:text-muted"
                />
              </div>
              <button type="submit" className="min-h-12 rounded-xl bg-primary px-6 text-base font-semibold text-primary-fg hover:bg-primary-hover">
                Search
              </button>
            </form>

            <nav aria-label="Browse" className="mt-6 flex flex-wrap justify-center gap-2">
              {[
                { href: "/closing-soon", label: "All deadlines", Icon: Clock },
                { href: "/exams", label: "Exams & recruitments", Icon: BookOpen },
                { href: "/schemes", label: "Schemes", Icon: Sparkles },
                { href: "/upcoming", label: "Exam calendar", Icon: Calendar },
                { href: "/notices", label: "Official notices", Icon: Newspaper },
              ].map(({ href, label, Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-surface px-4 text-base font-semibold text-fg hover:bg-surface-muted"
                >
                  <Icon className="h-5 w-5 text-link" aria-hidden />
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {result.ok ? (
            <DeadlineSections groups={result.data} limit={6} />
          ) : (
            <DataUnavailable />
          )}
        </div>
      </section>

      {notices.ok && notices.data.length > 0 && (
        <section className="border-t border-line py-10" aria-labelledby="notices-heading">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 id="notices-heading" className="text-2xl font-bold text-fg">Latest official notices</h2>
                <p className="mt-1 max-w-3xl text-base text-muted">{NOTICE_DISCLAIMER}</p>
              </div>
              <Link href="/notices" className="inline-flex min-h-11 items-center text-base font-semibold text-link underline">
                All notices
              </Link>
            </div>
            <div className="mt-5">
              <NoticeList notices={notices.data} />
            </div>
          </div>
        </section>
      )}

      <section className="border-t border-line bg-surface py-10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-success" aria-hidden />
            <div className="text-base text-muted">
              <h2 className="text-xl font-bold text-fg">How to read these listings</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>
                  <strong className="text-fg">Status</strong> comes from the published dates. Once a last date passes, the
                  listing shows as closed.
                </li>
                <li>
                  <strong className="text-fg">Last verified</strong> is when the dates were last confirmed against an official
                  source. Records not checked recently are marked &ldquo;Status needs confirmation&rdquo;.
                </li>
                <li>
                  <strong className="text-fg">Always confirm on the official website</strong> before paying fees or submitting
                  documents. GovernIT is independent and not a government website.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
