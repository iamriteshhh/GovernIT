import { SourceAdapter } from "../types";
import { tnpscDashboardAdapter } from "./tnpsc-dashboard";
import { bpscSitemapAdapter } from "./bpsc-sitemap";
import { jpscNoticesAdapter, keralaPscUpdatesAdapter, ppscNoticesAdapter, rpscNewsAdapter } from "./notice-lists";

/** One adapter per official source. Add new adapters here (see docs/OPERATIONS.md). */
export const ADAPTERS: Record<string, SourceAdapter> = {
  [tnpscDashboardAdapter.id]: tnpscDashboardAdapter,
  [bpscSitemapAdapter.id]: bpscSitemapAdapter,
  [rpscNewsAdapter.id]: rpscNewsAdapter,
  [ppscNoticesAdapter.id]: ppscNoticesAdapter,
  [keralaPscUpdatesAdapter.id]: keralaPscUpdatesAdapter,
  [jpscNoticesAdapter.id]: jpscNoticesAdapter,
};

const notices = (key: string, name: string, organization: string, url: string, allowedHost: string, adapter: { id: string; version: string }) => ({
  key,
  name,
  organization,
  kind: "HTML_LIST",
  url,
  allowedHost,
  adapterId: adapter.id,
  adapterVersion: adapter.version,
  opportunityType: "notice",
  checkIntervalMinutes: 120,
  staleAfterHours: 72,
  autoPublish: false,
});

/** Registry rows for the sources above (upserted by the seed and by `npm run sources:register`). */
export const SOURCE_REGISTRY = [
  {
    key: "tnpsc-exam-dashboard",
    name: "TNPSC Exam Dashboard",
    organization: "Tamil Nadu Public Service Commission (TNPSC)",
    kind: "HTML_TABLE",
    url: "https://tnpsc.gov.in/web/examdashboard/index.aspx",
    allowedHost: "tnpsc.gov.in",
    adapterId: tnpscDashboardAdapter.id,
    adapterVersion: tnpscDashboardAdapter.version,
    opportunityType: "exam",
    checkIntervalMinutes: 180,
    staleAfterHours: 72,
    // Structured, fixture-tested dates: complete records publish automatically, conflicts still go to review.
    autoPublish: true,
  },
  {
    key: "bpsc-notification-sitemap",
    name: "BPSC Notifications (sitemap)",
    organization: "Bihar Public Service Commission (BPSC)",
    kind: "SITEMAP",
    url: "https://bpsc.bihar.gov.in/sitemap_index.xml",
    allowedHost: "bpsc.bihar.gov.in",
    adapterId: bpscSitemapAdapter.id,
    adapterVersion: bpscSitemapAdapter.version,
    opportunityType: "notice",
    checkIntervalMinutes: 120,
    staleAfterHours: 72,
    autoPublish: false,
  },
  notices("rpsc-news", "RPSC News and Events", "Rajasthan Public Service Commission (RPSC)", "https://rpsc.rajasthan.gov.in/", "rpsc.rajasthan.gov.in", rpscNewsAdapter),
  notices("ppsc-notices", "PPSC Public Notices", "Punjab Public Service Commission (PPSC)", "https://ppsc.gov.in/", "ppsc.gov.in", ppscNoticesAdapter),
  notices("keralapsc-exam-updates", "Kerala PSC Examination Updates", "Kerala Public Service Commission", "https://www.keralapsc.gov.in/psc-examination-updates", "keralapsc.gov.in", keralaPscUpdatesAdapter),
  notices("jpsc-notices", "JPSC Notices and Press Releases", "Jharkhand Public Service Commission (JPSC)", "https://jpsc.gov.in/uni_notice.php", "jpsc.gov.in", jpscNoticesAdapter),
];
