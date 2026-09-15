# Frontend V1 — Design & Implementation Plan

**Status:** `Implemented`
**Approved:** 2026-09-15
**Implemented:** 2026-09-15
**Divergences from the approved plan:** see §18.
**Scope:** Frontend only, on mock data, as originally approved. §20 records the later
Frontend ↔ Backend Integration phase, which rewired `lib/data/` onto the real API and is
what this document now describes as current — everything not mentioned in §20 is
unchanged from V1.

Tags used below:
**[BRIEF]** = mandated by RBDC Ex 4 · **[V1]** = approved design choice ·
**[OPT]** = optional, beyond the brief.

---

## 1. Scope

Next.js 14 (App Router) + TypeScript frontend running on isolated mock data.

**Stack [V1]:** Next.js 14 App Router · TypeScript · Tailwind CSS ·
`lucide-react` (icons) · `clsx`. Five dependencies total. No UI kit, no state
library, no data-fetching library, no form library.

---

## 2. User flows

**Job seeker (no auth) [BRIEF]**
`/` browse → search / filter / sort → `/jobs/[id]` read full post →
**Apply Now** → `/jobs/[id]/apply` → validate → submit → success state →
back to jobs.

**Employer (assumed authenticated) [OPT auth UI, BRIEF workflows]**
`/login` or `/signup` (role: Employer) → `/employer` dashboard →
**Post a Job** → `/employer/jobs/new` → submit → back to dashboard with the new
job visible → open a job's applications in a side drawer → read applicant name,
email, and cover letter.

---

## 3. Routes

| Route | Purpose | Rendering (as built) |
|---|---|---|
| `/` | Job list, search, filter, sort **[BRIEF]** | Client |
| `/jobs/[id]` | Full job detail + Apply CTA **[BRIEF]** | Client (see §18.1) |
| `/jobs/[id]/apply` | Application form **[BRIEF]** | Client |
| `/login` | Sign-in UI **[OPT]** | Server shell + client form |
| `/signup` | Sign-up UI + role choice **[OPT]** | Server shell + client form |
| `/employer` | Employer's jobs + applications drawer **[BRIEF]** | Server shell + client dashboard |
| `/employer/jobs/new` | Post a job **[BRIEF]** | Client |

Plus root `not-found.tsx` (unknown job id) and `error.tsx` **[V1]**.

---

## 4. Domain shape (frontend types only — not a database schema)

**Job** — **[BRIEF]** fields in bold:
id, **title**, **description**, **requirements**, **location**, **status**,
category, salaryMin, salaryMax, salaryCurrency, salaryPeriod, employmentType,
postedAt, employerName.

- `category` and salary are **[BRIEF]** by implication — the brief mandates
  *filter by category* and *sort by salary*, so both must exist even though its
  sample SQL omits them (see CLAUDE.md §1).
- `status` **[V1]**: `Open` / `Closed`. Draft deferred.
- `employmentType` **[V1]**: Full-time / Part-time / Contract / Internship.
  Displayed, not filtered in V1.
- Categories are a fixed frontend constant **[V1]**; storage is a backend decision.

**Application [BRIEF]:** id, jobId, applicantName, applicantEmail, coverLetter,
submittedAt. V1 added a local `status` (New / Reviewed) for the dashboard only; the
backend does not persist one (`docs/BACKEND.md` §2), so it was removed during
integration (§20) rather than shipped as a value nothing could change.

**Sort by "relevance" [BRIEF, undefined in the brief]:** V1 defines it as a
weighted text match — title > category/location > description. It is offered only
when a search term is present; otherwise the control falls back to Newest.
The authoritative definition remains a **backend planning decision**
(CLAUDE.md §1, "Open by design").

---

## 5. Architecture — the integration seam

*As approved and built for V1. The seam did its job — see §20 for what integration
actually changed inside it (small; the rule below is why).*

The rule that makes later Django integration cheap:

- **`src/lib/data/` is the only module that touches data.** It exports async,
  domain-named functions: `listJobs(query)`, `getJob(id)`, `createJob(input)`,
  `submitApplication(input)`, `listEmployerJobs()`, `listApplications(jobId)`.
