import Link from "next/link";
import { Compass, ShieldCheck, AlertCircle } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-line bg-surface">
      {/* Official Status Disclaimer Banner */}
      <div className="border-b border-urgent-line bg-urgent-bg px-4 py-3 text-xs text-urgent">
        <div className="mx-auto flex max-w-7xl items-start gap-2.5 sm:items-center">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-urgent sm:mt-0" />
          <p className="leading-relaxed">
            <strong className="font-semibold">Independent Platform Notice:</strong> GovernIT is an independent public information discovery platform. It is <strong>not affiliated with, endorsed by, or operated by any government body</strong>. Each listing shows when it was last checked against an official source; always confirm on the official website before applying.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Platform Information */}
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white shadow-card">
                <Compass className="h-4 w-4" />
              </div>
              <span className="text-lg font-bold tracking-tight text-fg">
                GovernIT
              </span>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-muted">
              GovernIT brings government exams, recruitments and welfare schemes together, with each listing&apos;s deadline, verification date and official link. Independent; not a government website.
            </p>
            <div className="flex items-center gap-2 text-xs text-muted">
              <ShieldCheck className="h-4 w-4 text-success" />
              <span>Every listing shows when it was last verified. Always confirm on the official website.</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-fg">
              Discover
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-muted">
              <li>
                <Link href="/exams" className="transition-colors hover:text-fg">
                  Government Exams & Jobs
                </Link>
              </li>
              <li>
                <Link href="/schemes" className="transition-colors hover:text-fg">
                  Welfare & Citizen Schemes
                </Link>
              </li>
              <li>
                <Link href="/upcoming" className="transition-colors hover:text-fg">
                  Upcoming Exam Calendar
                </Link>
              </li>
              <li>
                <Link href="/closing-soon" className="transition-colors hover:text-fg">
                  Applications Closing Soon
                </Link>
              </li>
            </ul>
          </div>

          {/* Official Verification & Legal Policy */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-fg">
              Trust &amp; Transparency
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-muted">
              <li>
                <Link href="/privacy" className="transition-colors hover:text-fg">
                  Privacy Policy &amp; Data Rights
                </Link>
              </li>
              <li>
                <Link href="/terms" className="transition-colors hover:text-fg">
                  Terms of Service &amp; Disclaimer
                </Link>
              </li>
              <li>
                <Link href="/contact" className="transition-colors hover:text-fg">
                  Editorial Desk &amp; Corrigenda
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-line pt-8 sm:flex-row">
          <p className="text-xs text-muted">
            &copy; {new Date().getFullYear()} GovernIT. Designed for transparent, verified civic accessibility.
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted">
            <Link href="/privacy" className="hover:underline">Privacy</Link>
            <span>&bull;</span>
            <Link href="/terms" className="hover:underline">Terms</Link>
            <span>&bull;</span>
            <Link href="/contact" className="hover:underline">Contact Desk</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
