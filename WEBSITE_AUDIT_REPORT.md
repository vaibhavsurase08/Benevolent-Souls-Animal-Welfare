# Website Audit Report — Benevolent Souls Foundation

**Project:** animal-welfare-website  
**Working directory:** `c:\Users\HP\OneDrive\Desktop\animal-welfare-website`  
**Audit date:** 24/10/2026  
**Audited by:** Cline (AI coding agent)  
**Scope:** Read-only inspection of the existing Next.js website, followed by a scoped enhancement to the public donation page.

---

## 1. Executive summary

The Benevolent Souls Foundation website is a Next.js (App Router) public-facing site for an animal-welfare NGO. It is built almost entirely as client-side React components that call Supabase directly from the browser using the Supabase anonymous (publishable) key. There are no Next.js API routes and no server-side backend code.

The site provides:
- A public homepage with animal rescue/adoption listings, an adoption enquiry form, a contact form, media links, and a "Donate Now" call-to-action.
- A public donation page (`/donate`) that collects donor details and inserts them into a Supabase `donations` table.
- Photo gallery (`/gallery`) and video stories (`/videos`) pages.
- A multi-language UI (English, Marathi, Hindi) via a custom `LanguageProvider`.
- An admin dashboard (`/admin/*`) for managing animals, adoption enquiries, donations, media, and contact messages.

**Key observation:** The donation page previously contained only a placeholder stating that official payment details would be added after confirmation from the organisation. This audit's scoped enhancement adds the official NGO QR code (image path `public/ngo-upi-qr.png`) and HDFC bank transfer details to that page. **The official QR image is currently missing from the repository** and must be supplied by the project team before the QR section displays anything.

**Major security concern:** Admin access control is enforced entirely on the client (React + `localStorage` + Supabase auth session). There is no server-side route protection or server-side authorisation middleware. Protected write operations (delete donations, approve/reject adoptions, add/delete animals/media/messages) are invoked from the browser. This design should be reviewed before any production use involving sensitive data. See Section 11.

No secrets, service-role keys, passwords, or access tokens are printed in this report.


---

## 2. Actual technology stack and dependencies

Only dependencies confirmed to be imported/used in source code are listed as "actually used". Presence in `package.json` alone was not treated as proof of usage.

### Framework and runtime
| Technology | Version (from package.json) | Confirmed usage |
|---|---|---|
| Next.js | 16.3.5 | Yes — App Router, `app/layout.tsx`, `app/page.tsx`, route segments |
| React | 19.2.8 | Yes — all pages are `"use client"` components |
| React DOM | 19.2.8 | Yes — Next.js rendering |
| TypeScript | 5 | Yes — `tsconfig.json` strict mode, `.tsx` source |
| Tailwind CSS | 4 (`@tailwindcss/postcss` / `tailwindcss` 4.3.3 installed) | Yes — `globals.css` `@import "tailwindcss"`, utility classes throughout |

### Libraries actually used in source
| Library | Confirmed usage |
|---|---|
| `@supabase/supabase-js` (^2.116.0) | Yes — `lib/supabase.ts` creates the client; every page calls `supabase.from(...)` and `supabase.auth.*` |
| `next/font/google` (Geist, Geist_Mono) | Yes — `app/layout.tsx` |
| `next/navigation` (`useRouter`) | Yes — admin pages |
| `eslint` / `eslint-config-next` | Dev tooling only (lint script) |

### NOT confirmed as used (appear in package.json / lock but no source import found)
None beyond the above — the dependency set is minimal. `@types/node`, `@types/react`, `@types/react-dom` are TypeScript type packages used by the build.

### Tooling / config
- `eslint.config.mjs` — ESLint 9 flat config with `eslint-config-next` (core-web-vitals + typescript rules).
- `postcss.config.mjs` — `@tailwindcss/postcss` plugin.
- `next.config.ts` — minimal, no custom options.
- `tsconfig.json` — strict `true`, path alias `@/*` → `./*`.
- No test framework is configured (no vitest/jest/react-testing-library in package.json).
- No git repository is initialised (`.git` absent), so there is no commit history to inspect.