- **Components never import from `src/lib/mock/`** and never call `fetch`.
  They call `lib/data` only.
- **Search, filter, and sort logic lives inside `lib/data`, not in components.**
  The brief places this logic in the backend **[BRIEF]**; in V1 the mock
  implementation performs it, and at integration the function body becomes an
  HTTP call with query params — the UI does not change.
- Mock functions are `async` with a small simulated delay, so real loading states
  are built and visible now.

Deleting `lib/mock/` and rewriting `lib/data/` is the entire integration surface.

---

## 6. Folder structure [V1]

```
src/
  app/            layout, page, globals.css, error, not-found,
                  jobs/[id]/, jobs/[id]/apply/, login/, signup/,
                  employer/, employer/jobs/new/
  components/
    ui/           Button Input Textarea Select Field Badge Card Drawer
                  Skeleton Alert EmptyState IconButton
    layout/       SiteHeader MobileNav SiteFooter Container PageHeader
    jobs/         JobCard JobList JobToolbar SearchInput FilterGroup
                  SortSelect JobMeta JobDetailHeader
    applications/ ApplicationForm ApplicationsDrawer ApplicationListItem
    employer/     EmployerJobList EmployerJobRow JobForm EmployerStats
    auth/         AuthCard RoleToggle LoginForm SignupForm
  lib/
    data/         jobs.ts applications.ts auth.ts      <- the seam
    mock/         jobs.mock.ts applications.mock.ts store.ts latency.ts
    forms/        validators.ts useFormState.ts
    utils/        formatDate.ts formatSalary.ts cn.ts
  types/          job.ts application.ts user.ts
  constants/      categories.ts locations.ts sortOptions.ts statuses.ts
```

As built, two components were added beyond the planned list:
`components/auth/AuthProvider.tsx` (the mock auth context named in §10) and
`components/employer/EmployerDashboard.tsx` (the dashboard body, split out so
`app/employer/page.tsx` can wrap it in a Suspense boundary — see §18.2).
`components/layout/Logo.tsx` was also added for the header and footer wordmark.

---

## 7. Visual system [V1]

**Theme:** light only in V1. Every colour is defined as a CSS custom property in
`globals.css` and consumed via Tailwind theme tokens, so adding a dark theme later
is a token-block addition rather than a refactor. Do not hardcode colour values in
components.

| Token | Value | Use |
|---|---|---|
| `navy-900` | `#0A1633` | Hero, footer, dark sections |
| `navy-700` | `#16255A` | Gradient partner, headings |
| `blue-600` | `#1D4ED8` | Primary actions, links, focus ring |
| `blue-50` | `#EFF4FF` | Tints, active filter chips |
| `ink-900` | `#0B0F19` | Body text |
| `slate-500 / 300 / 100` | — | Secondary text, borders, surfaces |
| `white` | `#FFFFFF` | Page ground, cards |

Accents are used sparingly and for status only: green (Open), slate (Closed).
Status is always **marker/icon + label**, never colour alone.

**Typography:** `Plus Jakarta Sans` (Google Fonts, via `next/font`). Single family,
weights 400/500/600/700/800. Hierarchy comes from weight, size, and tight display
tracking — no second typeface.

**Surfaces:** 12px radii, hairline `slate-200` borders, low-spread shadows that lift
only on hover. One signature gradient (navy → blue), reserved for the home hero and
the employer dashboard header — nowhere else.

**Motion:** 150–200ms ease-out on hover, focus, and drawer transitions only.
No scroll animation, no parallax, no entrance effects.

**Icons:** `lucide-react`, one style throughout, 20px default, 1.5 stroke.

- Icon-only: search, filter, sort direction, location pin, menu, close, back,
  delete, external link, chevrons.
- Always labelled text: Apply Now, Post a Job, Sign In, Sign Up,
  Submit Application, Save, and delete confirmation.
- Every icon-only control carries an `aria-label` and a tooltip.

**Accessibility:** WCAG AA contrast, visible `blue-600` focus rings, semantic
landmarks, labelled inputs with `aria-describedby` errors, Esc and focus-trap on
the drawer and mobile nav, keyboard-reachable everything, plus a skip-to-content
link.

