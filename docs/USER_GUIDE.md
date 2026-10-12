# GovernIT user guide

This guide is for the person who runs GovernIT: you, as site owner and admin. It covers:

1. what visitors see;
2. what updates by itself and what doesn't;
3. starting and stopping the site;
4. signing in as admin and setting your email and password;
5. daily admin work;
6. troubleshooting;
7. putting the site on the internet;
8. a cheat-sheet of commands.

For technical details (database, security, adding a new source), see `OPERATIONS.md`.

---

## 1. What visitors see

| Page | What it shows |
| --- | --- |
| **Home** (`/`) | Search, deadline-first sections ("Registration closes soon", "Open now", "Opening soon", "Status needs confirmation", "Dates not announced") and the latest official notices |
| **Exams** (`/exams`) | All exams and recruitments, with filters for category, state and status. Open ones are listed first. |
| **Schemes** (`/schemes`) | Welfare schemes and scholarships |
| **Exam Calendar** (`/upcoming`) | Upcoming exam dates, soonest first |
| **Deadlines** (`/closing-soon`) | Everything still open, ordered by last date. Closed, cancelled and withdrawn listings are left out. |
| **Notices** (`/notices`) | The latest official notices, results and press releases, linked to the official PDFs and pages |
| **Detail page** | Important dates in IST, a live countdown, eligibility, the apply button, the official notification link and the verification history |

How to read a listing:

- **Status badge:** Open, Registration closes soon, Not open yet, Closed, Cancelled and so on. A listing turns to "Closed" the moment its last date passes.
- **"Last verified":** when the dates were last confirmed against an official source.
  - "Not yet verified" or "Verification overdue" means people should check the official notice before acting.
- **Buttons:**
  - **"Apply on Official Site"** or **"Open Official Application"**: shown only when applications are open.
  - **"Official department site"**: shown when the link is only a homepage.
  - **"Official notification"**: always opens the source document.
- **Light/Dark button** (top right): switches the colour theme. The choice is remembered on that device.

---

## 2. What updates by itself, and what doesn't

| Source | What happens automatically |
| --- | --- |
| **TNPSC** (Tamil Nadu) exam dashboard | New exams with clear official dates are **published automatically**. Dates are re-checked every 3 hours. If a date changes, it goes to your review queue. |
| **RPSC** (Rajasthan) news | Titles and links appear on `/notices` automatically |
| **PPSC** (Punjab) public notices | Same: `/notices` |
| **Kerala PSC** exam updates | Same: `/notices` |
| **JPSC** (Jharkhand) notices | Same: `/notices` |
| **BPSC** (Bihar) | New notices appear on `/notices`. The site gives no titles, so they show as "BPSC official notice #…". |
| UPSC, SSC, IBPS, RRB, NTA, banks, central schemes | **Not automatic.** These sites block bots or need a browser. You add and update these listings by hand in the admin panel. |

Important:

- Automatic checks only run while the scheduler runs (section 3). The task on this PC runs every hour, but only while the PC is on, you are logged in, and Docker Desktop is running.
- "Automatic" means within a few hours of the official site changing, not instantly.
- Notices on `/notices` are copied titles and links. Nobody has reviewed them; the page says so.
- Nothing is ever deleted or marked closed because a site was down. Failed checks are logged and shown to you.

---

## 3. Starting and stopping

You need: Docker Desktop and Node.js 22 or newer.

### Start (for daily use on this PC)

1. Open Docker Desktop and wait until it says it is running.
2. In a terminal, in the GovernIT folder, run:
   ```bash
   docker compose up -d postgres
   npm run dev
   ```
3. Open http://localhost:3000.

### Stop

- Press `Ctrl+C` in the terminal running `npm run dev`.
- Optional: `docker compose stop postgres`. The data is kept.

### The hourly scheduler (already installed on this PC)

| Task | How |
| --- | --- |
| See it | Open Windows **Task Scheduler** and look for **GovernIT-Sources** |
| Read its log | `logs\sources.log` in the project folder |
| Run a check right now | `npm run sources:check -- --all` |
| Remove it | `powershell -ExecutionPolicy Bypass -File scripts\schedule-windows.ps1 -Remove` |
| Install it again | `powershell -ExecutionPolicy Bypass -File scripts\schedule-windows.ps1` |

---

## 4. Admin access

There is **no admin link on the public site**. Admin is protected by the login, not by hiding the link.

### Set your admin email and password

1. Open the file `.env` in the project folder.
2. Find the line that starts with `ADMIN_USERS=` and change it to your email and a long password:
   ```
   ADMIN_USERS=you@example.com:A-Long-Password-You-Will-Remember-2026
   ```
   - For several admins, separate the pairs with commas: `a@x.com:pass1,b@y.com:pass2`.
   - Use at least 16 characters. Never share `.env` or commit it to git.