### Environment variables (names only — values withheld)
| Variable | Purpose | Visibility |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `NEXT_PUBLIC` — exposed to browser |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase anonymous/public key | `NEXT_PUBLIC` — exposed to browser |

Both are present in `.env.local` (which is gitignored). No `SUPABASE_SERVICE_ROLE_KEY` or server-side secret is configured in the project.

---

## 3. Project folder structure

```
animal-welfare-website/
├── .env.local                     # Supabase URL + publishable key (gitignored, contains values)
├── .gitignore
├── eslint.config.mjs
├── next.config.ts
├── next-env.d.ts
├── package.json
├── package-lock.json
├── postcss.config.mjs
├── README.md
├── REVIEW_ASSET_MAP.csv           # Review-only media inventory (photos/videos withheld from public/)
├── REVIEW_BEFORE_PUBLISHING.txt   # Notes on review-only media
├── tsconfig.json
├── app/                           # Next.js App Router (all source lives here)
│   ├── layout.tsx                 # Root layout, LanguageProvider, metadata
│   ├── page.tsx                   # Homepage (client, ~2342 lines)
│   ├── globals.css                # Tailwind imports + custom animations
│   ├── favicon.ico
│   ├── components/
│   │   └── LanguageProvider.tsx   # en/mn/hi translations + context
│   ├── donate/
│   │   └── page.tsx               # Public donation form (MODIFIED in this task)
│   ├── gallery/
│   │   └── page.tsx               # Photo gallery
│   ├── videos/
│   │   └── page.tsx               # Video stories
│   └── admin/                     # Admin routes (all client-side)
│       ├── page.tsx               # Dashboard
│       ├── login/                 # Login (sets localStorage "adminLoggedIn")
│       ├── adoption/              # Adoption enquiries management
│       ├── animals/               # Animals list + edit/delete + image upload
│       ├── animals/add/           # Add animal form
│       ├── donations/             # Donations list + delete
│       ├── media/                 # Media upload (ngo-media bucket) + delete

---

## 4. Public pages and functionality

All public pages are `"use client"` components and call Supabase directly from the browser.

### 4.1 Routes and purposes
| Route | Purpose | Data source / target |
|---|---|---|
| `/` | Homepage: hero, mission, animal rescue listings, adoption section, media/CTA, contact section | `supabase.from("animals")`, `adoption_enquiries`, `contact_enquiries` |
| `/donate` | Donation form: donor details + payment method + transaction ID → `donations` table | `supabase.from("donations").insert(...)` |
| `/gallery` | Photo gallery (default static photos + optional Supabase `media` records) | `supabase.from("media")` |
| `/videos` | Video stories (default static videos + optional Supabase `media` records) | `supabase.from("media")` |

### 4.2 Homepage sections and navigation
- Navigation links: Home, About Us, Our Work, Adoption, Stories, Media, Contact, Donate (Donate → `/donate`).
- Anchor sections: `home`, `about`, `work`, `adoption`, `media`, `contact`.
- Language switcher persists choice in `localStorage` key `bsf-language`.
- Homepage includes an emergency contact phone (+91 93594 41200).

### 4.3 Animal rescue functionality
- Homepage fetches animals where `status = "available"` from the `animals` table, ordered by `created_at` desc.
- Shows 4 initially with a load-more toggle (`visibleAnimals` state).
- Clicking an animal selects it for the adoption enquiry form.
- No dedicated public animal-detail page; adoption is initiated from the homepage.

### 4.4 Adoption pages and forms
- There is **no standalone public adoption page**. Adoption is a section on the homepage (`#adoption`) plus an admin section (`/admin/adoption`).
- Homepage adoption form inserts into `adoption_enquiries` with fields: `animal_id`, `name`, `email`, `phone`, `message`, `status: "pending"`.
- Minimal validation: submission skipped if `animals.length === 0`; otherwise no field-level validation.
- Admin adoption page (`/admin/adoption`) lists enquiries, supports search/filter by status, and lets an admin change status to pending/approved/rejected.