Contrast was verified numerically against the shipped tokens, and three failures
found during verification were fixed by shifting the token ramp (§18.3).

---

## 8. Page layouts

1. **`/`** — Navy gradient hero with headline and a prominent search field. Sticky
   toolbar below: search, category select, location select, sort select
   (icon + label), active-filter chips with clear-all. Responsive card grid
   (3/2/1 col) of `JobCard`: title, employer, location pin, category badge, salary,
   relative posted date, status. Result count, skeletons, empty state.
2. **`/jobs/[id]`** — Two columns on desktop: left = title, employer, meta row,
   description, requirements list; right = sticky summary card (salary, location,
   category, type, posted, status) with **Apply Now**. Back link with arrow icon.
   Single column on mobile with Apply Now in a sticky bottom bar.
3. **`/jobs/[id]/apply`** — Narrow centred card. Compact job summary at the top for
   context. Name / Email / Cover letter with a character counter. Inline validation
   on blur and on submit. Submitting state on the button. On success the form is
   replaced by a confirmation panel offering "Browse more jobs".
4. **`/login`** — Centred card on a subtle navy-tinted ground. Email + password,
   Sign In, link to signup. Role is inferred after sign-in (mock), not chosen here.
5. **`/signup`** — Same card. Segmented **Job Seeker / Employer** toggle at the top
   (drives the post-signup redirect), name, email, password, confirm password.
   Link to login.
6. **`/employer`** — Gradient header with employer name and a **Post a Job** CTA.
   Small stat row: open jobs / total applications **[OPT]**. Job list rows show
   title, status badge, posted date, location, and application count.
   Row actions: view applications (opens drawer), close/reopen, delete (with
   confirmation). **No Edit action in V1** — it is excluded rather than shipped as a
   non-functional control. **Applications open in a right-side drawer**: job title in
   the header, list of applicants, each expanding to reveal email and full cover
   letter. The drawer becomes a full-screen sheet on mobile.
7. **`/employer/jobs/new`** — Single-column form in grouped sections:
   *Basics* (title, category, location, employment type),
   *Compensation* (salary min/max, currency, period),
   *Details* (description, requirements), *Status*.
   Validation on blur, submit disabled while pending, redirect to `/employer` with
   the new job visible.

**Navigation:** Sticky white header with a subtle border on scroll — logo,
"Find Jobs", "For Employers", then Sign In / Sign Up, or (mock-authenticated)
employer name + Dashboard + Sign Out. Hamburger opens a slide-in panel under
768px. The only "Post a Job" call to action lives in the employer dashboard hero
(§18.5) and in the footer's employer action. Footer: two-column navy brand footer —
logo, brand statement and copyright on the left, and a single route-aware audience
action on the right (job seeker, employer, or none on the auth pages). It carries
no navigation link lists, since the header already provides navigation.

---

## 9. Responsive behaviour

Breakpoints 640 / 768 / 1024 / 1280.

- Job grid 3 → 2 → 1 columns.
- Job detail two-column → stacked, with a sticky Apply bar.
- Filters collapse behind a filter icon into a bottom sheet under 768px.
- Employer job rows become stacked cards.
- Drawer becomes a full-screen sheet.
- Minimum 44px touch targets.

---

## 10. Mock data & state [V1 — superseded by §20]

**No longer current.** `src/lib/mock/` was deleted and this section's mock auth was
replaced during the Frontend ↔ Backend Integration phase (§20). Kept below as the
historical record of what V1 actually ran on, per CLAUDE.md §6.

- `lib/mock/jobs.mock.ts` — ~15 realistic jobs spanning categories, locations,
  salary ranges, and posted dates, so filter/sort/relevance are visibly exercised.
- `lib/mock/applications.mock.ts` — applications across several jobs, including one
  job with zero applications to demonstrate the empty state.
- `lib/mock/store.ts` — a module-level **in-memory** store seeded from the above.
  Posting a job or submitting an application mutates it, so both flows are
  demonstrable end to end. **A page refresh resets it — this is expected, not a bug.**
  No `localStorage`, no persistence layer.