3. Restart the site: press `Ctrl+C`, then run `npm run dev` again.

Only the accounts in `ADMIN_USERS` can sign in. After 5 wrong passwords from the same network (IP) address, sign-in is blocked from it for 15 minutes.

### Sign in

1. Go to **http://localhost:3000/admin/login**. On a live site, use `https://your-domain/admin/login`.
2. Enter your email and password.

| Admin page | What it's for |
| --- | --- |
| `/admin` | Add, edit, publish, archive and verify exams and schemes |
| `/admin/sources` | Source health, the review queue, recent checks, link problems, listings needing confirmation and the audit trail |

---

## 5. Daily admin work (about 10 minutes)

1. **Open `/admin/sources`.**
   - **Review queue:** for each item, click **Open official evidence**, compare the "Current" and "Official source says" columns, type what you checked in the note, then click **Approve** or **Reject**.
     - *New opportunity*: approving creates a **draft**. Open it in `/admin`, fill in eligibility if you want, and tick **Published**.
     - *Date change*: approving updates the dates. If the official date differs from what the source shows, correct it in the date boxes first.
     - *Parser failure / link broken*: means "please look". Fix the listing by hand if needed, then acknowledge.
   - **Source health:** red failures mean a site was down or changed its layout. Listings keep their last good data. Click **Check now** to retry; it allows one check per source every 2 minutes.
2. **Check "Listings needing confirmation".** These are unverified or overdue. Open the official site, then in `/admin` click **Verify** and describe what you checked. Only verify after actually checking.
3. **Add exams the scheduler can't see** (UPSC, SSC, banking and others) in `/admin`, using **New Exam** or **New Scheme**:
   - Enter dates in IST. If you leave the last time empty, 11:59 pm is used.
   - Choose what the URL opens. Never pick "Direct application" for a homepage.
   - Add the official notification URL.
   - Tick "I checked these details…" and write what you checked.
   - New records start as drafts. Edit and tick **Published** when ready.
4. **Cancelled or postponed exams:** edit the listing and set Lifecycle to Cancelled, Withdrawn or Superseded, with a note quoting the official notice. It disappears from the deadline lists straight away.

Everything you change is recorded in the audit trail with your name.

---

## 6. Troubleshooting

| Problem | Fix |
| --- | --- |
| The site says "We could not load … right now" | The database is off. Start Docker Desktop, then run `docker compose up -d postgres`. |
| `npm run dev` fails with "ADMIN_USERS must be…" or "DATABASE_URL is required" | `.env` is missing a value. Compare it with `.env.example`. |
| The scheduler did nothing | Is the PC on, are you logged in, and is Docker Desktop running? Read `logs\sources.log`. |
| A source shows `BLOCKED` or `FETCH_FAILED` | That site refused or is down. Nothing on GovernIT changes. Try **Check now** later. If it keeps failing, add that site's updates by hand. |
| A source shows `PARSE_FAILED` | That site changed its layout. The adapter needs updating; see `OPERATIONS.md`, "Adding a source adapter". |
| You forgot the admin password | Edit `ADMIN_USERS` in `.env` and restart. |

---

## 7. Putting it on the internet (not done yet)

It currently runs only on this PC. To make it public you need:

1. **Hosting:** a server or VPS with Docker, or a platform such as Render, Railway or Fly.io. Use `docker compose --profile app up -d`, or build the `Dockerfile`. Migrations run automatically when the app starts.
2. **A managed PostgreSQL database**, with backups switched on.
3. **A domain and HTTPS.** Set `NEXT_PUBLIC_APP_URL=https://your-domain`.
4. **New, strong values** for `ADMIN_SECRET`, `AUTH_SECRET`, `CRON_SECRET` and `ADMIN_USERS` on the server.
   - **Rotate everything:** the old values in git history (commit `1eea54d`) are public.
5. **The scheduler.** The free GitHub Actions workflow `.github/workflows/check-sources.yml` calls the site every hour. Add the repository secrets `GOVERNIT_URL` and `CRON_SECRET`.
6. **For heavy traffic** (not built yet):
   - a CDN or page caching in front;
   - Redis for rate limits when running more than one server;
   - a load balancer.

---

## 8. Commands cheat-sheet

```bash
docker compose up -d postgres      # start the database
npm run dev                        # run the site at http://localhost:3000
npm run sources:check -- --all     # check every official source now
npm run db:migrate                 # apply database changes after updating the code
npm run db:seed                    # WARNING: wipes all data and loads the demo dataset
npm test                           # run the automated tests (database must be running)
npm run build && npm start         # production build and run
```