### 4.5 Donation page and form
- File: `app/donate/page.tsx`.
- Fields: `donor_name`, `email`, `phone`, `amount`, `payment_method`, `transaction_id`, `message`.
- `donor_name` has HTML `required`; other fields rely on HTML5 input types (`email`, `tel`, `number`) with no additional client-side validation.
- On submit, inserts into Supabase `donations` table (amount cast to `Number` or `null`).
- Shows success ("Donation details submitted successfully.") or error banner.
- **No `payment_status` / verification field is written** on insert. Submitting the form does **not** verify that a payment was made. This is a misleading-label risk (Section 11).
- Previously contained a placeholder paragraph ("Official payment details ... will be added after confirmation"). This task replaces that placeholder with the official QR + bank details section.

### 4.6 Gallery and video pages
- `/gallery`: Renders a hardcoded `defaultPhotos` array (images under `/image/ngo/...`) and attempts to load additional records from Supabase `media` table. Includes a lightbox image viewer. Broken image URLs are hidden via `onError`.
- `/videos`: Renders a hardcoded `defaultVideos` array (videos under `/videos/...` and `/videos/ngo-stories/...`) plus Supabase `media` records. Detects video orientation, adds viewer-discretion warnings for injury/treatment-related content, links back to gallery.

### 4.7 Language switching and translations
- `app/components/LanguageProvider.tsx` provides context with languages `en`, `mr` (Marathi), `hi` (Hindi).
- Translation dictionary is inline in the component. Preference persisted in `localStorage` (`bsf-language`); `document.documentElement.lang` updated.
- `t(key)` fallback: language → `en` → key.

### 4.8 Contact or message forms
- Homepage contact section (`#contact`) submits `name`, `email`, `message` to Supabase `contact_enquiries` table.
- Validation: simple alert if any field is empty; no email format validation.
- Admin can view/delete messages at `/admin/messages`.

### 4.9 Links between pages
- Homepage "Donate Now" → `/donate`.
- Donate page "← BACK TO HOME" → `/#donate`.
- Videos → Gallery (`/gallery`); Gallery has no explicit link back.
- Admin dashboard has "Open Public Website" → `/`.
- Footer links to contact/adoption/donate.

### 4.10 Responsive design and reusable components
- Responsive via Tailwind utilities (`sm:`, `md:`, `lg:` prefixes) and CSS grid/columns.
- Mobile menu (`mobileMenuOpen` state) on homepage.
- No shared component library; each page is self-contained. `LanguageProvider` is the only reusable context/component.

### 4.11 Implemented vs partially implemented vs missing
| Feature | Status |
|---|---|

---

## 5. Admin routes and functionality

All admin pages are `"use client"`. Authentication/restriction patterns vary by page (see Section 6).

| Route | Purpose | Actions | Data source | Auth check |
|---|---|---|---|---|
| `/admin` | Dashboard overview | Logout, navigate to sub-sections / public site | None (supabase session check) | `supabase.auth.getSession()` + `onAuthStateChange` |
| `/admin/login` | Admin sign-in / password reset request | `signInWithPassword`, `resetPasswordForEmail` | Supabase Auth | None (login page) |
| `/admin/adoption` | Manage adoption enquiries | List, search, filter by status, update status (pending/approved/rejected) | `adoption_enquiries`, `animals` | `localStorage.getItem("adminLoggedIn") === "true"` |
| `/admin/animals` | Manage animals | List, edit (incl. image upload to `animal-images` bucket), delete | `animals` | `supabase.auth.getSession()` |
| `/admin/animals/add` | Add animal | Upload image to `animal-images`, insert into `animals` | `animals`, Supabase Storage | `supabase.auth.getSession()` (checked at submit) |
| `/admin/donations` | Manage donations | List, search, delete | `donations` | `localStorage.getItem("adminLoggedIn") === "true"` |

---

## 6. Authentication and authorization design

### How admin authentication is implemented
- Supabase Auth (`@supabase/supabase-js`) handles email/password sign-in via `supabase.auth.signInWithPassword`.
- On successful login, `/admin/login` calls `localStorage.setItem("adminLoggedIn", "true")` and redirects to `/admin`.
- Password reset uses `supabase.auth.resetPasswordForEmail` with redirect to `/admin/reset-password`; reset page uses `supabase.auth.updateUser({ password })`.

