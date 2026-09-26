`# GovernIT — One-Stop Government Opportunity Finder

GovernIT is a unified, verified destination for Indian citizens and job-seekers to discover government exams, recruitments, and public schemes in one place. Every listed opportunity links directly to official government portals and notifications with transparent verification timestamps.

---

## Key Features

- **Government Exams & Recruitments:** Comprehensive listings for UPSC, SSC, Railways, Banking, Defense, and State PSCs with dynamic countdowns for application windows and exam dates.
- **Government Schemes:** Citizen welfare, student scholarships, youth skill programs, and business benefits categorized by target beneficiaries.
- **Dynamic Status & Days-Left Engine:** Live-computed status indicators (Open, Closing Soon, Closed, Upcoming, Completed) calculated at read time in Indian Standard Time (IST).
- **Official Source Verification:** Strict anti-fabrication standards — every opportunity requires an official notification link and recorded verification timestamp.
- **Verified Admin Dashboard:** Protected administration console for creating, updating, verifying, and publishing opportunities.

---

## Tech Stack

- **Framework:** Next.js (App Router) + React 19 + TypeScript
- **Styling:** Tailwind CSS v4
- **Database & ORM:** PostgreSQL + Prisma
- **Validation:** Zod schemas for input validation and boundaries
- **Testing:** Vitest for unit & integration testing
- **Icons:** Lucide React

---

## Getting Started

### 1. Prerequisites
- Node.js 20+ (Node 24 recommended)
- PostgreSQL database (local, Docker, or managed cloud instance)

### 2. Setup Environment
```bash
cp .env.example .env
```
Ensure your `DATABASE_URL` is set properly in `.env`.

### 3. Install Dependencies
```bash
npm install
```

### 4. Database Setup
```bash
npx prisma migrate dev
npm run db:seed
```

### 5. Run the Application
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser.

### 6. Run Quality Checks
```bash
npm run typecheck
npm run lint
npm run test
```

---

## Disclaimer
GovernIT is an independent information aggregation platform and is not affiliated with or endorsed by any government entity. All opportunities are cross-referenced with authoritative official government publications.