- `lib/mock/latency.ts` — a 200–400ms delay so loading states are real.
- **Mock auth [V1]:** a small client context holding
  `{ isAuthenticated, role, name }`. Login and signup validate and redirect
  (Seeker → `/`, Employer → `/employer`). No route guards — `/employer` always
  renders as an authenticated employer. No tokens, no storage, no mechanism implied.

---

## 11. Form validation [V1]

In-house, zero dependencies: a small `useFormState` hook plus a shared
`validators.ts` module.

Rules: required fields, email format, cover letter minimum length,
salary max ≥ salary min, password confirmation match.

Behaviour: validate on blur and on submit, set `aria-invalid`, render inline
messages tied by `aria-describedby`, and move focus to the first error on a failed
submit.

---

## 12. States

- **Loading:** skeleton cards on `/`, skeleton detail on `/jobs/[id]`, skeleton rows
  in the drawer; pending state on all submit buttons.
- **Empty:** no jobs match the filters (with clear-all), employer has no jobs (with
  a Post a Job CTA), job has no applications.
- **Error:** root `error.tsx`, `not-found.tsx` for unknown job ids, inline `Alert`
  on a failed mock submit.
- **Validation:** as §11.
- **Success:** application confirmation panel; job-posted redirect with a brief
  confirmation banner on the dashboard.

---

## 13. Intentionally excluded from V1

Backend, API, database, and authentication mechanism · forgot password, email
verification, social login, MFA · ~~route guards and real session handling~~ (both added
in the integration phase, §20) · dark mode · **job editing (no Edit control at all)** ·
applicant accounts, saved jobs, application history · resume/file upload · pagination and
infinite scroll · email notifications · analytics · internationalisation · automated
frontend tests **[BRIEF: not required at this stage]** · Docker and deployment.

---

## 14. Verification & exit criteria

1. `npm run build` succeeds; `tsc --noEmit` and lint are clean.
2. All 7 routes plus `not-found` and `error` render without console errors.
3. Both flows work end to end on mock data:
   search → filter → sort → detail → apply → success; and
   signup (Employer) → dashboard → post job → job appears → open drawer → see the
   submitted application.
4. Search, all three filters, and all three sorts each verified to change results.
5. Every loading, empty, error, validation, and success state manually triggered.
6. Manual check at 375 / 768 / 1440px.
7. Keyboard-only pass through both flows; drawer and mobile nav trap focus and close
   on Esc.
8. Contrast spot-checked on primary text, buttons, and badges.
9. Grep-verified: no `fetch` outside `lib/data/`, and no import of `lib/mock/`
   outside `lib/data/`.

Results reported per CLAUDE.md §11 — run and verified, never assumed.

---

## 15. Approved decisions

1. **No dark mode in V1.** CSS token structure must remain suitable for adding it later.
2. **In-house form validation** (`useFormState` + `validators.ts`). No form library.
3. **Plus Jakarta Sans** as the single typeface.
4. **Mock persistence is in-memory only.** No `localStorage`.
5. **No Edit action on the Employer Dashboard** — removed from V1 rather than shipped
   as a disabled or non-functional control.
6. **Close/reopen and delete mock job actions are retained.**

## 16. Pending decisions

None open for Frontend V1.

Deferred to later phases (not decided here): the authoritative definition of
relevance sorting, authentication mechanism, database schema, API endpoint paths and
payload shapes, and all deployment concerns.

---

## 17. Post-V1

After Frontend V1 is implemented it will be reviewed, and features may be added,
removed, or changed **before** backend planning begins (CLAUDE.md §14). This document
is updated to describe what was actually built — including any divergence from this
plan and why — when implementation completes (CLAUDE.md §6).

---

## 18. Divergences from the approved plan

Recorded per CLAUDE.md §6. None of these change the approved scope.

### 18.1 `/jobs/[id]` is a Client Component, not a server shell

The plan said "server shell, client subparts". As built the page is a Client
Component.

**Why:** approved decision #4 keeps mock state **in-memory only**. A module-level
store is not shared between the server and client runtimes, so a Server Component
would read a *different* store instance than the one the apply form and the
employer dashboard mutate — a job posted in the browser would be missing from the
server-rendered detail page. Client rendering keeps one store and one source of
truth.