### Where authentication state is checked
- `/admin` page: `supabase.auth.getSession()` + `onAuthStateChange` subscription; redirects to `/admin/login` if no session.
- `/admin/animals` and `/admin/animals/add`: `supabase.auth.getSession()`.
- `/admin/adoption`, `/admin/donations`, `/admin/media`, `/admin/messages`: check `localStorage.getItem("adminLoggedIn") === "true"` only (no Supabase session check on those pages).

### How access restrictions work
- Restrictions are **client-side only**. If the check fails, the browser redirects to `/admin/login` or refuses to load data.
- There is **no Next.js middleware**, no server route handler, and no server action that independently enforces authorisation.

---

## 7. Backend and database architecture

### Database provider
Supabase (PostgreSQL). Client initialised in `lib/supabase.ts` using `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

### Tables referenced in source code
| Table | Records stored | Operations seen in source |
|---|---|---|
| `donations` | Donor submissions: donor_name, email, phone, amount, payment_method, transaction_id, message (+ status, created_at in admin type) | INSERT (donate page), SELECT + DELETE (admin) |
| `animals` | Rescue animals: name, species, age, gender, image_url, description, status | SELECT, INSERT (add), UPDATE (edit), DELETE |
| `adoption_enquiries` | Adoption applications: animal_id, name, email, phone, message, status | INSERT (homepage), SELECT + UPDATE status (admin) |
| `contact_enquiries` | Contact form messages: name, email, message | INSERT (homepage), SELECT + DELETE (admin) |
| `media` | Gallery/video media: title, type, url, description | SELECT (gallery/videos), INSERT + DELETE (admin media) |

### Supabase Storage buckets referenced
- `animal-images` — animal photos uploaded via admin.
- `ngo-media` — media files uploaded via admin.

### Client-side vs server-side database access
- **All database access is client-side** from the browser using the public anon key. There are no API routes (`app/api` does not exist) and no server actions.

### Form validation and error handling
- Forms rely mostly on HTML5 attributes (`required`, `type=email/tel/number`, `minLength`) plus `try/catch` around Supabase calls with error banners/alerts.
- No schema validation library (e.g., zod) is used.
- Donation form: only `donor_name` is `required`; no validation that amount > 0 beyond HTML `min="1"`, no transaction-ID validation when payment method implies one.


---

## 8. Donation module current state (before this enhancement)

File: `app/donate/page.tsx`.

- Form fields (all preserved): `donor_name`, `email`, `phone`, `amount`, `payment_method`, `transaction_id`, `message`.
- Insert target: Supabase `donations` table.
- No `payment_status` column is set on insert; the admin `Donation` type includes a `status` field but the public form never populates it.
- Success message: "Donation details submitted successfully." — this can be read as implying the donation was paid/verified, which is not the case (see MEDIUM-2).
- Error message: "Unable to submit your donation details. Please try again."
- Left "Information" column previously contained a placeholder: "Official payment details and donation methods will be displayed after confirmation from Benevolent Souls Foundation."
- No QR code, no bank details, no copy-to-clipboard functionality existed.
- This enhancement replaces that placeholder with the official QR + bank details section.

---

## 9. Environment setup and instructions to run locally

### Prerequisites
- Node.js (Next.js 16 / React 19 requires a modern Node LTS).
- A Supabase project with the tables and storage buckets listed in Section 7.
- Environment variables configured.

### Required environment variables (values must be supplied by the project team; do not commit real values)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Create `.env.local` in the project root with these two values. The site **will not work** without Supabase configuration (every page calls `supabase` at mount).

### Scripts (from package.json)
| Script | Command | Purpose |
|---|---|---|
| `dev` | `next dev` | Start development server |
| `build` | `next build` | Production build |
| `start` | `next start` | Start production server |
| `lint` | `eslint` | Run ESLint |

### Local URL
- Development: `http://localhost:3000`
- Routes: `/`, `/donate`, `/gallery`, `/videos`, `/admin/*`

