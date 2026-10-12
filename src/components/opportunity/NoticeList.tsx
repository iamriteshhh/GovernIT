import { NoticeItem } from "@/server/services/notice-service";
import { formatDateIST } from "@/lib/dates";
import { ExternalLink, FileText } from "lucide-react";

/** Official titles and links exactly as published; nothing interpreted. */
export function NoticeList({ notices }: { notices: NoticeItem[] }) {
  if (notices.length === 0) {
    return <p className="rounded-2xl border border-line bg-surface p-6 text-base text-muted">No official notices collected yet.</p>;
  }
  return (
    <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
      {notices.map((n) => (
        <li key={n.id} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="min-w-0">
            <p className="text-sm text-muted">
              {n.source.organization} ·{" "}
              {n.publishedOn ? `Dated ${formatDateIST(n.publishedOn)}` : `First seen ${formatDateIST(n.firstSeenAt)}`}
            </p>
            <p className="mt-1 flex items-start gap-2 text-base font-semibold text-fg">
              <FileText className="mt-1 h-4 w-4 shrink-0 text-muted" aria-hidden />
              <span className="break-words">{n.title}</span>
            </p>
          </div>
          <a
            href={n.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl border border-line px-4 text-sm font-semibold text-link hover:bg-surface-muted"
          >
            Open official notice <ExternalLink className="h-4 w-4" aria-hidden />
            <span className="sr-only">(opens {n.source.organization} website in a new tab)</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

export const NOTICE_DISCLAIMER =
  "Titles and links are copied automatically from official commission websites, a few times a day. GovernIT has not reviewed them. Open the official notice for the actual details.";
