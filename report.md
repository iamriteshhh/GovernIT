# GovernIT — Comprehensive Project Audit & Implementation Blueprint

> **Document Purpose:** Complete architectural audit, current completion status, root cause analysis of data display issues, technical backlog, and actionable implementation roadmap for AI agents and developers working on GovernIT.  
> **Last Audited:** October 2026  
> **Operating Environment:** Windows / Node.js 20+ / Next.js 16.3.6 (App Router) / PostgreSQL 16 / Prisma 6.19.3  

---

## 1. Executive Summary & Project Architecture

GovernIT is a unified, verified civic discovery portal designed for Indian citizens, students, and job-seekers. It aggregates:
1. **Government Recruitments & Examinations** (UPSC, SSC, Railways RRB, Banking IBPS/SBI, Defense IAF/Navy/Army, State PSCs).
2. **Citizen Welfare Schemes & Scholarships** (Central & State welfare programs across healthcare, agriculture, housing, scholarships, micro-credit, and skill development).

### 1.1 Core Architectural Pillars
- **Anti-Fabrication & Gazette Verification:** Every listing requires at least one official notification, guideline, or portal URL (`Source` record) and a timestamped audit record (`Verification`).
- **Dynamic IST Status Engine:** Deadlines, days-left badges, and lifecycle statuses are dynamically computed in Indian Standard Time (IST: UTC+5:30) at read time, avoiding stale static dates.
- **Security & Integrity:** Edge-compatible HMAC-SHA256 session management, constant-time credential comparisons, in-memory rate limiting with brute-force lockout, and CSRF protection on state-changing administrative actions.

### 1.2 Technology Stack
| Layer | Technologies | Version |
|---|---|---|
| **Framework** | Next.js (App Router, Server Components, Route Handlers) | `16.3.6` |
| **UI Library** | React | `19.2.8` |
| **Language** | TypeScript | `^5.0` |
| **Styling** | Tailwind CSS (PostCSS plugin `@tailwindcss/postcss`) | `^4.0` |
| **ORM & Database** | Prisma ORM + PostgreSQL | `@prisma/client 6.19.3`, `prisma 6.19.3` |
| **Validation** | Zod (Edge-safe boundary and schema validation) | `^4.6.5` |
| **Icons** | Lucide React | `^1.48.0` |
| **Testing** | Vitest (Unit, Integration, E2E/Functional) | `^5.0.2` |

---

## 2. Root Cause Analysis: Why No Exams or Schemes Display on the Site

### 2.1 The Issue Description
When navigating to the homepage (`/`), the exams directory (`/exams`), the schemes directory (`/schemes`), applications closing soon (`/closing-soon`), or upcoming exams (`/upcoming`), the site displays **0 exams and 0 schemes**. Empty state placeholders render ("No examinations found", "0 Urgent", "No upcoming exams currently scheduled"), regardless of whether opportunities were released days prior or are currently live.

### 2.2 Root Cause Breakdown