### What must be configured before the site can run
1. `.env.local` with valid Supabase URL + publishable key.
2. Supabase tables (`donations`, `animals`, `adoption_enquiries`, `contact_enquiries`, `media`) and storage buckets (`animal-images`, `ngo-media`) must exist, with RLS configured appropriately (unverified).
3. For the donation QR section to display: the official image must be placed at `public/ngo-upi-qr.png` (currently missing — see Sections 10 and 11).

---

## 10. Tests executed and their results

No test framework is configured in the project, so no automated unit/integration tests exist and were not executed. The following static checks were executed as a baseline before and after the donation-page change:

| Check | Command | Result |

---

## 11. Security findings and recommended fixes

Findings are classified Critical / High / Medium / Low. "Confirmed" means verified by source-code inspection; "Potential" means requires runtime/deployment testing.

No secrets, service-role keys, access tokens, or passwords were exposed during this inspection. No authentication was bypassed.

### HIGH-1 (Confirmed) — Admin authorisation is client-side only
- **Location:** `app/admin/*.tsx` (adoption, donations, media, messages check `localStorage`; dashboard/animals check Supabase session).
- **Issue:** No server-side middleware or route protection. Protected writes (delete donation, approve/reject adoption, add/delete animal/media/message) are invoked from the browser with the public anon key.
- **Risk:** Bypassing the client UI check may expose write operations if Supabase RLS is permissive or misconfigured.
- **Recommended fix:** Add Next.js middleware or server-side route guards that verify a valid Supabase session/role before rendering admin pages, and ensure RLS enforces authorisation independently of the client.
- **Verification needed:** Confirm Supabase RLS policies on all tables/buckets (unverified from source).

### HIGH-2 (Confirmed) — Inconsistent admin auth checks
- **Location:** `app/admin/adoption/page.tsx`, `app/admin/donations/page.tsx`, `app/admin/media/page.tsx`, `app/admin/messages/page.tsx` use `localStorage.getItem("adminLoggedIn")`; `/admin` and `/admin/animals/*` use `supabase.auth.getSession()`.
- **Issue:** `localStorage` can be set by anyone with console access; it is not proof of a valid Supabase session.
- **Recommended fix:** Unify all admin routes to check `supabase.auth.getSession()` (and ideally a server-side guard), not `localStorage`.

### MEDIUM-1 (Confirmed) — Donation success message may imply payment verification
- **Location:** `app/donate/page.tsx` (success banner + admin `Donation.status` type).
- **Issue:** Submitting the form only records donor details; it does not verify payment. No `payment_status` is written. Banner "Donation details submitted successfully." may mislead donors into thinking the money was received.
- **Recommended fix:** Clarify messaging (e.g., "Donation details recorded") and add a `payment_status` column only if the NGO approves a schema change; do not auto-mark donations as paid.

### MEDIUM-2 (Confirmed) — Minimal donation form validation
- **Location:** `app/donate/page.tsx`.
- **Issue:** Only `donor_name` is `required`; no validation of amount, email format (beyond HTML5), or transaction ID presence when a paid method is selected.
- **Recommended fix:** Add client-side validation and clear field-level errors.

### LOW-1 (Confirmed) — Public `.env.local` contains `NEXT_PUBLIC_*` keys

---

## 12. Missing or incomplete functionality

1. **Payment gateway / verification** — Not implemented (and not requested). Donations are recorded as donor-submitted details only, with no payment status or webhook.
2. **Official QR image asset** — `public/ngo-upi-qr.png` is missing; the QR section will be blank until supplied.
3. **Server-side admin authorisation** — No middleware; client-side only.
4. **Automated tests** — No test framework configured.
5. **Standalone public adoption/animal-detail pages** — Adoption exists only as a homepage section.
6. **Verified Supabase RLS** — Cannot be confirmed from source.
7. **Impact statistics** — Homepage notes that no publicly verified rescue/treatment/adoption totals were found; figures are draft pending NGO confirmation.

---

## 13. Recommendations, prioritised by importance

