# SECURITY.md — Universal Web App / Website Hardening Guide for AI Agents

> **Audience:** AI coding assistants (Claude, GPT, Cursor, Copilot, Gemini, etc.) building or editing a website or web app.
> **Purpose:** Give vibecoded projects a strong baseline of security, legal compliance, quality, and cost safety.
> **Honest disclaimer:** No site is 100% secure. This file raises the floor; it does not replace a professional audit, legal review, or penetration test.

---

## 0. How to Use This File

1. **Read this entire file before writing or changing code.**
2. **Audit first.** Scan the project against every section. Produce a short report: `PASS`, `FAIL`, or `N/A` per item.
3. **Fix `FAIL` items in priority order** (see Section 1).
4. **Never invent facts.** Do not make up business addresses, company names, reviews, certifications, statistics, or legal claims. If information is missing, insert a clearly marked placeholder like `[TODO: add registered business address]` and tell the human.
5. **Do not break working features.** Make the smallest change that fixes the issue, then verify.
6. **Verify every fix** with the "Verify" step listed under each item.
7. **Final output:** give the human a checklist of what was fixed, what needs their input, and what could not be done.

### Rules for ambiguity
- If the stack is unknown, detect it (look at `package.json`, `requirements.txt`, `composer.json`, config files) before choosing an implementation.
- If a requirement does not apply (e.g., no payments → no refund policy), mark `N/A` and move on.
- If a legal document is needed, generate a **draft** and tell the human to have it reviewed by a qualified lawyer. You are not a lawyer.

---

## 1. Priority Order

Fix in this order. Do not polish SEO while secrets are leaking.

| Priority | Area | Sections |
|---|---|---|
| **P0 — Critical** | Secrets, HTTPS, abuse/cost protection, input validation | 2, 3, 4, 5 |
| **P1 — High** | Legal pages, privacy, consent, data minimization, spam protection | 6, 7, 8 |
| **P2 — Medium** | Accessibility, performance, mobile, broken links, 404 | 9, 10 |
| **P3 — Standard** | SEO, branding, analytics, conversion | 11, 12 |

---

# PART A — CORE SECURITY (P0)

## 2. Secrets Must Never Reach the Frontend

**Rule:** Anything shipped to the browser is public. API keys, tokens, passwords, database URLs, private keys, and webhook secrets must live **only on the server**.

### Do
- Store secrets in environment variables (`.env`, hosting platform secret manager).
- Add `.env`, `.env.*`, `*.pem`, `*.key`, `serviceAccount*.json` to `.gitignore` **before the first commit**.
- Commit a `.env.example` with fake placeholder values only.
- Call third-party APIs (OpenAI, Anthropic, Stripe secret key, SendGrid, Twilio, etc.) from **backend routes / serverless functions**, never directly from client code.
- Use the *publishable/public* key on the frontend only when the provider explicitly designates it as safe (e.g., Stripe publishable key, Firebase web config with security rules enforced).

### Don't
- Never hardcode keys in source files, HTML, JS bundles, comments, or README.
- Never prefix a secret with a client-exposed prefix: `NEXT_PUBLIC_`, `VITE_`, `REACT_APP_`, `PUBLIC_`, `EXPO_PUBLIC_`, `NUXT_PUBLIC_`. These get bundled into the browser.
- Never log secrets, put them in URLs/query strings, or return them in API responses or error messages.
- Never commit secrets "temporarily".

### Verify
- Search the codebase and build output for patterns: `sk-`, `sk_live`, `AKIA`, `api_key`, `apikey`, `secret`, `password`, `token`, `BEGIN PRIVATE KEY`, `mongodb+srv://`, `postgres://`.
- Check the production bundle (`dist/`, `.next/static/`, `build/`) for the same patterns.
- Check git history. If a secret was ever committed, **tell the human to rotate (revoke and regenerate) it immediately.** Deleting the file is not enough.
- If a proper backend does not exist, create a minimal server-side proxy endpoint to hold the secret.

---

## 3. Force HTTPS