**Consequence:** an unknown job id renders the correct not-found UI, but the HTTP
status is `200` rather than `404`, because the lookup happens after hydration.
`/no-such-page` still returns a true `404`.

**At integration:** once jobs come from the Django API this reverts cleanly —
`/jobs/[id]` can become a Server Component that fetches server-side and calls
`notFound()` during the request, restoring a real 404. No UI code changes.

### 18.2 `/employer` is split into a server page plus a client dashboard

`app/employer/page.tsx` is a Server Component that renders
`components/employer/EmployerDashboard.tsx` inside a `<Suspense>` boundary.
Next.js 14 requires this because the dashboard reads `useSearchParams()` for the
"job posted" confirmation banner; without the boundary the static export fails.

### 18.3 Colour tokens shifted for WCAG AA

Contrast verification against the shipped `globals.css` found three failures in
the planned palette. Fixed:

| Token | Planned | Shipped | Reason |
|---|---|---|---|
| `--fg-muted` | `#64748B` | `#475569` | Frees the tone below it for `--fg-subtle` |
| `--fg-subtle` | `#94A3B8` | `#64748B` | Was 2.56:1 — failed AA for text (needs 4.5:1) |
| `--line-control` | *(did not exist)* | `#8592A6` | Form-control borders were 1.48:1 — failed WCAG 1.4.11 (needs 3:1) |

`--line` and `--line-strong` keep their planned values for decorative card and
divider edges, which are not subject to the 3:1 rule. All 17 checked token pairs
now pass.

### 18.4 Login demo affordance

§8.4 said sign-in role is "inferred (mock)". As built the rule is explicit: an
email containing `employer` signs in as an employer, and the login screen states
this in an info panel rather than leaving it as hidden behaviour.

### 18.5 Post-review UI refinements

Requested after the Frontend V1 review and applied on 2026-09-15.

- **Header** — the secondary "Post a Job" button shown beside Sign In / Sign Up
  in the employer area was removed, so no "Post a Job" control appears in the
  header. Posting is now reached from the employer dashboard hero CTA and from
  the footer call to action below. The header is otherwise unchanged.
- **Footer** — the Job Seekers / Employers / Account link columns were removed
  because they duplicated header navigation. Replaced with a compact two-column
  brand footer:
  - *Left* — logo, "Connecting talent with opportunities that matter.", and a
    "© 2026 NorthwindJobs" line.
  - *Right* — a single **context-aware** audience action, chosen by route. Never
    both at once:

    | Route | Action shown |
    |---|---|
    | `/`, `/jobs/[id]`, `/jobs/[id]/apply` | "Looking for your next opportunity?" → **Browse Jobs** (`/`) |
    | `/employer`, `/employer/jobs/new` | "Hiring talent?" → **Post a Job** (`/employer/jobs/new`) |
    | `/login`, `/signup` | none — brand side only |

  Selection lives in one `actionFor(pathname)` helper in `SiteFooter.tsx`: auth
  routes return null, `/employer*` returns the employer action, everything else
  returns the job-seeker action. There is a single footer component — no
  duplicated per-area variants. This makes `SiteFooter` a Client Component (it
  reads `usePathname`), as `SiteHeader` already was.

  The action uses the existing `onDark` Button variant at `size="sm"`, with its
  prompt above as a short white lead line over the established `fg-onDarkMuted`
  supporting tone. It carries no panel or border treatment, so it stays light and
  does not read as a navigation column. When no action is shown the footer drops
  to a single column so the brand side is not left stranded beside empty space.
  The navy direction, container width, typography scale, and spacing rhythm are
  unchanged. The two columns stack below `md`.
- The footer carries **no navigation link lists** and no placeholder Privacy,
  Terms, or social destinations. Its only links are the logo (home) and whichever
  audience action the route selects, all of which resolve to real existing pages.
- All project and development terminology was removed from user-facing UI;
  grep-verified across `src/app` and `src/components`.

---

## 19. Verification record

Run on 2026-09-15 against the implemented code.

**Automated / mechanical — all passing**