1. **Place the official QR image** at `public/ngo-upi-qr.png` (required for the donation enhancement to display).
2. **Add server-side admin authorisation** (Next.js middleware + verified Supabase RLS) before production use. (High)
3. **Unify admin auth checks** to use `supabase.auth.getSession()` instead of `localStorage`. (High)
4. **Clarify donation success messaging** so it does not imply payment verification; consider adding `payment_status` only with NGO approval and a schema change. (Medium)
5. **Add donation form field validation** (amount, email, transaction ID when applicable). (Medium)
6. **Confirm Supabase RLS policies** on all tables and storage buckets. (Medium)
7. **Remove nested `public/app/` and `public/public/` duplicates** (housekeeping). (Low)
8. **Fix pre-existing lint errors** (`<Link />`, `<Image />`, unescaped entities) as part of general code-quality work. (Low)

---

## 14. Limitations of this inspection

- This was a **source-code inspection only**. No live server was running and no automated tests exist, so runtime behaviour (Supabase connectivity, RLS enforcement, clipboard API, image rendering) was not executed.
- Supabase Row Level Security policies and actual database schema could not be verified from the client-side source and are explicitly marked unverified.
- No credentials were requested, used, or exposed. Secret values in `.env.local` were read only to confirm variable names; values are not reproduced here.
- The `.next/` build output exists but was not relied upon; no production build was executed.
- The QR image enhancement references `/ngo-upi-qr.png`; since the image is missing, the visual QR section cannot be functionally verified until the asset is supplied.

---

**End of audit report.**

- **Location:** `.env.local` (gitignored).
- **Issue:** These are intentionally public (anon key + URL), but the file contains actual values and is excluded from git. Ensure it is never committed and no service-role key is added as `NEXT_PUBLIC`.
- **Recommended fix:** Keep `.env.local` out of version control (already gitignored); never expose a service-role key to the client.

### LOW-2 (Pre-existing, confirmed) — Lint errors
- **Location:** Multiple pages (`<a>` instead of `<Link />`, `` instead of `<Image />`, unescaped entities).
- **Recommended fix:** Optional cleanup; out of scope for this task.

### Low-3 (Observation) — Nested duplicate directories under `public/`
- **Location:** `public/app/` and `public/public/` contain duplicate page-like files.
- **Recommended fix:** Remove or repurpose; they are not part of the Next.js route system but are picked up by linting.

|---|---|---|
| TypeScript type-check | `npx tsc --noEmit` | **Clean** — no type errors (before and after change). |
| ESLint (whole project) | `npm run lint` | **39 problems** (22 errors, 17 warnings) — all pre-existing; not caused by this change. |
| ESLint (`app/donate/page.tsx`) | `npx eslint app/donate/page.tsx` | Before: 3 errors. After: 3 pre-existing errors + 1 new warning (`` tag could use `<Image />`). No new errors introduced. |

### Pre-existing lint errors (not introduced by this task)
- `app/donate/page.tsx:95,102` — `<a>` element used to navigate; use `<Link />` from `next/link`.
- `app/donate/page.tsx:124` — unescaped HTML entity (`'`).
- Similar `<a>`/`<Link />` and `` warnings exist across `app/page.tsx`, `app/videos/page.tsx`, `public/app/gallery/page.tsx`, `public/app/videos/page.tsx`.

### Verification specific to this task (manual/code inspection)
| Verification | Result |
|---|---|
| `public/ngo-upi-qr.png` exists | **No** — file is missing (0 `.png` files in `public/`). The `<img src="/ngo-upi-qr.png">` will render nothing until the official image is supplied. |
| Copy buttons do not submit the form | Confirmed by code inspection: buttons use `type="button"` and the Scan-to-Donate/bank-details section is **outside** the `<form>` element (in the Information column). |
| Original Supabase form + field names intact | Confirmed: `donor_name`, `email`, `phone`, `amount`, `payment_method`, `transaction_id`, `message` and the `supabase.from("donations").insert(...)` call are unchanged. |
| Build (`npm run build`) | Not executed — requires network/Supabase and was not needed for the scoped client change; type-check passed. |

Tests that **could not be completed**: end-to-end browser test of copy-to-clipboard (depends on clipboard API permissions in a real browser and the missing QR image), Supabase integration test (requires live Supabase credentials), production build verification.

