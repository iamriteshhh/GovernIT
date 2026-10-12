import Link from "next/link";
import { examService } from "@/server/services/exam-service";
import { schemeService } from "@/server/services/scheme-service";
import { organizationRepository } from "@/server/repositories/organization-repository";
import { load } from "@/server/services/load";
import { isApplicationActionable, isApplicationInactive } from "@/domain/status";
import { ExamOpportunity } from "@/domain/exam";
import { SchemeOpportunity } from "@/domain/scheme";
import { OpportunityCard } from "./OpportunityCard";
import { DataUnavailable } from "./DataUnavailable";
import { Search, X } from "lucide-react";

export interface CatalogSearchParams {
  search?: string;
  category?: string;
  state?: string;
  centralOnly?: string;
  status?: string;
}

type Item = ExamOpportunity | SchemeOpportunity;

const STATUS_OPTIONS: Array<{ value: string; label: string; examOnly?: boolean }> = [
  { value: "all", label: "All current listings" },
  { value: "open", label: "Open now" },
  { value: "closing-soon", label: "Closing within 7 days" },
  { value: "not-open-yet", label: "Not open yet" },
  { value: "exam-upcoming", label: "Exam date upcoming", examOnly: true },
  { value: "needs-confirmation", label: "Status needs confirmation" },
  { value: "closed", label: "Closed / cancelled" },
  { value: "archived", label: "Archive" },
];

const RANK: Record<string, number> = {
  CLOSING_SOON: 0,
  APPLICATION_OPEN: 1,
  UPCOMING: 2,
  NOT_ANNOUNCED: 3,
};

/** Actionable first (earliest deadline first), closed and cancelled last. */
function sortForCatalog(items: Item[]): Item[] {
  const rank = (i: Item) => RANK[i.applicationStatus.status] ?? 4;
  const close = (i: Item) => (i.applicationPeriod?.closesAt ? new Date(i.applicationPeriod.closesAt).getTime() : Infinity);
  return [...items].sort((a, b) => rank(a) - rank(b) || close(a) - close(b));
}

function applyStatusFilter(items: Item[], status: string): Item[] {
  switch (status) {
    case "open":
      return items.filter((i) => isApplicationActionable(i.applicationStatus.status));
    case "closing-soon":
      return items.filter((i) => i.applicationStatus.status === "CLOSING_SOON");
    case "not-open-yet":
      return items.filter((i) => i.applicationStatus.status === "UPCOMING");
    case "exam-upcoming":
      return items.filter((i) => i.kind === "exam" && i.examScheduleStatus.status === "EXAM_UPCOMING");
    case "needs-confirmation":
      return items.filter((i) => !i.freshness.trustworthy && !isApplicationInactive(i.applicationStatus.status));
    case "closed":
      return items.filter((i) => isApplicationInactive(i.applicationStatus.status));
    default:
      return items;
  }
}

export async function OpportunityCatalog({ kind, params }: { kind: "exam" | "scheme"; params: CatalogSearchParams }) {
  const search = params.search?.trim() || undefined;
  const categorySlug = params.category || undefined;
  const stateCode = params.state || undefined;
  const onlyCentral = params.centralOnly === "true";
  const statusFilter = STATUS_OPTIONS.some((o) => o.value === params.status) ? params.status! : "all";
  const archived = statusFilter === "archived";
  const filters = { search, categorySlug, stateCode, onlyCentral, isArchived: archived, limit: 300 };

  const result = await load(kind === "exam" ? "EXAMS_LISTING" : "SCHEMES_LISTING", () =>
    Promise.all([
      organizationRepository.findCategories(),
      organizationRepository.findStates(),
      kind === "exam"
        ? examService.listExams(filters).then((r) => r.exams as Item[])
        : schemeService.listSchemes(filters).then((r) => r.schemes as Item[]),
    ])
  );

  const [categories, states, items] = result.ok ? result.data : [[], [], [] as Item[]];
  const shown = sortForCatalog(applyStatusFilter(items, statusFilter));
  const basePath = kind === "exam" ? "/exams" : "/schemes";
  const hasActiveFilters = Boolean(search || categorySlug || stateCode || onlyCentral || statusFilter !== "all");
  const fieldCls = "min-h-11 rounded-xl border border-line bg-surface px-3 text-base text-fg";

  return (
    <>
      <form method="GET" className="mt-6 rounded-2xl border border-line bg-surface p-4 shadow-card" role="search">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1 md:col-span-2 lg:col-span-4">
            <label htmlFor="catalog-search" className="text-sm font-semibold text-fg">
              Search
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" aria-hidden />
              <input
                id="catalog-search"
                type="search"
                name="search"
                defaultValue={search ?? ""}
                placeholder={kind === "exam" ? "Exam, recruiting body or department" : "Scheme, ministry or benefit"}
                className={`${fieldCls} w-full pl-11 placeholder:text-muted`}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="catalog-category" className="text-sm font-semibold text-fg">Category</label>
            <select id="catalog-category" name="category" defaultValue={categorySlug ?? ""} className={fieldCls}>
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="catalog-state" className="text-sm font-semibold text-fg">Location</label>
            <select id="catalog-state" name="state" defaultValue={stateCode ?? ""} className={fieldCls}>
              <option value="">Central and all states</option>
              {states.map((s) => (
                <option key={s.id} value={s.code}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="catalog-status" className="text-sm font-semibold text-fg">Status</label>
            <select id="catalog-status" name="status" defaultValue={statusFilter} className={fieldCls}>
              {STATUS_OPTIONS.filter((o) => kind === "exam" || !o.examOnly).map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button type="submit" className="min-h-11 flex-1 rounded-xl bg-primary px-5 text-base font-semibold text-primary-fg hover:bg-primary-hover">
              Show results
            </button>
            {hasActiveFilters && (
              <Link href={basePath} className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-line px-4 text-base font-semibold text-fg hover:bg-surface-muted">
                <X className="h-4 w-4" aria-hidden /> Clear
              </Link>
            )}
          </div>
        </div>
      </form>

      {!result.ok ? (
        <DataUnavailable what={kind === "exam" ? "exams" : "schemes"} />
      ) : (
        <>
          <p className="mt-6 text-base text-muted" aria-live="polite">
            {shown.length} {shown.length === 1 ? "result" : "results"}
            {archived && " in the archive (no longer actionable)"}
          </p>
          {shown.length > 0 ? (
            <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((item) => (
                <OpportunityCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-line bg-surface p-10 text-center">
              <h2 className="text-lg font-semibold text-fg">No listings match these filters</h2>
              <p className="mt-1 text-base text-muted">Try a different search word, or clear the filters.</p>
              <Link href={basePath} className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-primary px-5 text-base font-semibold text-primary-fg hover:bg-primary-hover">
                Clear all filters
              </Link>
            </div>
          )}
        </>
      )}
    </>
  );
}