### Do
- Redirect all HTTP → HTTPS with a permanent `301`/`308` redirect.
- Send the HSTS header: `Strict-Transport-Security: max-age=31536000; includeSubDomains` (add `preload` only if the human confirms they want preloading).
- Mark all cookies `Secure`, `HttpOnly` (when JS does not need them), and `SameSite=Lax` (or `Strict`).
- Use only `https://` URLs for assets, APIs, and embeds (no mixed content).

### Add these security headers (adapt to stack)
```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY            # or CSP frame-ancestors 'none'
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Content-Security-Policy: default-src 'self'; ...   # tailor to the site's real sources
```
- Start CSP strict and add only the third-party domains the site genuinely needs. Avoid `unsafe-inline` and `unsafe-eval` where possible.
- Disable server version banners (`X-Powered-By`).

### Express example
```js
import helmet from "helmet";
app.use(helmet());
app.use((req, res, next) => {
  if (req.headers["x-forwarded-proto"] !== "https" && process.env.NODE_ENV === "production") {
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }
  next();
});
```

### Verify
- `curl -I http://yourdomain` returns a 301/308 to `https://`.
- No mixed-content warnings in browser console.
- Headers present in response.

---

## 4. Abuse & Cost Protection (Apply Everywhere)

Vibecoded apps most often fail here: a public endpoint that calls a paid API gets abused and produces a huge bill. **Assume every public endpoint will be attacked.**

### 4.1 Rate Limiting — everywhere
- Apply a **global** rate limit to all routes, plus **stricter per-route limits** on sensitive ones.
- Key limits by **IP and, when authenticated, by user ID/API key**.
- Return `429 Too Many Requests` with a `Retry-After` header.

| Endpoint type | Suggested starting limit |
|---|---|
| Login / signup / password reset | 5 per 15 min per IP + per account |
| Contact / feedback / newsletter forms | 3–5 per hour per IP |
| Public AI / paid-API endpoints | 10–20 per hour per IP (lower if expensive) |
| General API reads | 60–100 per minute per IP |
| Static pages / assets | Handle at CDN/edge |

- Use a shared store (Redis, Upstash, KV, DB) for limits when running multiple instances or serverless; in-memory counters reset and don't scale.
- Prefer a CDN/WAF (Cloudflare, Vercel Firewall, AWS WAF) as an outer layer in addition to app-level limits.

```js
// Express example
import rateLimit from "express-rate-limit";
app.use(rateLimit({ windowMs: 60_000, max: 100, standardHeaders: true }));
app.use("/api/login", rateLimit({ windowMs: 15 * 60_000, max: 5 }));
```

### 4.2 Request Throttling
- Throttle = slow or queue bursts, not just reject them.
- Limit **concurrent** requests per user/IP (e.g., max 2 in-flight AI calls).
- Add **request timeouts** (e.g., 10–30 s) and **body size limits** (e.g., `express.json({ limit: "100kb" })`).
- Cap file upload size, count, and allowed MIME types. Validate type by content, not just extension.
- Limit pagination (`limit` max 100) and query complexity (GraphQL depth/cost limits).

### 4.3 Usage Quotas
- Enforce **per-user and per-IP quotas** on the server: daily/monthly caps on AI calls, emails sent, SMS, uploads, exports, signups.
- Track usage in the database. Check quota **before** calling the paid service.
- Show users a clear message when quota is reached; never silently fail.
- Free tier or anonymous users get **small** quotas; require login/CAPTCHA for more.

### 4.4 CAPTCHA / Bot Challenge
- Add a CAPTCHA (**Cloudflare Turnstile**, hCaptcha, or reCAPTCHA v3) to: signup, login (after failed attempts), contact forms, password reset, and any public endpoint that triggers cost or email.
- **Verify the CAPTCHA token on the server.** Client-only checks are worthless.
- Prefer privacy-friendly, low-friction options (Turnstile / hCaptcha). If a third-party CAPTCHA sets cookies or processes data, disclose it in the Privacy Policy and consent banner.

```js
// Server-side Turnstile verification (concept)
const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
  method: "POST",
  body: new URLSearchParams({ secret: process.env.TURNSTILE_SECRET, response: token, remoteip: ip }),
});
const { success } = await r.json();
if (!success) return res.status(400).json({ error: "Verification failed" });
```

