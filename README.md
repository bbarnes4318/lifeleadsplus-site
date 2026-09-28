# Life Leads Plus — public website

The public site for Life Leads Plus clients: agencies and agents who buy live Final Expense and
Medicare calls and use the Life Leads Plus portal.

Astro 5 · Tailwind CSS 4 · TypeScript · deployed on Vercel (`@astrojs/vercel`, Node.js 22).

## Pages

| Route                  | Rendering                                     |
| ---------------------- | --------------------------------------------- |
| `/`                    | prerendered                                   |
| `/pay-per-application` | prerendered                                   |
| `/pay-per-call`        | prerendered                                   |
| `/platform`            | prerendered (nav label "The Portal")          |
| `/faq`                 | prerendered (FAQPage JSON-LD)                 |
| `/get-started`         | prerendered (application form)                |
| `/privacy`             | prerendered ("last updated" = build date)     |
| `/404`                 | prerendered                                   |
| `/og.png`              | generated at build (1200×630)                 |
| `/sitemap.xml`         | generated at build                            |
| `/robots.txt`          | generated at build                            |
| `/api/apply`           | **function** — form endpoint, sends email     |
| `/login`               | **function** — 302 to `PORTAL_URL` + `/login` |

`/login` is a server route (not an `astro.config` redirect) so it reads `PORTAL_URL` at request
time and falls back to `/` when it's unset.

## Local development

```bash
npm install
cp .env.example .env   # then fill in values
npm run dev            # http://localhost:4321
```

`astro.config.mjs` loads `.env` into `process.env`. Set `SMTP_HOST=mock` locally to capture
emails with nodemailer's JSON transport instead of sending them.

Scripts:

| Command               | What it does                                                      |
| --------------------- | ----------------------------------------------------------------- |
| `npm run build`       | Production build into `.vercel/output`                            |
| `npm run check`       | `astro check` (types)                                             |
| `npm run lint`        | ESLint + Prettier check                                           |
| `npm run format`      | Prettier write                                                    |
| `npm test`            | Playwright smoke + form tests (starts its own dev server on 4322) |
| `npm run screenshots` | Full-page screenshots at 390 and 1440 into `docs/screenshots/`    |

First Playwright run: `npx playwright install chromium`.

## Environment variables

| Variable             | Required | Used for                                                                                                                                                                             |
| -------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `SITE_URL`           | no       | Canonical URLs, sitemap, OG image URL, email logo. Defaults on Vercel to the production domain (`VERCEL_PROJECT_PRODUCTION_URL`: your custom domain once added, else `*.vercel.app`) |
| `PORTAL_URL`         | yes      | "Client login" links (`PORTAL_URL/login`) and the `/login` redirect                                                                                                                  |
| `APPLY_TO_EMAIL`     | yes      | Recipient of new client applications                                                                                                                                                 |
| `SMTP_HOST`          | yes      | SMTP server                                                                                                                                                                          |
| `SMTP_PORT`          | yes      | `465` = TLS, otherwise STARTTLS (default `587`)                                                                                                                                      |
| `SMTP_USER`          | usually  | SMTP username                                                                                                                                                                        |
| `SMTP_PASSWORD`      | usually  | SMTP password                                                                                                                                                                        |
| `SMTP_FROM`          | yes      | From address, e.g. `Life Leads Plus <no-reply@yourdomain.com>`                                                                                                                       |
| `PUBLIC_PHONE`       | no       | Shown in header, footer and Get Started when set; hidden when unset                                                                                                                  |
| `PUBLIC_EMAIL`       | no       | Same rule as `PUBLIC_PHONE`; also the Privacy page contact                                                                                                                           |
| `COMPANY_LEGAL_NAME` | no       | Footer copyright and Privacy page (default `Life Leads Plus`)                                                                                                                        |

Pages are prerendered, so every variable except those read by `/api/apply` and `/login` is baked
in at build time. On Vercel, any env var change takes effect on the next deployment — redeploy
after changing one.

## Deploying on Vercel

1. In Vercel, **Add New → Project** and import the `lifeleadsplus-site` GitHub repository.
2. Framework preset: **Astro**. Build command and output directory: leave the defaults.
3. **Settings → General → Node.js Version: 22.x** (also pinned by `engines` in `package.json`).
4. **Settings → Environment Variables**: add every variable in the table above for
   **Production** and **Preview**. Never commit `.env`.
5. Deploy. Pushes to `main` deploy to production; other branches and PRs get preview deployments.

### Custom domain

1. **Settings → Domains → Add** your domain (e.g. `lifeleadsplus.com`) and `www.` variant.
2. At your DNS provider, add the records Vercel shows. Typically:
   - apex (`@`): **A** record → `76.76.21.21`
   - `www`: **CNAME** → `cname.vercel-dns.com`
3. Choose which of apex / `www` redirects to the other in Vercel, and set `SITE_URL` to the
   primary one. Redeploy.

### Preview deployments are not indexed

When `VERCEL_ENV` is not `production` at build time:

- `robots.txt` is `Disallow: /`
- `scripts/preview-noindex.mjs` (runs after `astro build`) prepends a route to
  `.vercel/output/config.json` that sends `X-Robots-Tag: noindex` on every response.

Builds outside Vercel (no `VERCEL_ENV`) are treated as production.

## Application form (`/api/apply`)

- Validated on the client and server with the same zod schema (`src/lib/apply.ts`).
- Rejects bodies over 16 KB, a filled honeypot field (`company_website`), and submissions sent
  less than 3 seconds after the page loaded (hidden timestamp).
- Rate limit: 5 requests per IP per hour, **in memory per function instance** — best effort only,
  since serverless instances don't share memory. The honeypot and time check are the real guard.
- Sends one plain-text + HTML email to `APPLY_TO_EMAIL` (subject
  `New client application: <Agency name>`) and a "We got your application" confirmation to the
  applicant. SMTP failure on the first email returns 502 and the form keeps the user's entries.
- Logs only the agency name and a timestamp.

## Brand and screenshots

- `public/brand/` — favicon, apple-touch icon, and `wordmark.png` (JSON-LD logo, email header).
- `src/assets/brand/` — wordmarks for the header/footer (optimized at build) and `mark.png`
  (OG image only).
- `src/assets/screens/` — the only portal images on the site: four crops (`floor-cards`,
  `applications`, `customers`, `statements`) with no sidebar, header, toasts or per-call amounts.
  They are cut from the full 1440×900 captures in `src/assets/screens/source/` (never imported)
  by `node scripts/crop-screens.mjs`; rerun it after replacing a capture. `Shot.astro` renders them
  as WebP/AVIF at no more than their native width. A test fails if any other screenshot is
  referenced.
- The site uses no analytics, cookies, third-party scripts or external font CDN (Inter and Plus
  Jakarta Sans are self-hosted via `@fontsource-variable/*`).