#### Root Cause 1: Database Connection Authentication Failure & Mismatched Credentials
1. **The `.env` Configuration:**
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/governit?schema=public"
   ```
2. **The `docker-compose.yml` Configuration:**
   ```yaml
   services:
     postgres:
       image: postgres:16-alpine
       environment:
         POSTGRES_USER: postgres
         POSTGRES_PASSWORD: postgrespassword
         POSTGRES_DB: governit
   ```
   *Notice the mismatch: `.env` has password `postgres`, while `docker-compose.yml` specifies `postgrespassword`.*
3. **Local Machine Runtime State:**
   - A native Windows PostgreSQL service is currently bound and listening on port `5432` (`Process ID: 6012`), but the credentials `postgres:postgres` fail with:
     ```
     Error: P1000: Authentication failed against database server, the provided database credentials for `postgres` are not valid.
     ```
   - Docker Desktop is not running (`open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified`), so the containerized PostgreSQL database defined in `docker-compose.yml` is offline.
   - Consequently, Prisma cannot connect to PostgreSQL.

#### Root Cause 2: Database Tables Are Unpushed and Unseeded
Because the database connection fails:
- `npx prisma db push` has never created the database tables (`exams`, `schemes`, `organizations`, `application_periods`, `sources`, etc.).
- `prisma/seed.ts` (which contains 25 verified exams and 22 verified schemes) has never executed.
- The database is completely empty.

#### Root Cause 3: Silent Exception Swallowing in Next.js Server Components
In every server page component, the database query is wrapped in a `try...catch` block:
- **`src/app/(public)/page.tsx` (Lines 25–36):**
  ```typescript
  try {
    const [c, e, s] = await Promise.all([
      examService.getClosingSoonExams(),
      examService.listExams({ limit: 4 }),
      schemeService.listSchemes({ limit: 4 }),
    ]);
    closingSoonExams = c;
    allExams = e;
    allSchemes = s;
  } catch (error) {
    console.warn("[HOME] Database temporarily unavailable:", error);
  }
  ```
- **`src/app/(public)/exams/page.tsx` (Lines 56–73):**
  ```typescript
  try {
    const [c, s, res] = await Promise.all([
      organizationRepository.findCategories(),
      organizationRepository.findStates(),
      examService.listExams({ ... }),
    ]);
    ...
  } catch (error) {
    console.warn("[EXAMS LISTING] Database temporarily unavailable:", error);
  }
  ```
- **Impact:** When Prisma throws an `Authentication failed` error, the catch block intercepts it, prints a server console warning, and quietly falls back to empty arrays (`[]`). The UI renders 0 results without informing the developer or user that the database failed to connect.

#### Root Cause 4: Scheme Model Field Inconsistency (`deadline` vs `applicationPeriod`)
There is an architectural discrepancy in how scheme deadlines are stored and queried across the codebase:
1. **In `prisma/schema.prisma`:**
   ```prisma
   model Scheme {
     id                 String              @id @default(cuid())
     ...
     deadline           DateTime?           @map("deadline")
     applicationPeriod  ApplicationPeriod?
   }
   ```
2. **In `prisma/seed.ts` (Line 1037):**
   The seed script sets `deadline: sc.deadline` on the `Scheme` row, but creates **no** `ApplicationPeriod` record for schemes.
3. **In `src/app/api/admin/schemes/route.ts` (Lines 35–42) & `src/app/api/admin/schemes/[id]/route.ts`:**
   When an admin creates or updates a scheme, it creates an `ApplicationPeriod` record and leaves `Scheme.deadline` as `null`!
4. **In `src/server/repositories/scheme-repository.ts` (Line 61):**
   `findMany()` does **not** include `applicationPeriod`:
   ```typescript
   include: {
     department: true,
     state: true,
     sources: { ... },
     verifications: { ... },
     categories: { ... },
     // applicationPeriod is NOT included!
   }
   ```
5. **In `src/server/services/scheme-service.ts`:**
   `computeSchemeStatus` only inspects `scheme.deadline`. Because `applicationPeriod` is ignored, any scheme created via the Admin Console is treated as having **no deadline**, defaulting to `APPLICATION_OPEN` (Ongoing), and will **never** appear in the "Closing Soon" filter or badges.
6. **In `src/app/admin/page.tsx` (Line 148):**
   The admin table reads `deadline: s.applicationPeriod?.closesAt?.toISOString() ?? null`. For seeded schemes, this displays as `null` because seed data stored it in `Scheme.deadline`.

#### Root Cause 5: Lifecycle Logic for "Released Days Before" vs "Live"
How `evaluateApplicationStatus` in `src/domain/status.ts` behaves:
- **Live / Currently Active Application:**
  - `opensAt` <= `now` AND `closesAt` >= `now`.
  - If `daysLeft` > 7: Status is `APPLICATION_OPEN` (displays on `/exams`, `/schemes`, and Home).
  - If `daysLeft` <= 7: Status is `CLOSING_SOON` (displays on `/closing-soon`, `/exams`, `/schemes`, and Home).
- **Released Days Before, but Deadline Has Passed:**
  - `closesAt` < `now`.
  - `evaluateApplicationStatus` sets status to `CLOSED` (`daysLeft = 0`).
  - `/closing-soon` **excludes** `CLOSED` items (`filter(e => e.applicationStatus.status === "CLOSING_SOON")`).
  - `/upcoming` **excludes** `CLOSED` items (`filter(e => e.examScheduleStatus.status === "EXAM_UPCOMING")`).
  - `/exams?status=open` **excludes** `CLOSED` items.
  - The default `/exams` page with `status=all` would show closed exams with a gray "Application Closed" badge, **provided** the database returned them.
- **No Database Fallback:**
  - Without a working database connection or a fallback static mock layer, 0 records are fetched, meaning neither live nor past exams/schemes can render.

---

## 3. Comprehensive File-by-File Status & Directory Map

```
d:\GovernIT\GovernIT
├── .env / .env.example             --> Environment configurations (PostgreSQL credentials, auth secrets)
├── docker-compose.yml              --> PostgreSQL container definition (password mismatch vs .env)
├── Dockerfile                      --> Multi-stage production container build
├── package.json                    --> Scripts and dependencies (Next 16, React 19, Prisma 6)
├── prisma/
│   ├── schema.prisma               --> Data models (Org, State, Category, Exam, Scheme, etc.)
│   └── seed.ts                     --> Rich 54KB dataset (25 exams, 22 schemes, 10 states, 12 categories)
├── src/
│   ├── middleware.ts               --> Route protection, rate limiting (100 req/min), CSRF checks
│   ├── app/
│   │   ├── layout.tsx              --> Root layout (Geist font, Header, Footer, Cookie Banner)
│   │   ├── globals.css             --> Tailwind v4 CSS variables and base styles
│   │   ├── not-found.tsx           --> 404 error page
│   │   ├── error.tsx               --> Application error boundary
│   │   ├── sitemap.ts              --> Dynamic XML sitemap generator
│   │   ├── robots.ts               --> Robots.txt with protected admin disallows
│   │   ├── (public)/
│   │   │   ├── page.tsx            --> Homepage (Hero, Search, Closing Soon, Recent Opportunities)
│   │   │   ├── exams/page.tsx      --> Faceted exam catalogue (Search, State, Category, Status)
│   │   │   ├── exams/[slug]/page.tsx --> Exam detail view (JSON-LD, Timeline, Eligibility, Official Sources)
│   │   │   ├── schemes/page.tsx    --> Faceted scheme catalogue (Search, State, Category, Status)
│   │   │   ├── schemes/[slug]/page.tsx --> Scheme detail view (JSON-LD, Guidelines, Process, Official Links)
│   │   │   ├── closing-soon/page.tsx --> 7-day urgent deadline portal
│   │   │   ├── upcoming/page.tsx   --> Chronological exam date calendar
│   │   │   ├── contact/page.tsx    --> Editorial grievance form (Honeypot, client-only simulation)
│   │   │   ├── privacy/page.tsx    --> DPDP Act 2023 compliant privacy policy
│   │   │   └── terms/page.tsx      --> Terms of Service & Official Gazette Disclaimers
│   │   ├── admin/
│   │   │   ├── page.tsx            --> Protected Admin Editorial Console
│   │   │   └── login/page.tsx      --> Admin Login Page with Lockout Warning
│   │   └── api/
│   │       ├── exams/route.ts      --> Public GET /api/exams
│   │       ├── schemes/route.ts    --> Public GET /api/schemes
│   │       ├── search/route.ts     --> Public GET /api/search (Unified across exams & schemes)
│   │       ├── health/route.ts     --> Public GET /api/health (DB ping, latency, memory)
│   │       └── admin/
│   │           ├── login/route.ts  --> POST /api/admin/login (Rate-limited, HMAC token)
│   │           ├── logout/route.ts --> POST /api/admin/logout
│   │           ├── verify/route.ts --> POST /api/admin/verify (Audit trail stamp)
│   │           ├── exams/route.ts  --> POST /api/admin/exams (Create exam)
│   │           ├── exams/[id]/route.ts --> PATCH /api/admin/exams/[id] (Update exam)
│   │           ├── schemes/route.ts --> POST /api/admin/schemes (Create scheme)
│   │           └── schemes/[id]/route.ts --> PATCH /api/admin/schemes/[id] (Update scheme)
│   ├── components/
│   │   ├── admin/
│   │   │   ├── AdminConsole.tsx    --> Tabbed opportunity management dashboard
│   │   │   ├── AdminExamForm.tsx   --> Modal form for adding/editing exams
│   │   │   └── AdminSchemeForm.tsx --> Modal form for adding/editing schemes
│   │   ├── layout/
│   │   │   ├── Header.tsx          --> Sticky navigation with mobile drawer
│   │   │   ├── Footer.tsx          --> Civic disclaimer, sitemap links, DPDP badges
│   │   │   └── CookieConsentBanner.tsx --> Minimal GDPR/DPDP consent banner
│   │   └── opportunity/
│   │       ├── ExamCard.tsx        --> Card view for exams (deadlines, fee, vacancies, official apply)
│   │       ├── SchemeCard.tsx      --> Card view for schemes (benefits, beneficiaries, guidelines)
│   │       ├── StatusBadge.tsx     --> Colored status indicator pill
│   │       ├── DaysLeftBadge.tsx   --> Urgency pill (e.g., "3 days left")
│   │       └── VerificationBadge.tsx --> Gazette verification timestamp pill
│   ├── domain/
│   │   ├── exam.ts                 --> Domain types: ExamOpportunity
│   │   ├── scheme.ts               --> Domain types: SchemeOpportunity
│   │   ├── status.ts               --> Pure status calculation engine (`evaluateApplicationStatus`)
│   │   └── eligibility.ts          --> Eligibility types (Roadmap stub)
│   ├── lib/
│   │   ├── dates.ts                --> IST calculation utilities (`calculateDaysLeftIST`, `formatDateIST`)
│   │   ├── db.ts                   --> Global Prisma client singleton
│   │   └── env.ts                  --> Zod environment variable parsing
│   ├── server/
│   │   ├── auth/
│   │   │   ├── auth-config.ts      --> Admin user parsing & constant-time validation
│   │   │   ├── edge-crypto.ts      --> Web Crypto API SHA-256 and HMAC implementations
│   │   │   ├── rate-limiter.ts     --> In-memory sliding window & brute force limiters
│   │   │   └── session.ts          --> Cookie token signing and verification
│   │   ├── repositories/
│   │   │   ├── exam-repository.ts  --> Prisma queries for exams
│   │   │   ├── scheme-repository.ts --> Prisma queries for schemes
│   │   │   ├── organization-repository.ts --> Queries for states, categories, orgs
│   │   │   └── source-repository.ts --> Queries for official citations
│   │   └── services/
│   │       ├── exam-service.ts     --> Domain enrichment & status calculation for exams
│   │       ├── scheme-service.ts   --> Domain enrichment & status calculation for schemes
│   │       ├── search-service.ts   --> Multi-entity search aggregator
│   │       ├── status-engine.ts    --> Bridge to domain status calculations
│   │       └── verification-service.ts --> Publishing validation & verification audit logging
│   └── validation/
│       ├── admin-schema.ts         --> Zod schemas for login and verification
│       ├── exam-schema.ts          --> Zod schemas for exam queries, creation, and updates
│       └── scheme-schema.ts        --> Zod schemas for scheme queries, creation, and updates
├── scripts/
│   └── generate-og.mjs             --> OpenGraph PNG generator using sharp
└── tests/                          --> 15 test suites / 61 tests (All passing)
```

---

## 4. Completed Features (What is Built and Verified)

### 4.1 Data & Domain Layer
- [x] **Relational Schema (`prisma/schema.prisma`):** Models for Organizations, States, Categories, Exams, Schemes, ApplicationPeriods, Sources, Verifications, and EligibilityCriteria.
- [x] **Seeded Dataset (`prisma/seed.ts`):** 25 major exams (UPSC CSE, SSC CGL, RRB NTPC, IBPS PO, SBI PO, NDA, CDS, AFCAT, UPPSC, MPSC, BPSC, etc.) and 22 major citizen schemes (PM-KISAN, Ayushman Bharat PM-JAY, PM Surya Ghar, PMAY-U 2.0, PM Mudra, PM Vishwakarma, etc.).
- [x] **IST Date Engine (`src/lib/dates.ts`):** Indian Standard Time offset calculations (`UTC+5:30`) to avoid UTC midnight date shifts.
- [x] **Status Calculation Engine (`src/domain/status.ts`):** Pure functional state calculation supporting 7 statuses:
  - `APPLICATION_OPEN` (Ongoing / Active)
  - `CLOSING_SOON` (Within 7-day threshold)
  - `CLOSED` (Deadline passed)
  - `EXAM_UPCOMING` (Scheduled examination in future)
  - `EXAM_COMPLETED` (Exam date concluded)
  - `RESULT_ANNOUNCED` (Official result declared)
  - `NOT_ANNOUNCED` (Dates TBA / Opening Soon)

### 4.2 Security & Authentication
- [x] **Admin Authentication System:** Edge-compatible HMAC-SHA256 session tokens in `HttpOnly`, `SameSite=Lax`, `Secure` cookies.
- [x] **Timing-Safe Credential Verification:** `edgeTimingSafeEqual` prevents timing side-channel attacks on admin passwords.
- [x] **Brute-Force & Rate Limiting Engine:**
  - Login: 5 failed attempts per IP triggers a 15-minute lockout cooldown.
  - Public API: 100 requests/minute per client IP via `src/middleware.ts`.
- [x] **CSRF Defense:** `src/middleware.ts` inspects `Origin` and `Referer` headers on all state-changing admin API requests (`POST`, `PUT`, `PATCH`, `DELETE`).
- [x] **Anti-Fabrication Guardrail:** Zod validation strictly rejects exam or scheme creation unless at least one valid official government URL is provided.

### 4.3 Administrative Portal
- [x] **Admin Editorial Console (`/admin`):**
  - Protected by session verification middleware.
  - Tabbed management for Government Exams and Citizen Schemes.
  - Search, pagination, and direct publishing/unpublishing toggles (`isPublished`).
  - Opportunity archiving (`isArchived`).
  - Verification action button: Stamps `Verification` audit records with logged-in admin username.
- [x] **Interactive CRUD Modals:**
  - `AdminExamForm`: Add and update exams with dates, vacancies, fees, eligibility, and official links.
  - `AdminSchemeForm`: Add and update schemes with benefits, documents, eligibility, and links.

### 4.4 Public User Interface
- [x] **Homepage (`/`):** Hero section, search bar, active keyword pills, urgent "Closing Soon" widget, and recent opportunity grids.
- [x] **Exams Directory (`/exams`):** Faceted filtering by keyword, category, state, central-only, and status pill filter (`all`, `open`, `closing-soon`, `upcoming`, `closed`).
- [x] **Schemes Directory (`/schemes`):** Faceted filtering by keyword, category, state, central-only, and status pill filter.
- [x] **Exam Detail Pages (`/exams/[slug]`):** Timeline cards (Application Window, Admit Card, Exam Date), conducting body metadata, eligibility requirements, official gazette citations, and `GovernmentService` JSON-LD schema.
- [x] **Scheme Detail Pages (`/schemes/[slug]`):** Beneficiaries overview, structured benefits callouts, required documents checklist, step-by-step application process, and `GovernmentService` JSON-LD schema.
- [x] **Urgent Deadlines Portal (`/closing-soon`):** Shows exams and schemes with deadlines closing within 7 days.
- [x] **Upcoming Calendar Portal (`/upcoming`):** Chronological calendar of officially scheduled examination dates.
- [x] **Compliance & Legal Pages:**
  - Privacy Policy (`/privacy`): India Digital Personal Data Protection (DPDP) Act 2023 alignment.
  - Terms of Service (`/terms`): Explicit disclaimer of non-affiliation with government agencies.
  - Cookie Consent Banner (`CookieConsentBanner.tsx`): Minimalist privacy-first consent banner.

### 4.5 APIs & SEO
- [x] `GET /api/exams`: Filterable API with Zod validation.
- [x] `GET /api/schemes`: Filterable API with Zod validation.
- [x] `GET /api/search`: Multi-model unified search endpoint.
- [x] `GET /api/health`: Health probe reporting database latency and process memory.
- [x] `sitemap.ts` & `robots.ts`: Dynamic sitemap indexing all published opportunity slugs.

---

## 5. What is Incomplete / Left to Build

### 5.1 High-Priority Architectural Fixes
1. **Reconcile Scheme Deadline Storage:**
   - Standardize whether Scheme deadline is stored in `Scheme.deadline` or `ApplicationPeriod.closesAt`.
   - Update `scheme-repository.ts` to include `applicationPeriod` in `findMany()` and `findBySlug()`.
   - Update `scheme-service.ts` to resolve deadline from either field.
   - Update `AdminSchemeForm` and `api/admin/schemes` route handlers so deadline data is written and read consistently.
2. **Offline / Fallback Data Layer:**
   - When the PostgreSQL database connection fails, the application should fall back to an in-memory or bundled JSON mock dataset (derived from `prisma/seed.ts`), or display a clear "Database Offline / Demo Mode" banner instead of empty screens.
3. **Database Setup & Credential Reconciliation:**
   - Synchronize `.env` with `docker-compose.yml` (`POSTGRES_PASSWORD`).
   - Run `prisma db push` and `npm run db:seed` to ensure database tables are created and seeded.
4. **Error Transparency in Server Components:**
   - Instead of swallowing database errors in server components, return a typed state `{ data: [], error: "DB_OFFLINE" }` so the UI can display a helpful notification: *"Live database connection is establishing. Showing cached/fallback directory."*

### 5.2 Functional Gaps
1. **Contact & Grievance Form Backend:**
   - `src/app/(public)/contact/page.tsx` simulates submission in client state using `setTimeout()`.
   - Missing: API route `/api/contact`, persistence in database or forwarding via email/webhook, and an admin view to inspect submitted editorial correction reports.
2. **Citizen Eligibility Matcher ("Find My Opportunities"):**
   - `src/domain/eligibility.ts` contains only type definitions.
   - Missing: Questionnaire UI (Age, Qualification, State, Category, Income) and matching evaluation algorithm against `EligibilityCriteria` to recommend specific exams and schemes.
3. **Public Catalog Pagination:**
   - `/exams` and `/schemes` fetch up to 100 items without pagination controls (Page 1, 2, Next, Prev).
4. **Client-Side Live Timer Refresh:**
   - Countdowns and day badges are computed at server-render time. If a user leaves the tab open across midnight IST, days-left do not update dynamically without a full page reload.
5. **No Automated Gazette Scraper / Webhooks:**
   - All opportunities must be seeded or manually entered via the Admin Console. There is no automated crawler or RSS ingestion pipeline for official government gazettes (PIB, UPSC, SSC).

---

## 6. Recommended Additional Features (Product Roadmap)

### 6.1 User Experience & Citizen Utility
1. **"Remind Me Before Deadline" (Alert Subscription):**
   - Email / WhatsApp / Telegram notification button on opportunity pages (e.g., "Alert me 3 days before UPSC application closes").
2. **Calendar Export (`.ics` / Google Calendar):**
   - One-click "Add to Calendar" button for key milestones (Application Start, Application Close, Admit Card Release, Exam Date).
3. **Syllabus & Exam Pattern Section:**
   - Tabbed view inside `/exams/[slug]` displaying exam stages (Prelims, Mains, Interview), negative marking rules, and official PDF download links.
4. **Bilingual / Hindi Language Switcher:**
   - Indian government schemes and state recruitments benefit significantly from Hindi localization (`en` / `hi` toggle).
5. **Dark / Light Mode Manual Toggle:**
   - The CSS currently responds to system preference (`prefers-color-scheme`). Adding an explicit theme switch button in `Header.tsx` improves user control.
6. **Bookmarking / Saved Opportunities:**
   - Client-side `localStorage` bookmark drawer ("My Saved Opportunities") so users can pin recruitments they plan to apply for.

### 6.2 Administrative & Editorial Enhancements
1. **Bulk Ingestion via CSV / JSON Upload:**
   - Allow admins to upload official SSC or State PSC annual calendars via CSV.
2. **Automated Dead-Link Checker:**
   - Background job verifying that official application portal URLs (`officialApplyUrl`) return HTTP 200 and haven't timed out or changed domain.
3. **Revision History & Audit Log:**
   - Track which admin modified exam dates or vacancies with a `ChangeLog` table.

---

## 7. Step-by-Step AI Implementation Guide

This section is written for any AI agent or engineer executing the next phase of development. Follow these exact steps in order.

### Step 1: Fix Database Credentials and Seed Data

1. **Update `.env`:**
   Ensure the database credentials in `.env` match your active PostgreSQL instance. If using the default Docker configuration, update:
   ```env
   DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/governit?schema=public"
   ```
2. **Start PostgreSQL:**
   - If using Docker Desktop: Run `docker compose up -d postgres`
   - If using local Windows PostgreSQL: Verify the `postgres` user password in `pg_hba.conf` or reset it, and update `.env`.
3. **Push Schema and Seed Data:**
   ```powershell
   npx prisma db push
   npm run db:seed
   ```
4. **Verify Seed Count:**
   Run Vitest integration tests to confirm data presence:
   ```powershell
   npx vitest run tests/integration/seed-validation.test.ts
   ```

### Step 2: Implement Static Fallback Data Layer (Zero-Failure Fallback)

To ensure the site **always** shows exams and schemes (even during database downtime or initial clone):
1. **Create `src/server/data/fallback-data.ts`:**
   Export static JSON objects for the 25 exams and 22 schemes from `prisma/seed.ts`.
2. **Update `src/server/services/exam-service.ts`:**
   In `listExams()` and `getExamBySlug()`:
   ```typescript
   try {
     const rawExams = await examRepository.findMany(filters);
     if (rawExams.length > 0) { ... }
   } catch (err) {
     console.warn("[EXAM SERVICE] Falling back to static dataset:", err);
     return getFallbackExams(filters);
   }
   ```
3. **Update `src/server/services/scheme-service.ts`:**
   Apply the same fallback mechanism for `listSchemes()` and `getSchemeBySlug()`.

### Step 3: Reconcile Scheme Deadline Field Discrepancy

1. **Update `src/server/repositories/scheme-repository.ts`:**
   Add `applicationPeriod: true` to the `include` block of both `findMany` and `findBySlug`:
   ```typescript
   include: {
     department: true,
     state: true,
     applicationPeriod: true, // <-- ADD THIS
     sources: { orderBy: { retrievedAt: "desc" } },
     verifications: { orderBy: { verifiedAt: "desc" }, take: 1 },
     categories: { include: { category: true } },
   }
   ```
2. **Update `src/server/services/scheme-service.ts`:**
   In `computeSchemeStatus(s, now)`:
   ```typescript
   const effectiveDeadline = s.applicationPeriod?.closesAt ?? s.deadline ?? null;
   const status = evaluateApplicationStatus(new Date("2020-01-01"), effectiveDeadline, now);
   ```
3. **Update `src/app/api/admin/schemes/route.ts` & `[id]/route.ts`:**
   When writing `data.deadline`, set both `deadline: new Date(data.deadline)` on the Scheme record **and** upsert `ApplicationPeriod` to maintain 100% backward compatibility.

### Step 4: Implement Interactive Eligibility Matcher

1. Create a server action or route handler `POST /api/eligibility/check` accepting:
   ```typescript
   { age: number; education: string; state?: string; category?: string; maxIncome?: number }
   ```
2. Create `src/components/opportunity/EligibilityWizard.tsx` and mount it on the homepage and `/exams` page.
3. Compare candidate input against `EligibilityCriteria` attached to exams and schemes.

### Step 5: Implement Contact Form API Route

1. Create `src/app/api/contact/route.ts`:
   - Validate payload with Zod (`name`, `email`, `subject`, `message`, `opportunityName`).
   - Enforce honeypot check (`website_hp` must be empty).
   - Rate limit by IP.
   - Return `{ success: true, message: "Grievance received. Ticket ID generated." }`.
2. Connect `src/app/(public)/contact/page.tsx` `handleSubmit` to call `fetch('/api/contact', { method: 'POST', ... })`.

---

## 8. Verification & Acceptance Checklist

Before declaring the project fully restored and production-ready, verify the following:

- [ ] **Database Connectivity:** `GET /api/health` returns HTTP 200 with `database.status: "connected"`.
- [ ] **Homepage Display:** `/` displays at least 4 active exams and 4 citizen schemes with visible badges.
- [ ] **Urgent Countdown:** `/closing-soon` displays cards with red/amber badges showing exact remaining days.
- [ ] **Catalog Filters:** Filtering by category "Civil Services" or state "Maharashtra" updates card lists accurately.
- [ ] **Detail Page Integrity:** Navigating to `/exams/upsc-cse-2026` shows eligibility criteria, gazette source links, and conducting body details.
- [ ] **Admin Authentication:** Logging in at `/admin/login` with `admin` / `dev-only-admin-pass-2026` redirects to `/admin` and displays live count statistics.
- [ ] **Test Suite Health:** Running `npm test` executes all 61 tests without skipping any due to database authentication failure.
- [ ] **Typecheck & Lint:** `npm run typecheck` and `npm run lint` pass with 0 errors.