| Check | Result |
|---|---|
| `tsc --noEmit` | clean |
| `next lint` | no warnings or errors |
| `next build` | succeeds; 8 routes generated |
| All 7 routes + `not-found` respond | 7 × `200`, unknown page `404` |
| Server runtime log | no errors or warnings |
| Data-layer behaviour (33 checks) | 33 passed, 0 failed |
| Validation + formatting (21 checks) | 21 passed, 0 failed |
| WCAG contrast (17 token pairs) | 17 passed, 0 failed |
| No `fetch` outside `lib/data/` | clean |
| No `lib/mock/` import outside `lib/data/` | clean (one violation found and fixed) |
| No hardcoded colour values in components | clean |
| Every icon-only control has a label | 8/8 |

The 33 data-layer checks cover both mandated flows end to end: search → filter →
sort (all three) → detail → apply → application retrievable by the employer; and
post job → appears publicly and on the dashboard → close/reopen → delete cascades
to its applications.

**Not verified — requires a browser**

No automatable browser was available in the implementation environment (Firefox
only, no WebDriver). The following exit criteria from §14 remain open and need a
visual pass:

- Criterion 5 — every loading, empty, error, validation, and success state
  triggered visually (the logic behind each was verified; the rendering was not).
- Criterion 6 — manual check at 375 / 768 / 1440px.
- Criterion 7 — keyboard-only pass; drawer and mobile nav focus trap and Esc.
- Criterion 8 — visual confirmation of the contrast fixes in context.

Run `npm run dev` and review before treating Frontend V1 as accepted.

---

## 20. Frontend ↔ Backend Integration (implemented)

**Status:** `Implemented`
**Date:** 2026-09-15
**Follows:** `docs/BACKEND.md` (`Implemented`), specifically its §9 frontend integration
contract, which this section fulfils. No redesign — the approved contract was executed
as written, with the two incompatibilities it already flagged, plus the previously
undecided `/employer` route-guard behaviour, resolved as below.

### What changed

Exactly the surface §9 predicted: `src/lib/data/` plus a handful of small edits. No page,
component, or visual design changed.

1. **`src/lib/mock/` deleted** (4 files) — confirmed nothing outside `lib/data` imported
   it, then removed.
2. **`src/lib/data/client.ts` added** — the one fetch wrapper: base URL from
   `NEXT_PUBLIC_API_BASE_URL` (defaults to `http://localhost:8000/api` if unset, so no
   `.env.local` is required for local dev), `credentials: "include"`, JSON encode/decode,
   `X-CSRFToken` attached from the `csrftoken` cookie on every non-`GET` call, and an
   `ApiError` class (carries the HTTP status) so callers can branch on 404/403 without
   string-matching messages. DRF error bodies (`{"detail": "..."}` or
   `{"field": ["msg"]}`) are flattened into one message for the existing
   `Alert`/`submitError` slots — no form changed shape.
3. **The three `lib/data` modules rewritten function-for-function** — same names, same
   signatures the components already called:
   - `jobs.ts`: `listJobs` builds the `?search=&category=&location=&sort=` query string
     `apply_search_filter_sort` expects; `getJob` maps a `404` `ApiError` to `null`
     (preserving the existing not-found contract); `createJob`, `setJobStatus`,
     `deleteJob` map directly to their endpoints; `listEmployerJobs` now returns the new
     `EmployerJob` type (`Job & { applicationCount }`) instead of a plain `Job[]`.
   - `applications.ts`: `submitApplication` and `listApplications` call their endpoints;
     since the API scopes by `jobId` in the URL and doesn't echo it in the response body,
     `jobId` is attached to the returned object client-side — the adapter §5 anticipated.
     `countApplicationsByJob()` is deleted (§9 point 4).
   - `auth.ts`: `signIn`/`signUp` call their endpoints directly; new `getCurrentUser()`
     maps a `403` to `null` rather than throwing, so an anonymous visit is a normal state,
     not an error.
