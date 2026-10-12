import { PrioritizedGroups } from "@/domain/prioritize";
import { DiscoveryItem } from "@/server/services/discovery-service";
import { OpportunityCard } from "./OpportunityCard";
import { AlertTriangle, CheckCircle2, Clock, HelpCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface SectionSpec {
  key: keyof PrioritizedGroups<DiscoveryItem>;
  title: string;
  description: string;
  Icon: LucideIcon;
  tone: string;
}

/** Order matters: this IS the deadline-first ranking shown to users. */
const SECTIONS: SectionSpec[] = [
  {
    key: "closingSoon",
    title: "Registration closes soon",
    description: "Verified as open. Last date within 7 days, earliest deadline first.",
    Icon: AlertTriangle,
    tone: "text-urgent",
  },
  {
    key: "open",
    title: "Open now",
    description: "Verified as open, earliest deadline first.",
    Icon: CheckCircle2,
    tone: "text-success",
  },
  {
    key: "upcoming",
    title: "Opening soon",
    description: "Applications not open yet. Opening date confirmed by an official source.",
    Icon: Clock,
    tone: "text-info",
  },
  {
    key: "needsConfirmation",
    title: "Status needs confirmation",
    description:
      "Dates on these records have not been verified recently, so we cannot confirm they are still open. Check the official notification before you act.",
    Icon: HelpCircle,
    tone: "text-urgent",
  },
  {
    key: "unknown",
    title: "Dates not announced",
    description: "No official application dates published yet.",
    Icon: HelpCircle,
    tone: "text-muted",
  },
];

interface DeadlineSectionsProps {
  groups: PrioritizedGroups<DiscoveryItem>;
  /** Max cards per section (home page); undefined = show all. */
  limit?: number;
  hide?: Array<keyof PrioritizedGroups<DiscoveryItem>>;
}

export function DeadlineSections({ groups, limit, hide = [] }: DeadlineSectionsProps) {
  const visible = SECTIONS.filter((s) => !hide.includes(s.key) && groups[s.key].length > 0);

  if (visible.length === 0) {
    return (
      <p className="mt-6 rounded-2xl border border-line bg-surface p-6 text-base text-muted">
        No open or upcoming applications are listed right now. Closed and cancelled opportunities are not shown here.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-12">
      {visible.map(({ key, title, description, Icon, tone }) => {
        const items = groups[key];
        const shown = limit ? items.slice(0, limit) : items;
        return (
          <section key={key} aria-labelledby={`section-${key}`}>
            <div className="flex items-start gap-3">
              <Icon className={`mt-1 h-6 w-6 shrink-0 ${tone}`} aria-hidden />
              <div>
                <h2 id={`section-${key}`} className="text-2xl font-bold text-fg">
                  {title} <span className="text-muted">({items.length})</span>
                </h2>
                <p className="mt-1 max-w-3xl text-base text-muted">{description}</p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((item) => (
                <OpportunityCard key={`${item.kind}-${item.id}`} item={item} />
              ))}
            </div>
            {limit && items.length > limit && (
              <p className="mt-4 text-base text-muted">
                Showing {limit} of {items.length}. See the full list on the{" "}
                <a href="/closing-soon" className="font-semibold text-link underline">
                  deadlines page
                </a>
                .
              </p>
            )}
          </section>
        );
      })}
    </div>
  );
}