### File uploads and storage
- Handled client-side via `supabase.storage.from(bucket).upload(file, { contentType, upsert: false })`; public URL obtained via `getPublicUrl`. File names are sanitised (non-alphanumeric → `-`) and prefixed with `Date.now()`.

### RLS assumptions
- Row Level Security policies **cannot be verified from source code** and are explicitly marked unverified. Relying on the anon key from the browser without verified RLS is a risk.

### Missing or incomplete backend functionality
- No API routes, no server actions, no server-side authorization middleware.
- No payment gateway, no webhook, no payment verification.
- No automated test suite.

- All database writes from admin pages are issued from the browser using the `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (anon key). Row Level Security (RLS) status **cannot be verified from source code** and remains unverified.

### Authorisation enforcement independence
- Protected server operations do **not** enforce authorisation independently because there are no protected server operations — everything is client-side. A user who bypasses the client UI check (or disables JavaScript/localStorage) could potentially call Supabase directly if RLS permits. This is a significant architectural weakness (Section 11, finding HIGH-1).

### What was NOT done
- No credentials were created, no passwords exposed, no authentication bypass attempted.

| `/admin/media` | Manage media | Upload (to `ngo-media` bucket), list, delete | `media` + Supabase Storage | `localStorage.getItem("adminLoggedIn") === "true"` |
| `/admin/messages` | Manage contact messages | List, search, delete | `contact_enquiries` | `localStorage.getItem("adminLoggedIn") === "true"` |
| `/admin/reset-password` | Reset password | `updateUser({ password })`, requires valid session | Supabase Auth | `supabase.auth.getSession()` |

Important dependencies: every admin page imports `supabase` from `@/lib/supabase` and `useRouter` from `next/navigation`. File uploads use `supabase.storage.from("<bucket>").upload(...)` and `getPublicUrl(...)`.

| Homepage + navigation | Implemented |
| Animal listings (available) | Implemented |
| Adoption enquiry form | Implemented (client-side, minimal validation) |
| Donation form + Supabase insert | Implemented |
| Official QR + bank details on donate page | **Was missing/placeholder; added by this task** (QR image asset still missing) |
| Photo gallery | Implemented (static defaults + optional Supabase media) |
| Video stories | Implemented (static defaults + optional Supabase media) |
| Multi-language (en/mr/hi) | Implemented |
| Contact form | Implemented (minimal validation) |
| Admin dashboard + all admin routes | Implemented (client-side auth only) |
| Image upload to Supabase Storage | Implemented (buckets: `animal-images`, `ngo-media`) |
| Payment gateway / webhook | Missing (not implemented, not requested) |
| Server-side auth middleware | Missing |
| Automated tests | Missing (no test framework) |

│       ├── messages/              # Contact enquiries list + delete
│       └── reset-password/        # Password reset
├── public/                        # Static assets
│   ├── image/ngo/                 # NGO photos (jpeg)
│   ├── image/ngo/community/       # Community photo set
│   ├── videos/                    # Hero + NGO story videos (mp4)
│   ├── videos/ngo-stories/
│   ├── app/                       # Nested duplicate gallery/videos pages (unusual)
│   ├── public/                    # Nested duplicate image/videos (unusual)
│   ├── MEDIA_ASSET_MAP.csv
│   ├── MEDIA_INSTALL_GUIDE.txt
│   ├── file.svg, globe.svg, next.svg, vercel.svg, window.svg
│   └── ngo-upi-qr.png             # MISSING — required for donation QR section
├── photos/                        # Review-only photos (OUTSIDE public/, not served)
├── videos/                        # Review-only videos (OUTSIDE public/, not served)
├── .next/                         # Build output (gitignored)
└── node_modules/
```

Notes:
- `public/ngo-upi-qr.png` does **not exist**. There are zero `.png` files in `public/`. This is a required asset for the donation enhancement.
- `photos/` and `videos/` at the repo root contain review-only media that is intentionally **outside** `public/` and therefore not automatically served by Next.js.
- There is an unusual nested `public/app/` and `public/public/` directory containing duplicate page files. These are not part of the Next.js route system (routes resolve from the root `app/`). They are flagged as a housekeeping observation, not a defect in scope.
