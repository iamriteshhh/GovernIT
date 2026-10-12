# GovernIT operations guide

## 1. Environments and secrets

All configuration comes from environment variables. `.env.example` lists every variable with placeholders only.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` / `POSTGRES_PORT` | Used by `docker-compose.yml`. There is one source of truth: the same values build `DATABASE_URL`. |
| `ADMIN_SECRET`, `AUTH_SECRET` | At least 32 characters. `AUTH_SECRET` signs admin sessions. |
| `ADMIN_USERS` | `login:password` pairs, comma separated (login may be an email). The only accounts that can sign in at `/admin/login`. There is no public link to the admin pages. |
| `CRON_SECRET` | Bearer token for the scheduled-check endpoint. Required in production. |
| `NEXT_PUBLIC_APP_URL` | Public base URL. When it starts with `https://`, the CSP adds `upgrade-insecure-requests`. |

**Rotate exposed credentials.** Commit `1eea54d` (and earlier history) contains a `docker-compose.yml` with hard-coded admin, auth and database passwords. Removing them from the current files does not remove them from git history. Treat every value from that file as public. Change them in every environment that ever used them. The old built-in development defaults in `src/lib/env.ts` are removed for the same reason.

The vitest config injects test-only credentials, so tests never read the real secrets.

## 2. Database

- Local: `docker compose up -d postgres`. It binds to `127.0.0.1:${POSTGRES_PORT}` (default 5433, to avoid a native Postgres on 5432).
- Apply migrations: `npm run db:migrate` (`prisma migrate deploy`). The Docker image runs this automatically on start.
- Migrations:
  - `0_init` is the baseline (the schema as it was before this work).
  - `1_canonical_period_lifecycle_monitoring` moves scheme deadlines into `application_periods` and adds lifecycle, link kind, programme end and the monitoring tables.
- **Existing databases created with `db push`** (no migration history):
  1. Mark the baseline as applied: `npx prisma migrate resolve --applied 0_init`.
  2. Run `npm run db:migrate`.
  3. The backfill copies `schemes.deadline` into `application_periods.closes_at`. If an admin-written period already exists, it wins. Schemes with no deadline become `is_rolling = true`, which keeps their old "ongoing" meaning. The `deadline` column is then dropped, so no temporary precedence rule remains in code.
- Seed (`npm run db:seed`) is for development only. It deletes all data. It writes **no verifications and no dates**: the original dataset's dates were generated relative to "now", so they were invented. Real dates enter through the source pipeline and admin review.

## 3. Scheduled source checks

Each check is bounded in time and source count. It is idempotent and protected against overlap: every source has a lock row (`locked_until`), so concurrent runs skip a source that is already being checked. Every run writes a `job_runs` row and one `source_checks` row per source. The site keeps working if the job never runs: listings then age into "Verification overdue".

Choose one scheduler.

**Hosted cron (for example Vercel Cron, Render cron, GitHub Actions):**

```
GET https://<your-host>/api/cron/check-sources
Authorization: Bearer <CRON_SECRET>
```

Run it every 1–3 hours. Each source has its own `check_interval_minutes` (TNPSC 360, BPSC 180), so a run checks only the sources that are due. The endpoint returns 401 for a wrong token and 503 if `CRON_SECRET` is unset.

**GitHub Actions (free, for a deployed site):** `.github/workflows/check-sources.yml` calls the endpoint every hour once the repository secrets `GOVERNIT_URL` and `CRON_SECRET` are set.

**This Windows PC (installed):** the scheduled task `GovernIT-Sources` runs `scripts/run-scheduled-check.ps1` every hour. That script starts the Postgres container if needed, then runs `npm run sources:check`, writing to `logs/sources.log`. Manage the task with `scripts/schedule-windows.ps1` (`-Remove` uninstalls it).

**Self-hosted (Docker / VM):** use the host's cron to call the endpoint above, or run the script:

```bash
# crontab -e   (every 2 hours)
0 */2 * * * cd /srv/governit && npm run sources:check >> /var/log/governit-sources.log 2>&1
```

**Windows (local):**

```powershell
schtasks /Create /SC HOURLY /MO 2 /TN GovernIT-Sources /TR "cmd /c cd /d C:\path\to\GovernIT && npm run sources:check"
```

**Manual:** admins can use **Admin → Sources & review queue → Check now**. It allows one manual check per source every 2 minutes.

The script also runs up to 10 link checks per run. The endpoint runs up to 5, and only if time is left in its budget.

## 4. What the pipeline does with a result

```
fetch (allowlisted host, public IP only, timeout, size cap, per-host spacing, retries with backoff + jitter, conditional request)
  -> adapter parses -> Zod + domain validation -> compare with the stored record
  -> empty field + unambiguous official value      : filled automatically (audit log, AUTO_APPLIED entry)
  -> value differs, ambiguous, or new notification : review queue (PENDING)
  -> all stated values match                       : verification recorded ("auto:<adapter>@<version>")
  -> fetch/parse failure                           : recorded; records, snapshot and etag untouched
```

- Failure is never closure. A failed fetch, empty parse or layout change never edits, closes or deletes a listing. Three consecutive failures, any parse failure, and any blocked response create a `PARSER_FAILURE` review item.
- A cancellation or withdrawal is only ever applied by a reviewer. An adapter may raise a `STATUS_CHANGE` signal; it cannot apply it.
- New opportunities are approved as **unpublished drafts**. Complete the eligibility text in the editor, then publish.
- Rejecting an item changes no data. Every decision writes an `audit_logs` row with the reviewer, the note and the evidence URL.

