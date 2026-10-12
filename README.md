# GovernIT

An independent finder for Indian government exams, recruitments and public schemes. For every listing it shows:

- whether you can still apply, when registration closes (exact time in IST), and how many days are left;
- when the details were last verified against an official source, and a clear warning when they were not;
- where to apply on the official website, kept separate from the official notification.

GovernIT is not a government website. Always confirm on the official site before paying fees or submitting documents.

## Stack

Next.js (App Router) · React 19 · TypeScript · Tailwind CSS v4 · PostgreSQL + Prisma · Zod · Vitest · Lucide.

## Quick start (local)

Prerequisites: Node.js 22+, Docker Desktop (or any PostgreSQL 16).

```bash
cp .env.example .env          # then replace every "change-me" value
npm install
docker compose up -d postgres # Postgres on 127.0.0.1:5433, credentials from .env
npm run db:migrate            # apply prisma/migrations
npm run db:seed               # development dataset (unverified, no dates)
npm run sources:check -- --all   # optional: poll the official sources once
npm run dev                   # http://localhost:3000
```

The app refuses to start without `DATABASE_URL`, `ADMIN_SECRET`, `AUTH_SECRET` and `ADMIN_USERS`. There are no built-in default passwords.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js development server, production build, production server |
| `npm run typecheck` / `lint` | TypeScript and ESLint |
| `npm test` | All Vitest suites. Integration tests need the database and fail if it is down. |
| `npm run test:unit` | Pure logic and fixture-based adapter tests (no database, no network) |
| `npm run test:integration` | Real-database tests: services, admin writes, source pipeline with fixtures, review flow, authz |
| `npm run test:e2e` | HTTP journeys against a running server (`E2E_BASE_URL`, default `http://localhost:3100`). `-- --outage` also stops and restarts the Docker Postgres. |
| `node scripts/browser-check.mjs` | Headless Chrome checks: no theme flash, theme persistence, keyboard focus, mobile overflow, hydration and console errors |
| `npm run db:migrate` / `db:seed` / `db:reset` | Apply migrations / load the dev dataset / drop, re-migrate and re-seed |
| `npm run sources:check` | Check every due official source (add `-- --all` to check all now) |
| `npm run sources:register` | Upsert the code-defined source registry |

## How status works

- **Application status** comes only from dates and official lifecycle facts: Not announced, Not open yet, Open, Registration closes soon (7 days or less), Closed, Cancelled, Withdrawn, Superseded. A passed deadline is always Closed.
- **Freshness** is a separate axis: Recently verified, Re-check due, Verification overdue, Latest official check failed, Status needs confirmation, Not yet verified. Listings that are not recently verified never appear in the verified "Open" or "Closes soon" groups.
- **Deadlines** for exams and schemes both live in `ApplicationPeriod`. A scheme's programme end (`Scheme.programEndsAt`) is a different fact and is labelled differently.
- **Countdowns** are computed at read time in IST and refresh in the browser at IST midnight, at the opening or closing instant, and every minute during the last 24 hours. No `days_left` is stored.

## Live official sources

Six official sources are automated and were tested against the live sites on 2026-10-12:

| Source | What it provides | What happens |
| --- | --- | --- |
| TNPSC Exam Dashboard (`tnpsc.gov.in`) | Notification number, title, notice PDF, registration open/close (with time), exam date, apply link | Complete, unambiguous records are **auto-published**. Date conflicts and unclear values go to review. Matching records are re-verified on every check. |
| RPSC News and Events (`rpsc.rajasthan.gov.in`) | Dated notice titles + PDF links | Public `/notices` feed |
| PPSC Public Notices (`ppsc.gov.in`) | Dated notice titles + links | Public `/notices` feed |
| Kerala PSC Examination Updates (`keralapsc.gov.in`) | Notice titles + PDF links | Public `/notices` feed |
| JPSC Notices / Press Releases (`jpsc.gov.in`) | Dated press releases + PDF links | Public `/notices` feed |
| BPSC notification sitemap (`bpsc.bihar.gov.in`) | New and updated notice URLs (no titles) | Public `/notices` feed |

UPSC, RBI, NTA exam portals, PIB and india.gov.in refused automated requests (HTTP 403 or 418) and are not monitored. GovernIT does not work around access controls. Listings from those bodies stay on manual verification.

Not automatable for free:
- SSC, UPPSC, OPSC, APPSC and myScheme load their content with JavaScript (no readable HTML).
- IBPS, MPPSC and HPSC disallow bots in robots.txt.
- RRB has a broken certificate; WBPSC timed out.

**Guides:** [docs/USER_GUIDE.md](docs/USER_GUIDE.md) for owners and admins: daily use, admin login and password, the scheduler. [docs/OPERATIONS.md](docs/OPERATIONS.md) for operations: scheduling, review workflow, adding an adapter, security, known limits.