4. **Component edits — exactly the three §9 named, nothing else:**
   - `AuthProvider.tsx` — hydrates from `getCurrentUser()` on mount (alongside one
     `ensureCsrfCookie()` call, so the CSRF cookie exists before any page's first write,
     not only the login/signup screens); added a `loading` flag for the initial check;
     `signOut` now calls the API and is `async`. **Session survives a refresh** — the gap
     V1 explicitly could not close (`docs/FRONTEND.md` §10, old) is closed.
   - `LoginForm.tsx` — removed the mock `Alert` and the `EMPLOYER_EMAIL_HINT` rule; role
     comes from the real API response.
   - `EmployerDashboard.tsx` — dropped `countApplicationsByJob()`; builds its existing
     `counts` map from each job's `applicationCount` instead, so `EmployerJobList` and
     `EmployerJobRow` needed no changes at all.

### The two incompatibilities §9 flagged — both resolved as written

**(a) Signup now collects a company name.** `SignupForm.tsx` gained one conditional
`Field` — **Company name**, shown only when the Employer toggle is on, with "Full name"
relabelled to "Your name" in that branch. `types/user.ts`'s `MockUser` became `User`
(`{ id, name, email, role, employer: { id, name, contactEmail } | null }`); `SignUpInput`
gained an optional `companyName`. `AuthProvider`'s `employerName` now reads
`user.employer?.name` (falls back to `""` while loading); `DEFAULT_EMPLOYER_NAME` was
deleted with the mock layer.

**(b) Application `status` removed**, matching the backend dropping it (`docs/BACKEND.md`
§2). The `New` badge in `ApplicationListItem.tsx` is gone; `types/application.ts` no
longer has `status`; the now-unreferenced `ApplicationStatus` type is gone from
`types/job.ts`; `APPLICATION_STATUSES` is gone from `constants/statuses.ts`.

### The employer route guard — resolved

V1 deliberately had none (§13, old). Decided for this phase and implemented as
`src/middleware.ts`, matched on `/employer/:path*`:

- **anonymous → `/login`**
- **seeker → `/`**
- **employer → allowed**

The guard calls `GET /api/auth/me` server-side (forwarding the request's cookies) before
any page renders, and fails closed to `/login` if the backend is unreachable. It lives in
middleware, not inside any page component — `/employer/page.tsx` and every page under it
are unchanged, and **no page's rendering strategy changed because of this guard**.

### What did not change (told not to)

**`/jobs/[id]` stays a Client Component** — not reverted to a Server Component, per this
phase's explicit instruction. The consequence recorded in §18.1 still holds exactly as
written: an unknown job id resolves client-side, so the response is HTTP `200` before the
not-found UI renders (verified: `curl` against an unknown UUID returns `200`). This
remains open for a future phase, not decided here.

Everything else survived untouched, as §9 predicted: `Job`, `JobQuery`, `JobSort`, and the
whole `lib/data` function surface, since the API is camelCase, `id` is a string (UUID),
and the query parameters are `JobQuery`'s own field names.

### Verified

No browser was available in this environment (as in V1 — Firefox only, no automatable
WebDriver), so verification is: `tsc --noEmit`, `next lint`, and `next build` all clean
(the build compiles `src/middleware.ts`, ~26.6 kB); the Next.js dev server and the real
`docker compose` backend (migrated once, per `docs/BACKEND.md` §15.6) both running
together; and every mandated flow replayed with the exact requests the rewired code makes
— same URL, same `credentials: "include"`, same CSRF cookie mechanics — checked against
both servers' logs for errors.

Confirmed working end to end: employer signup (with a company name distinct from the
person's name) → route guard allows `/employer` and `/employer/jobs/new` → post a job →
appears on `GET /api/jobs/` (the public list) → seeker signs up → applies with no auth
and no CSRF token → employer reviews it via the employer-scoped endpoint → dashboard's
`applicationCount` reflects it. Also confirmed: seeker hitting `/employer/*` redirects to
`/`; anonymous hitting `/employer/*` redirects to `/login`; a session survives being
reused across requests (the refresh case V1 could not do); sign-out calls the API with a
CSRF token and actually clears the session, after which the guard blocks that
now-anonymous session again. Neither server's logs showed an error after the one
expected, already-documented one-time dev-database migration.

Not independently re-verified in this phase: the full negative-path and search/sort
matrix already proved directly against the API in `docs/BACKEND.md` §11/§16 — integration
reuses that API unchanged, so it was spot-checked here rather than repeated in full.