## 5. Freshness policy

Thresholds are in `src/domain/freshness.ts` (`FRESHNESS_POLICY`):

| Type | Re-check due after | Stale after |
| --- | --- | --- |
| Exam | 72 h | 7 days |
| Scheme | 30 days | 90 days |

A monitored source can tighten these with `monitored_sources.stale_after_hours` (both current sources use 72 h). Stale, unverified, review-pending or failing records:

- show a warning banner on the detail page;
- carry "Status needs confirmation" next to the apply button;
- are listed in a separate **Status needs confirmation** group, never in the verified "Open now" or "Registration closes soon" groups.

## 6. Link checks

- Only hosts under `gov.in` and `nic.in`, plus `tnpscexams.in`, are contacted (`LINK_CHECK_HOSTS` in `src/server/ingestion/link-check.ts`). Other links are recorded as `NOT_ALLOWED` and need a manual check.
- These results are inconclusive and never count as broken: 403/429, bot blocks, TLS chains that browsers can complete themselves, and malformed headers.
- 404/410, 5xx and network errors count as failures. After 2 in a row, the listing shows a caution. After 3 in a row, a `LINK_BROKEN` review item is created. The listing's status never changes.
- Never replace a link with a guessed URL. Copy it from an official page.

## 7. Adding a source adapter

1. Check the source first: robots.txt, terms of use, whether it needs a login or CAPTCHA, and whether a feed, sitemap or API exists. If automated access is refused, stop and keep the source on manual verification.
2. Save real responses under `tests/fixtures/sources/`. Strip session tokens and viewstate blobs.
3. Create `src/server/ingestion/adapters/<id>.ts` and export a `SourceAdapter`:
   - `mode: "opportunities"` when the source states dates, or `"signals"` when it only says something changed;
   - `hosts` lists the official hosts it may contact;
   - pure `parse…` functions that return `ParsedNotice` objects with ISO dates converted from IST. If a stated value cannot be parsed, put its field name in `ambiguous` and never guess;
   - throw `ParseError` when the layout is not recognised.
4. Register the adapter in `ADAPTERS` and add a `SOURCE_REGISTRY` row in `src/server/ingestion/adapters/index.ts`. Then run `npm run sources:register`.
5. Add fixture tests to `tests/unit/ingestion-parsers.test.ts`: a normal page, missing fields, a changed layout, an empty parse, and an ambiguous date.
6. Run `npm run sources:check -- --all` once by hand and inspect **Admin → Sources & review queue**.

Some servers send an incomplete TLS chain. In that case, add the missing **public intermediate** to `src/server/ingestion/intermediates.ts`, with its source URL and fingerprint. First verify it chains to a root in Node's trust store. Never disable certificate verification.

## 8. Security notes

- **Outbound fetching (SSRF):** only allowlisted official hosts are contacted, over https (http is allowed for link checks only). Requests never carry credentials. The resolved IP is checked at connect time and must be public; NAT64 addresses are judged by their embedded IPv4. Every redirect target is re-validated. Responses are limited by timeout and size, and fetched content is never executed. Logs and `source_checks.error` never contain cookies, headers or query strings.
- **Admin:** HMAC-signed session cookie, login rate limiting, an origin/referer CSRF check on state-changing `/api/admin/*` requests, and authorisation checked again in every handler. The proxy (`src/proxy.ts`, formerly `middleware.ts`) runs on the Node.js runtime.
- **Scheduled endpoint:** bearer token compared in constant time.
- **Health** (`/api/health`): reports only database connectivity and ingestion state (last scheduled run, failing sources, pending reviews). It returns 503 only when the database is down.
- **Docker:** `.dockerignore` keeps `.env` out of the build context.

## 9. Observability (where to look)

| Question | Where |
| --- | --- |
| Last attempted / successful check per source, consecutive failures, next check | Admin → Sources (`monitored_sources`) |
| What changed, which adapter version, HTTP status, items parsed | Recent checks (`source_checks.change_summary`, `parser_version`) |
| Pending reviews | Review queue (`change_candidates` with `state = PENDING`) |
| Listings with stale or missing verification | "Listings needing confirmation" on the Sources page |
| Last scheduled run, succeeded / failed / queued counts | `job_runs`, `/api/health` |
| Material data changes | `audit_logs` and the "Recent audit trail" panel |

Server logs use one-line prefixes: `[SOURCE JOB]`, `[HOME] DB_UNAVAILABLE: …`, `[ADMIN_…]`.

## 10. Known limits

- Six official sources are automated: TNPSC (dates, auto-published), plus RPSC, PPSC, Kerala PSC, JPSC and BPSC (notices feed). Listings from UPSC, SSC, IBPS, RRB, NTA and most ministries depend on admin verification.
- Notice-feed sources (`mode: "signals"`) only copy official titles, links and stated dates into `official_notices`. They never change any opportunity.
- BPSC notice pages expose no machine-readable title or dates, so its feed entries are titled "BPSC official notice #id".
- TNPSC auto-publish (`monitored_sources.auto_publish`) only applies when every stated field parsed unambiguously and there is no cancellation wording. Drafts created that way still carry "See the official notification" for eligibility.
- The TNPSC adapter reads the dashboard for the current year only. Notification PDFs sit behind a CAPTCHA on the site, so they are linked, never downloaded.
- The contact form is not connected to a backend. It now says so instead of pretending to send.
- Out of scope until approved: eligibility matcher, bookmarks, calendar export, Hindi UI, contact-form backend, reminders, catalogue pagination (listings currently load up to 300 records per page).