### 4.5 Cost Controls
- Set **hard spending limits and billing alerts** on every paid provider (OpenAI, Anthropic, AWS, GCP, Vercel, Supabase, Twilio, etc.). Tell the human to configure these in the provider dashboard if they can't be set in code.
- Set `max_tokens` / output limits and cap input length on every LLM call.
- Choose the cheapest model that does the job.
- **Cache** repeated expensive results.
- Add a **global kill switch** (env var like `DISABLE_AI=true`) that turns off paid features fast.
- Add a **daily global budget counter**: if total spend/calls exceed the cap, stop serving paid features and show a friendly message.
- Never let the client choose the model, token limit, or any billing-relevant parameter.
- Log usage per user and alert on spikes.

### Verify
- Hit each endpoint 100× quickly; confirm `429` appears.
- Confirm paid endpoints refuse requests without CAPTCHA/auth/quota.
- Confirm no endpoint calls a paid API with user-controlled cost parameters.

---

## 5. Input Validation, Forms & Spam Protection

### 5.1 Form Validation
- **Validate on both client and server.** Server validation is mandatory; client validation is only for UX.
- Use a schema library (Zod, Joi, Yup, Pydantic, etc.) with an **allow-list**: define exactly which fields, types, lengths, and formats are accepted. Reject everything else.
- Validate: required fields, email format, phone format, max lengths, number ranges, enum values, URL schemes (allow only `http`/`https`).
- Show clear, specific, accessible error messages next to the field (associate with `aria-describedby`; don't rely on color alone).
- Trim and normalize input. Reject unexpectedly large payloads.
- Use correct input types and attributes: `type="email"`, `autocomplete`, `inputmode`, `required`, `maxlength`.

### 5.2 Injection & XSS Prevention
- Use **parameterized queries / ORM** — never concatenate user input into SQL/NoSQL queries or shell commands.
- Escape/encode output. Avoid `innerHTML`, `dangerouslySetInnerHTML`, `v-html`, `eval`, `document.write` with user data. If rich text is required, sanitize with DOMPurify (or server-side equivalent).
- Never pass user input to `exec`, `system`, `child_process`, or file paths without strict validation (prevent path traversal).
- Protect state-changing requests from CSRF (SameSite cookies, CSRF tokens, or custom header checks).
- Prevent open redirects: validate redirect targets against an allow-list.
- Prevent SSRF: never fetch arbitrary user-supplied URLs server-side without allow-listing and blocking internal IP ranges.

### 5.3 Authentication & Authorization (if the app has accounts)
- Never roll your own crypto. Use a vetted auth provider/library (Auth.js, Clerk, Supabase Auth, Firebase Auth, Passport, Devise, etc.).
- Hash passwords with **Argon2id or bcrypt** (never MD5/SHA-1/plain).
- Offer MFA where practical. Use secure, expiring sessions; rotate on login.
- **Authorize on the server for every request** — check that the logged-in user owns/can access the specific resource (prevents IDOR). Never trust hidden fields or client-side role checks.
- If using Supabase/Firebase/similar: **enable Row Level Security / security rules** on every table/collection. A public database with open rules is the #1 vibecoding breach.
- Use generic error messages for login ("Invalid email or password"). Don't reveal which part was wrong.

### 5.4 Spam Protection (forms, comments, signups)
Layer these; no single measure is enough:
1. **CAPTCHA** (Section 4.4).
2. **Honeypot field** — a hidden input real users never fill; reject submissions where it has a value. Hide with CSS and `aria-hidden="true"` / `tabindex="-1"` (not `display:none` only, which some bots detect).
3. **Rate limiting** per IP/email (Section 4.1).
4. **Time-to-submit check** — reject forms submitted in under ~2–3 seconds.
5. **Server-side content checks** — block excessive links, known spam patterns, disposable email domains if appropriate.
6. **Email verification** for signups and double opt-in for newsletters.
7. Moderate user-generated content before public display where feasible.

### Verify
- Submit invalid, oversized, and malicious payloads (`<script>alert(1)</script>`, `' OR 1=1 --`, 10 MB string); confirm safe rejection.
- Disable JavaScript and submit directly with `curl`; confirm the server still validates.
- Try accessing another user's resource ID; confirm `403/404`.

---

# PART B — LEGAL, PRIVACY & TRUST (P1)

> You are drafting, not giving legal advice. Always flag drafts for human/lawyer review. Do not copy another company's policy verbatim.

## 6. Required Pages

### 6.1 Privacy Policy (`/privacy` or `/privacy-policy`)
Must exist, be linked in the **footer of every page**, and be linked at every data-collection point (forms, signup, checkout). It must accurately describe what the site **actually** does. Include:
- Who you are (business/owner name, contact email, address if a business)
- What personal data is collected (forms, accounts, payments, cookies, analytics, logs, IP addresses)
- Why it's collected and the legal basis (where GDPR applies: consent, contract, legitimate interest)
- Who it's shared with (payment processors, analytics, email provider, hosting, CAPTCHA, ad networks) — list real third parties used
- Cookies and tracking technologies used
- How long data is retained
- User rights (access, correction, deletion, portability, objection, withdraw consent; CCPA/CPRA "do not sell/share" where relevant; India DPDP rights where relevant)
- How to exercise rights (a working contact method)
- Security measures (brief, honest, no overpromising)
- International transfers (if applicable)
- Children's data statement (e.g., not directed at under-13/16)
- Date of last update
- How policy changes are communicated

**Do not copy claims you can't back up** (e.g., "we never share data" if analytics is installed).

### 6.2 Terms and Conditions (`/terms`)
Link in footer. Include: acceptance of terms, description of service, eligibility/age, account responsibilities, acceptable use / prohibited conduct, intellectual property, user-generated content license, payments/subscriptions/cancellation (if relevant), disclaimers, limitation of liability, termination, governing law/jurisdiction, changes to terms, contact information, last-updated date.
- If the site has signup, add a checkbox "I agree to the Terms and Privacy Policy" (unchecked by default, links included).

### 6.3 Refund / Cancellation Policy (`/refund-policy`) — **only if the site takes payments**
- State clearly: whether refunds are offered, time window, conditions, how to request, processing time, non-refundable items, subscription cancellation steps, and contact method.
- Link it in the footer and on checkout/pricing pages. Many payment processors require it.
- Make it match what the business actually does.

### 6.4 Business Details — **if it is a business website**
Display real, verifiable information (footer and/or `/contact`, `/about`):
- Legal business name and trading name
- Registration/tax ID number where legally required
- Physical/registered address
- Working email and phone
- Support hours
- Grievance/data-protection contact where required by local law

**Never fabricate these.** Use `[TODO]` placeholders and notify the human.

## 7. Cookies, Consent & Tracking

### 7.1 Cookie Consent Banner
- Show a banner on first visit **before** setting non-essential cookies or loading non-essential scripts (analytics, ads, marketing pixels, social embeds, some CAPTCHAs).
- Provide equally prominent **Accept** and **Reject** buttons, plus **Manage preferences** (categories: Necessary, Analytics, Marketing, Preferences).
- **No pre-ticked boxes** for non-essential categories. No "dark patterns" (hidden reject, guilt-trip wording).
- Do **not** load tracking scripts until consent is granted. Block them in code, not just visually.
- Store the user's choice, honor it, and allow changing/withdrawing it anytime (footer link: "Cookie settings").
- Link to the Privacy Policy / Cookie Policy.
- Strictly necessary cookies (session, security, load balancing) don't need consent but should be disclosed.
- Use a reputable open-source or vetted consent manager if possible (e.g., CookieConsent by Orestbida, Klaro, Cookiebot, Osano) rather than custom logic.

### 7.2 Check Tracking
- Inventory **every** script, pixel, tag, SDK, and cookie: Google Analytics, Meta Pixel, TikTok Pixel, LinkedIn Insight, Hotjar, Clarity, chat widgets, ad scripts, etc.
- Remove anything not needed. Every remaining tracker must be (a) disclosed in the Privacy Policy and (b) gated by consent where required.
- Enable IP anonymization and minimal data retention in analytics settings.
- Verify with browser DevTools → Network/Application tabs: with consent *declined*, no tracker requests or non-essential cookies should appear.

### 7.3 Form Consent
- Next to every form that collects personal data: short purpose text + link to Privacy Policy.
- Marketing/newsletter opt-in must be a **separate, unchecked** checkbox. Never bundle it with terms acceptance.
- Record consent (timestamp, text version, IP if needed) when legally required.
- Provide an easy unsubscribe in every marketing email.

### 7.4 Only Collect Necessary Data (Data Minimization)
- For every field, ask: *Do we truly need this?* If not, delete it.
- Don't ask for phone number, date of birth, address, or full name unless the feature requires it.
- Don't store sensitive data (government IDs, health info, full card numbers, passwords in plain text) unless essential and properly protected. **Never store raw card data** — use Stripe/PayPal/Razorpay etc.
- Set retention periods; delete old data. Provide a way to delete accounts and data.
- Don't log personal data unnecessarily; mask emails/IPs in logs where possible.

### 7.5 Check 3rd-Party Embeds & Scripts
- List every external embed: YouTube, Google Maps, social feeds, widgets, fonts, CDNs, chat, calendars.
- Remove unneeded ones. They leak visitor data, slow the site, and can be a supply-chain risk.
- Use privacy-enhanced modes (`youtube-nocookie.com`) or click-to-load placeholders until consent.
- Self-host fonts and libraries when practical.
- For external scripts/styles from CDNs, add **Subresource Integrity** (`integrity="sha384-..."` + `crossorigin="anonymous"`) and pin exact versions.
- Add `sandbox` and `loading="lazy"` to iframes; restrict with CSP `frame-src`.
- Run dependency audits (`npm audit`, `pip-audit`, Dependabot/Renovate) and update vulnerable packages. Remove unused dependencies.

## 8. Content Honesty & Trust

### 8.1 Remove Fake Reviews & Testimonials
- Delete invented testimonials, fake star ratings, fake user counts ("10,000+ happy customers"), fake logos ("As seen on…"), stock-photo "customers" presented as real people, and fake countdown timers/scarcity ("Only 2 left!").
- Fake reviews violate consumer-protection law (FTC in the US, CMA in the UK, EU rules, India's CCPA guidelines) and destroy trust.
- Only show reviews that are real, attributable (with permission), and unedited. If none exist, remove the section or use a clearly labeled placeholder `[TODO: add real testimonials with consent]`.

### 8.2 Remove Unsupported Claims
- Remove or substantiate: "#1", "best", "guaranteed results", "100% secure", "unhackable", "risk-free", "clinically proven", "certified", "award-winning", "used by Fortune 500", medical/financial/legal promises, and any statistic without a source.
- Replace with accurate, specific, verifiable statements. Add citations/links for data.
- Don't display security badges, compliance logos (SOC 2, ISO 27001, GDPR-compliant, HIPAA), or trust seals unless they are genuinely held.
- Don't claim "we never store your data" or "bank-grade encryption" unless true and verified.

### 8.3 Disclosures
- Disclose affiliate links, sponsored content, and AI-generated content where required/appropriate.
- Clearly separate ads from content.

---

# PART C — ACCESSIBILITY, PERFORMANCE & QUALITY (P2)

## 9. Accessibility, Mobile & Usability

### 9.1 Fix Accessibility (target WCAG 2.2 AA)
- Use **semantic HTML**: `<header>`, `<nav>`, `<main>`, `<footer>`, `<button>`, `<a>`, headings in logical order (one `<h1>`, no skipped levels).
- Every interactive element is **keyboard reachable and operable**, with a **visible focus indicator**. Never remove `outline` without replacing it.
- Add a "Skip to main content" link.
- Every form input has a visible `<label>` (or `aria-label` when truly unavoidable). Errors are announced and tied to fields.
- Set `<html lang="en">` (correct language).
- Use ARIA only when native HTML can't do the job. Bad ARIA is worse than none.
- Modals trap focus and close with `Esc`; return focus on close.
- Don't convey information by color alone.
- Respect `prefers-reduced-motion`. Avoid auto-playing audio/video; provide pause controls. No flashing content (>3 flashes/sec).
- Provide captions/transcripts for video and audio.
- Touch targets at least 44×44 px (24×24 CSS px absolute minimum).
- Allow zoom: never use `user-scalable=no` or `maximum-scale=1`.
- **Verify:** run axe DevTools / Lighthouse Accessibility / WAVE; tab through the whole page with a keyboard; test with a screen reader if possible.

### 9.2 Alt Text on Images
- Every `<img>` has an `alt` attribute.
- **Informative images:** concise, specific description of content/purpose (≈5–15 words). Don't start with "image of".
- **Decorative images:** `alt=""` (empty, but present), or use CSS background.
- **Linked images / icons-as-buttons:** alt describes the destination/action ("Download PDF"), not the picture.
- **Charts/complex images:** short alt + longer description nearby.
- Don't keyword-stuff. Text inside images must also appear as real text.
- Add `aria-label` or `<title>` to meaningful inline SVGs; `aria-hidden="true"` on decorative ones.

### 9.3 Fix Color Contrast
- Minimum ratios (WCAG AA): **4.5:1** for normal text, **3:1** for large text (≥24px, or ≥18.66px bold) and for UI components/icons/focus indicators.
- Check text over images/gradients, placeholder text, disabled states, links, and buttons.
- Fix by darkening text, lightening backgrounds, or adding an overlay. Use CSS variables for the palette so fixes are global.
- Support dark mode with its own verified contrast if offered.
- **Verify:** Lighthouse, axe, or a contrast checker (WebAIM).

### 9.4 Make It Mobile Friendly
- Include `<meta name="viewport" content="width=device-width, initial-scale=1">`.
- Use responsive layout (flexbox/grid, relative units, media/container queries). Design **mobile-first**.
- No horizontal scrolling at 320 px width.
- Body text at least 16 px; spacing comfortable; tap targets ≥ 44 px with space between.
- Use correct mobile input types (`email`, `tel`, `number`) and `autocomplete`.
- Make navigation usable on small screens (accessible hamburger menu).
- Make tables scroll or restack; make images/videos fluid (`max-width: 100%; height: auto`).
- Avoid hover-only interactions.
- **Verify:** test at 320, 375, 768, 1024, 1440 px and on a real phone if possible; run Lighthouse mobile.

## 10. Performance, Links & Errors

### 10.1 Compress Images
- Convert to modern formats: **WebP or AVIF** (with JPEG/PNG fallback via `<picture>` when needed). Use SVG for logos/icons.
- Size images to their displayed dimensions; never ship a 4000 px image for a 400 px slot.
- Targets: hero image ideally **< 200 KB**, most images **< 100 KB**, icons as SVG.
- Use `srcset` and `sizes` for responsive images.
- Always set `width` and `height` (or `aspect-ratio`) to prevent layout shift (CLS).
- Add `loading="lazy"` to below-the-fold images; do **not** lazy-load the main hero/LCP image (give it `fetchpriority="high"`).
- Compress with Squoosh, ImageOptim, `sharp`, `cwebp`, or the framework's image component (`next/image`, Astro `<Image>`).
- Compress video; prefer streaming hosts or short optimized MP4/WebM; never autoplay heavy video on mobile.
- Strip EXIF metadata (location data!) from uploaded/user images.

### 10.2 Check Page Load Speed
- Run **Lighthouse / PageSpeed Insights** on key pages (mobile + desktop). Targets:
  - **LCP** < 2.5 s
  - **INP** < 200 ms
  - **CLS** < 0.1
  - Lighthouse Performance ≥ 90 (aim, don't obsess)
- Common fixes: compress images, minify and tree-shake JS/CSS, code-split, defer/async non-critical scripts, remove unused libraries and third-party widgets, preload critical fonts (`font-display: swap`), use a CDN, enable Brotli/gzip, set long-lived `Cache-Control` for hashed static assets, avoid render-blocking resources, reduce DOM size.
- Report before/after scores to the human.

### 10.3 Custom 404 Page
- Create a branded `404` page that returns the real **HTTP 404 status** (not 200).
- Include: clear message ("Page not found"), site navigation, search or links to popular pages, and a link home.
- Keep it accessible and mobile-friendly. Don't leak stack traces or server info.
- Also create generic user-friendly `500` / error pages that reveal no technical details.
- Framework hints: Next.js `not-found.tsx`/`404.tsx`; Astro `404.astro`; Nginx `error_page 404`; Apache `ErrorDocument 404`; Express catch-all middleware last.

### 10.4 Fix Broken Links
- Check all internal links, external links, images, scripts, stylesheets, and anchors (`#section`) for 404s.
- Use a crawler/checker (`linkinator`, `broken-link-checker`, Lighthouse, Screaming Frog free tier).
- Fix by correcting the URL, adding a `301` redirect from old URLs to new ones, or removing the link.
- No `href="#"` placeholders or `javascript:void(0)` links left in production.
- External links opened in a new tab get `rel="noopener noreferrer"`.
- Make sure footer links (Privacy, Terms, Contact) actually go to real pages.

---

# PART D — SEO, BRANDING & GROWTH (P3)

## 11. SEO & Sharing

### 11.1 Meta Titles + Descriptions
Every indexable page gets a **unique** title and description:
```html
<title>Primary Keyword – Brand Name</title>          <!-- ~50–60 characters -->
<meta name="description" content="Clear, honest summary with a reason to click." />  <!-- ~140–160 characters -->
<link rel="canonical" href="https://example.com/page" />
```
- Write for humans first; no keyword stuffing; no duplicate titles; no misleading claims.
- One `<h1>` per page that matches the page intent.
- Add `<meta name="robots" content="noindex">` to pages that shouldn't be indexed (thank-you pages, admin, staging, search results, login).
- Add structured data (JSON-LD) where useful: `Organization`, `LocalBusiness`, `Product`, `Article`, `FAQPage`, `BreadcrumbList`. Only mark up content truly visible on the page.

### 11.2 Social Preview Image (Open Graph / Twitter)
```html
<meta property="og:title" content="Page Title" />
<meta property="og:description" content="Short description" />
<meta property="og:image" content="https://example.com/og-image.png" />
<meta property="og:image:alt" content="Describe the image" />
<meta property="og:url" content="https://example.com/page" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Brand Name" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Page Title" />
<meta name="twitter:description" content="Short description" />
<meta name="twitter:image" content="https://example.com/og-image.png" />
```
- Image: **1200×630 px**, under ~300 KB, PNG/JPG/WebP, readable text, important content centered, **absolute HTTPS URL**.
- Provide a default image site-wide and custom ones for key pages.
- Test with the Facebook Sharing Debugger, LinkedIn Post Inspector, and social card validators.

### 11.3 Favicon
- Provide: `favicon.ico` (32×32 or multi-size), `favicon.svg`, `apple-touch-icon.png` (180×180), and PWA icons `192×192` and `512×512` in `site.webmanifest` (if applicable).
```html
<link rel="icon" href="/favicon.ico" sizes="32x32" />
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<link rel="manifest" href="/site.webmanifest" />
<meta name="theme-color" content="#ffffff" />
```
- It must be recognizable at 16 px. Confirm no 404 for `/favicon.ico`.

### 11.4 Sitemap + robots.txt
**`/sitemap.xml`** — list all public, indexable, canonical URLs (no redirects, 404s, or noindex pages), include `<lastmod>`. Auto-generate with the framework (`next-sitemap`, Astro sitemap, etc.). Split if > 50,000 URLs.

**`/robots.txt`**:
```
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /cart/
Disallow: /checkout/

Sitemap: https://example.com/sitemap.xml
```
- **Warning:** `robots.txt` is public and is **not** a security mechanism. Never list secret paths hoping to hide them; protect them with authentication. Never leave `Disallow: /` on a production site by accident (common from staging).
- Submit the sitemap in Google Search Console and Bing Webmaster Tools (tell the human).

## 12. Analytics & Conversion

### 12.1 Set Up Analytics
- Prefer **privacy-friendly analytics** (Plausible, Umami, Fathom, Simple Analytics, self-hosted Matomo), which often work without cookies and without a consent banner. If using Google Analytics 4 or similar, gate it behind consent (Section 7.1) and enable IP anonymization.
- Track meaningful events only: page views, CTA clicks, form submissions, signups, purchases. Don't capture form field contents or personal data.
- Load analytics scripts `async`/`defer` so they don't hurt performance.
- Disclose the analytics tool in the Privacy Policy.
- Never expose analytics admin/API keys on the frontend.
- Tell the human which dashboard to check and what the key events are.

### 12.2 One Clear Call to Action (CTA)
- Each page has **one primary goal and one primary CTA** (e.g., "Start free trial", "Book a demo", "Buy now", "Contact us"). Secondary actions should be visually quieter.
- Place the primary CTA **above the fold** and repeat it at logical points (after key sections, end of page).
- Use specific action-oriented text ("Get my free quote"), not vague ("Submit", "Click here").
- Make it a high-contrast, accessible, large, obvious button — and make sure it actually works (links to a real destination, form functions).
- Remove competing CTAs and clutter. No dark patterns (fake urgency, hidden costs, confusing opt-outs).
- Show price/commitment clearly where relevant.

---

# PART E — FINAL CHECKLIST & REPORT

## 13. Master Checklist (copy, fill in, and return to the human)

**P0 — Critical**
- [ ] No secrets in frontend code, bundle, or git history; `.env` ignored
- [ ] HTTP → HTTPS redirect + HSTS + security headers
- [ ] Rate limiting on all routes; strict limits on auth/forms/AI/paid endpoints
- [ ] Request throttling, timeouts, body/upload size limits
- [ ] Per-user/IP usage quotas enforced server-side
- [ ] CAPTCHA verified server-side on public/sensitive forms
- [ ] Provider spending caps, alerts, token limits, kill switch
- [ ] Server-side validation, injection/XSS protection, authorization (RLS/rules enabled)

**P1 — High**
- [ ] Privacy Policy (accurate) linked in footer and at forms
- [ ] Terms & Conditions linked in footer
- [ ] Refund/Cancellation Policy (if payments)
- [ ] Real business details displayed (if business site)
- [ ] Cookie consent banner; trackers blocked until consent
- [ ] Tracking inventory checked and minimized
- [ ] Form consent text/checkboxes in place
- [ ] Only necessary data collected; retention/deletion defined
- [ ] 3rd-party embeds and scripts reviewed (SRI, pinned, consent-gated)
- [ ] Spam protection layered (honeypot, CAPTCHA, rate limit, verification)
- [ ] Fake reviews/testimonials removed
- [ ] Unsupported claims and fake badges removed

**P2 — Medium**
- [ ] Accessibility fixes (semantic HTML, keyboard, labels, focus, lang)
- [ ] Alt text on all images
- [ ] Color contrast meets WCAG AA
- [ ] Mobile friendly (viewport, responsive, tap targets)
- [ ] Images compressed/modern formats/lazy-loaded with dimensions
- [ ] Page speed checked (LCP/INP/CLS) and improved
- [ ] Custom 404 (true 404 status) and safe error pages
- [ ] Broken links fixed; no placeholder `#` links

**P3 — Standard**
- [ ] Unique meta title + description per page; canonical URLs
- [ ] Social preview image + Open Graph/Twitter tags
- [ ] Favicon set complete
- [ ] `sitemap.xml` and `robots.txt` live
- [ ] Analytics set up (privacy-respecting) and disclosed
- [ ] One clear primary CTA per page

## 14. Report Format for the Human

After finishing, reply with:

1. **Summary:** what you audited and the overall status.
2. **Fixed:** bullet list of changes (with file names).
3. **Needs your input:** placeholders to fill (`[TODO]` items), accounts to configure (spending caps, CAPTCHA keys, Search Console), secrets to rotate, legal review needed.
4. **Not done / out of scope:** with reasons.
5. **Residual risks:** honest note that this is a baseline, not a guarantee. Recommend periodic dependency updates, backups, monitoring/alerting, and a professional security review before handling payments, health data, or large user volumes.

## 15. Non-Negotiable Behaviors for the AI

- **Never** put secrets in client-side code or commit them.
- **Never** fabricate reviews, business details, credentials, statistics, certifications, or legal text presented as final.
- **Never** disable security controls (auth, CORS, CSP, validation, RLS) just to make something "work". Fix the root cause.
- **Never** use `Access-Control-Allow-Origin: *` with credentials, or `*` on private APIs. Allow-list specific origins.
- **Never** ship debug mode, verbose errors, default credentials, or open admin panels to production.
- **Always** prefer well-maintained libraries over custom security code.
- **Always** keep dependencies updated and remove unused ones.
- **Always** tell the human when something requires their action or a professional.
- **When in doubt, choose the safer, more private, more accessible option** and explain the trade-off.

---

*End of SECURITY.md — Last reviewed: [set date]. Review at least quarterly and after any major feature change.*
