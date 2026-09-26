import Link from "next/link";
import { Compass, ShieldCheck, AlertCircle } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      {/* Official Status Disclaimer Banner */}
      <div className="border-b border-amber-200/60 bg-amber-50/70 px-4 py-3 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
        <div className="mx-auto flex max-w-7xl items-start gap-2.5 sm:items-center">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 sm:mt-0 dark:text-amber-400" />
          <p className="leading-relaxed">
            <strong className="font-semibold">Independent Platform Notice:</strong> GovernIT is an independent public information discovery platform. It is <strong>not affiliated with, endorsed by, or operated by any government body</strong>. All opportunity details are cross-referenced with authoritative official gazettes, portals, and notifications.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Platform Information */}
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
                <Compass className="h-4 w-4" />
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                Govern<span className="text-emerald-600 dark:text-emerald-400">IT</span>
              </span>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              GovernIT brings government exams, recruitments, and public welfare schemes together in one clean, verified experience. Never miss a deadline, fee payment date, or opportunity again.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Strict Zero-Fabrication Policy: Only verified official data published.</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
              Discover
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
              <li>
                <Link href="/exams" className="transition-colors hover:text-emerald-600 dark:hover:text-emerald-400">
                  Government Exams & Jobs
                </Link>
              </li>
              <li>
                <Link href="/schemes" className="transition-colors hover:text-emerald-600 dark:hover:text-emerald-400">
                  Welfare & Citizen Schemes
                </Link>
              </li>
              <li>
                <Link href="/upcoming" className="transition-colors hover:text-emerald-600 dark:hover:text-emerald-400">
                  Upcoming Exam Calendar
                </Link>
              </li>
              <li>
                <Link href="/closing-soon" className="transition-colors hover:text-emerald-600 dark:hover:text-emerald-400">
                  Applications Closing Soon
                </Link>
              </li>
            </ul>
          </div>

          {/* Official Verification Policy */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
              Transparency
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
              <li className="flex items-center gap-1.5">
                <span>Official Source Required</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span>Timestamped Verification</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span>IST Timezone Accuracy</span>
              </li>
              <li>
                <Link href="/admin" className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
                  Official Editorial / Admin
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 sm:flex-row dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            &copy; {new Date().getFullYear()} GovernIT. Designed for transparent civic accessibility.
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <span>Built with precision & integrity</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
