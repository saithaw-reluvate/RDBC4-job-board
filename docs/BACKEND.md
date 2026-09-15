# Backend + Database — Design & Implementation Plan

**Status:** `Implemented`
**Approved:** 2026-09-15
**Implemented:** 2026-09-15
**Phase:** Backend + Database. Follows Frontend V1 (`docs/FRONTEND.md`, `Implemented`).
**Scope:** Backend only. The frontend integration described in §9 was carried out
separately — see `docs/FRONTEND.md` §20 for what was actually built there.
**Decisions confirmed 2026-09-15:** backend at `backend/` (frontend stays at the repo
root) · Django session-cookie auth · minimal dev Compose (`db` + `backend`) as the run
and test environment · **backend only — frontend rewiring is the next phase**.

Tags: **[BRIEF]** mandated by RBDC Ex 4 · **[REC]** approved design decision ·
**[OPT]** optional, already present in Frontend V1 and carried forward.

Per CLAUDE.md §6 this is a living document. Sections 1-10 below describe what was
**actually built**, verified against the real implementation, not the original plan from
memory. Where implementation diverged from the plan, §15 records what changed and why —
everything else matched the plan as approved. §16 is the verification record.

---

## Context

Frontend V1 is implemented and merged to `main`. It runs entirely on an isolated
in-memory mock layer: `src/lib/mock/` behind `src/lib/data/{jobs,applications,auth}.ts`.
Components never `fetch` and never import `lib/mock` — that seam is the whole
integration surface (`docs/FRONTEND.md` §5).

This phase designs and builds the Django 5.1 + PostgreSQL backend that replaces that
mock layer: real persistence, real authentication, and the search/filter/sort logic the
brief requires to live in the backend API. No frontend code is rewired in this phase
(see §10).

**Verified against the current code, not assumed:** the frontend `Job` shape
(`src/types/job.ts`), `Application` shape (`src/types/application.ts`), `MockUser`
(`src/types/user.ts`), the V1 relevance formula (`src/lib/data/jobs.ts`), the data-layer
function list, and the form validation thresholds (`ApplicationForm.tsx`, `JobForm.tsx`).

---

## 1. Architecture

```
Next.js 14 (browser)  ──HTTP/JSON, cookies──▶  Django 5.1 + DRF  ──▶  PostgreSQL 16
      src/lib/data/*                              /api/…                 jobs, applications,
      (only network layer)                                               users, employers
```

- **Django REST Framework [REC].** Serializers give declarative validation and
  field-by-field error responses that map onto the existing form error UI; generic
  views + permission classes remove the hand-rolled auth checks that plain Django views
  would need; the browsable API covers the brief's "verify with Postman" expectation
  without extra tooling. Hand-rolling this would re-implement DRF badly.
- **Three Django apps**, matching the brief's three core models: `accounts`
  (User, Employer), `jobs` (Job), `applications` (Application). Django apps are cheap;
  this is the boundary the domain already has, not an invented layer.
- **No service layer.** The only logic that earns its own module is the query/search
  logic (`jobs/queries.py`), which the brief explicitly places in the backend.
  Everything else is thin: serializer validates, view orchestrates, model persists.

### Dependencies (all pinned in `backend/requirements.txt`)

| Package | Why |
|---|---|
| `Django==5.1.*` | **[BRIEF]** |
| `djangorestframework` | API layer (above) |
| `psycopg[binary]` | PostgreSQL driver **[BRIEF]** |
| `django-cors-headers` | Next.js and Django are separate origins |
| `gunicorn` | production server (used in the later Docker phase) |
| `pytest`, `pytest-django`, `pytest-cov` | test runner + coverage **[REC]** |

No `django-environ` (plain `os.environ` is enough), no `djangorestframework-camel-case`
(explicit `source=` on serializer fields is ~15 lines), no JWT library, no filter
library. Config comes from environment variables only — no hardcoded hosts, ports, or
credentials (CLAUDE.md §13).

### Run and test environment

The host has Python 3.14 (Django 5.1 supports 3.10–3.13 only), no `pip`, and no
PostgreSQL. So the backend runs and is tested **inside containers from day one** —
a deliberately minimal Compose file, not the Dockerisation phase:

```yaml
# docker-compose.yml  (dev only, this phase)
services:
  db:       postgres:16      # env-driven credentials, named volume
  backend:  build ./backend  # python:3.12-slim, runserver, source bind-mounted
```

`docker compose run --rm backend pytest` is how the suite runs, so **tests execute
against real PostgreSQL** as CLAUDE.md §12 requires. `.env.example` gains placeholder
`POSTGRES_*`, `DJANGO_SECRET_KEY`, `DJANGO_DEBUG`, `DJANGO_ALLOWED_HOSTS`, and
`CORS_ALLOWED_ORIGINS` entries; no real values are committed.

**Out of scope here, left to the Dockerisation phase:** the frontend service, a
production image target, gunicorn wiring, static file serving, and all EC2 configuration.

---

## 2. Models and relationships

```
User 1──1 Employer 1──* Job 1──* Application
(role: seeker|employer)
```

### `accounts.User` — custom, `AUTH_USER_MODEL` **[REC]**

| Field | Type | Notes |
|---|---|---|
| `email` | `EmailField(unique=True)` | `USERNAME_FIELD`; no `username` |
| `full_name` | `CharField(150)` | the signup form's single `name` field |
| `role` | `CharField(10, choices)` | `seeker` \| `employer` **[OPT]** |
| `password` | inherited | Django PBKDF2 hashing |
| `is_active`, `is_staff`, `date_joined` | inherited | |

A custom `UserManager` creates users by email. Email login is what the frontend already
collects; adding a username field nobody supplies would be dead weight.

### `accounts.Employer` **[BRIEF: "Employer — employer name and contact information"]**

| Field | Type | Notes |
|---|---|---|
| `user` | `OneToOneField(User, CASCADE, related_name="employer")` | |
| `name` | `CharField(200)` | company name — the `employerName` the frontend displays |
| `contact_email` | `EmailField` | seeded from the account email at signup |
| `contact_phone` | `CharField(40, blank=True)` | optional; no UI collects it yet |
| `created_at` | `DateTimeField(auto_now_add=True)` | |

Created in the same transaction as the user when `role == "employer"`. That a seeker has
no `Employer` row is enforced in the signup serializer and covered by a test (a DB
constraint can't span the two tables).

### `jobs.Job` **[BRIEF: title, description, location, requirements, status]**

| Field | Type | Notes |
|---|---|---|
| `id` | `UUIDField(primary_key)` **[REC]** | keeps the frontend's `id: string` type unchanged; non-enumerable |
| `employer` | `ForeignKey(Employer, CASCADE, related_name="jobs")` | ownership + `employerName` |
| `title` | `CharField(200)` | **[BRIEF]** |
| `description` | `TextField` | **[BRIEF]**, min 40 chars (matches `JobForm`) |
| `requirements` | `ArrayField(CharField(500))` **[REC]** | **[BRIEF]**; frontend already holds `string[]`, no string munging |
| `location` | `CharField(120)` | **[BRIEF]**; free text, the frontend select constrains input |
| `category` | `CharField(40, choices)` | **[BRIEF by implication]** — filtering by category needs a controlled vocabulary |
| `employment_type` | `CharField(20, choices)` | **[OPT]** displayed in V1, not filtered |
| `salary_min` / `salary_max` | `PositiveIntegerField` | **[BRIEF by implication]** — sort by salary |
| `salary_currency` | `CharField(3, choices USD/GBP/EUR, default USD)` | **[OPT]** |
| `salary_period` | `CharField(10, choices year/month/hour, default year)` | **[OPT]** |
| `status` | `CharField(10, choices Open/Closed, default Open)` | **[BRIEF]** |
| `posted_at` | `DateTimeField(auto_now_add=True)` | **[BRIEF]** sort by date posted |
| `updated_at` | `DateTimeField(auto_now=True)` | |

- `Meta.ordering = ["-posted_at", "-id"]` — total ordering, so tests are deterministic.
- `CheckConstraint(salary_max >= salary_min)` — the rule `JobForm` validates client-side,
  enforced where it actually matters.
- Indexes: `-posted_at`, `category`, `-salary_max` — one per mandated sort/filter path.
  Deliberately **no** trigram/GIN index: unjustified at this scale.

### `applications.Application` **[BRIEF: name, email, cover letter, linked to a job]**

| Field | Type | Notes |
|---|---|---|
| `id` | `UUIDField(primary_key)` | as above |
| `job` | `ForeignKey(Job, CASCADE, related_name="applications")` | **[BRIEF]** the association |
| `applicant_name` | `CharField(150)` | **[BRIEF]** |
| `applicant_email` | `EmailField` | **[BRIEF]** |
| `cover_letter` | `TextField` | **[BRIEF]**; 50–2000 chars (matches `ApplicationForm`) |
| `submitted_at` | `DateTimeField(auto_now_add=True)` | |

- `Meta.ordering = ["-submitted_at", "-id"]`; index on `(job, -submitted_at)`.
- `UniqueConstraint(job, applicant_email)` **[REC]** — one application per email per job.
  Surfaces through the existing `Alert` in `ApplicationForm`.
- Applications are **anonymous** — no FK to `User`. Frontend V1 states "No account needed
  to browse or apply", and the brief's Application model carries only name/email/letter.

**No `status` field.** Verified in the code: the only consumer of V1's New/Reviewed state
is the badge at `ApplicationListItem.tsx:34`; `APPLICATION_STATUSES` in
`src/constants/statuses.ts` is referenced nowhere, and nothing in `src/` mutates the
value — the mock seeds `"Reviewed"` purely to give the badge visual variety. Persisting it
would make every real application `New` permanently, so the badge would render on every
row forever and mean nothing. Adding a "mark reviewed" endpoint instead would be an
unapproved feature with no UI to call it. It is dropped; the frontend consequence is
recorded in §9.

**Choice values match the frontend's wire values exactly** (`"Open"`, `"Engineering"`,
`"Full-time"`, `"year"`) **[REC]** — no mapping layer, no frontend constant changes.

---

## 3. Authentication and authorization

**Approved: Django session authentication over an httpOnly cookie, via DRF
`SessionAuthentication`, with CSRF enforced and `django-cors-headers` configured for
credentialed requests.** **[REC]**

Why, briefly: the session framework and password hashing are already in Django, so this
adds one dependency rather than a token library; the session cookie is httpOnly, so no
credential is reachable from JavaScript (unlike a token in `localStorage`); logout is a
real server-side invalidation; and `GET /api/auth/me` on page load restores the session
across refreshes, which the current in-memory `AuthProvider` cannot do. `localhost:3000`
and `localhost:8000` are same-site, so a `SameSite=Lax` cookie works in development, and
behind one origin on EC2 it is same-origin.

- **Role representation:** a `role` field on `User` (`seeker` | `employer`), chosen at
  signup by the existing `RoleToggle`. Not Django Groups — two fixed roles with no
  permission granularity to configure.
- **Employer-only operations** are protected by `accounts/permissions.py::IsEmployer`
  (authenticated **and** `role == "employer"` **and** has an `Employer` row), and
  `IsEmployerOrReadOnly` for the mixed public-read / employer-write job collection.
- **Job ↔ employer association** comes from `request.user.employer` on create. The
  `employer` field is **read-only in the serializer** — a client cannot post a job as
  someone else, and there is a test for exactly that.
- **Cross-employer isolation is queryset scoping, not an object permission.** Every
  employer-scoped view sets
  `get_queryset() -> Job.objects.filter(employer=self.request.user.employer)`. Another
  employer's job is simply not in scope, so `get_object()` raises `Http404` → **404**.
  There is **no `IsJobOwner` class**: an object permission placed after a scoped queryset
  never runs, and having both would be dead code that implies a `403` the framework will
  never produce. 404 also avoids disclosing that the resource exists.
- **Password rules:** Django's default validators plus the 8-character minimum the
  signup form already states.

- **Personal name and company name are distinct.** `User.full_name` is the person;
  `Employer.name` is the company. The backend never conflates them — see §4 for the wire
  representation and §9 for the frontend consequence.

### Status codes — stock DRF behaviour, adopted rather than overridden

With `SessionAuthentication` as the only authenticator, `BaseAuthentication.
authenticate_header()` returns `None`, so `APIView.handle_exception` coerces
`NotAuthenticated` to **403**, not 401. DRF therefore never emits a 401 in this
configuration. Forcing 401 would mean writing a custom authentication class purely to set
a `WWW-Authenticate` header for a scheme browsers should not be prompted with — so we take
the framework's behaviour as-is and are consistent about it:

| Situation | Code | Produced by |
|---|---|---|
| Anonymous → any protected endpoint (incl. `/api/auth/me/`) | **403** | DRF coercion described above |
| Authenticated seeker → employer-only endpoint | **403** | `IsEmployer` |
| Employer → another employer's job or its applications | **404** | scoped queryset → `Http404` |
| Missing / invalid CSRF token on a write | **403** | `SessionAuthentication.enforce_csrf` |
| Wrong email or password on login | **400** | login serializer `ValidationError` |
| Field validation failure | **400** | serializer |
| Unknown job id on a public route | **404** | |

`401` is therefore not a response this API returns, and no test asserts it. **Test group 0 pins
this**: a test asserts the observed code for an anonymous protected request, so the
behaviour is verified against the installed DRF version rather than trusted from this
plan. If it turns out to differ, the table and the tests are corrected together — no
custom code is added to make reality match the table.

Explicitly **not** included: social login, MFA, email verification, password reset,
refresh tokens, rate limiting.

---

## 4. API endpoints

Base `/api`, trailing slashes (Django default). All request/response bodies are
**camelCase**, produced by explicit `source=` on serializer fields **[REC]** — so the
frontend's existing types need no mapping layer.

### Auth

| Method | Path | Purpose | Auth |
|---|---|---|---|
| `GET` | `/api/auth/csrf/` | set the `csrftoken` cookie before the first write | public |
| `POST` | `/api/auth/signup/` | create account (+ `Employer` when role=employer), log in | public |
| `POST` | `/api/auth/login/` | start a session | public |
| `POST` | `/api/auth/logout/` | end the session | authenticated |
| `GET` | `/api/auth/me/` | current user; `403` when anonymous (§3) | authenticated |

`signup`, `login` and `me` all return the same user payload. It keeps `name`/`email`/`role`
meaning what they already mean, and adds the company identity where it belongs instead of
overloading `name`:

```jsonc
{
  "id": "…",
  "name": "Dana Okoro",            // User.full_name — the person
  "email": "dana@northwind.test",
  "role": "employer",
  "employer": {                    // null when role == "seeker"
    "id": "…",
    "name": "Northwind Labs",      // Employer.name — the company
    "contactEmail": "hiring@northwind.test"
  }
}
```

Signup accepts `{ name, email, password, role, companyName }`, where **`companyName` is
required when `role == "employer"`** and rejected otherwise. `Employer.contact_email`
defaults to the account email (no UI collects a separate one) and `contact_phone` stays
blank. `Job.employerName` continues to come from `job.employer.name`, which was already
correct.

### Jobs

| Method | Path | Purpose | Auth |
|---|---|---|---|
| `GET` | `/api/jobs/` | browse + search/filter/sort (§5) | public |
| `POST` | `/api/jobs/` | employer posts a job | `IsEmployerOrReadOnly` |
| `GET` | `/api/jobs/{id}/` | one job; `404` unknown | public |
| `GET` | `/api/employer/jobs/` | own jobs + `applicationCount` | `IsEmployer`, scoped |
| `PATCH` | `/api/employer/jobs/{id}/` | close / reopen (`status` only) **[OPT, retained from V1]** | `IsEmployer`, scoped |
| `DELETE` | `/api/employer/jobs/{id}/` | delete job, cascading its applications **[OPT, retained from V1]** | `IsEmployer`, scoped |

The employer's object-level operations moved under `/api/employer/jobs/{id}/` **[revised]**.
Previously they sat on the public `/api/jobs/{id}/`, which would have forced one view to
carry two different querysets and two permission regimes for the same URL. Separating them
lets each view declare a single queryset — public-all for reads, `employer=…`-scoped for
writes — which is what makes the 404 in §3 fall out of the framework instead of being
hand-rolled. `POST /api/jobs/` stays on the public collection: creation looks up no object,
so no scoping conflict arises.

`applicationCount` is annotated with `Count("applications")` on `/api/employer/jobs/`,
which removes the mock layer's separate `countApplicationsByJob()` round trip.
`PATCH` accepts `status` only — V1 has no Edit control (`docs/FRONTEND.md` §15.5), so no
general update surface is exposed.

### Applications

| Method | Path | Purpose | Auth |
|---|---|---|---|
| `POST` | `/api/jobs/{id}/applications/` | submit an application | public |
| `GET` | `/api/employer/jobs/{id}/applications/` | applications for **own** job | `IsEmployer`, scoped |

Submission and review are deliberately different resources on different paths: one is
public and writes, the other is employer-scoped and reads, and each gets its own queryset.
There is no application `status` endpoint, because the field no longer exists (§2).

**Not included** (no approved UI needs them): job full-update, applicant application
history, employer profile read/update, category/location metadata endpoint, pagination,
admin endpoints.

---

## 5. Search, filter, sort, and relevance

All of it lives in **`jobs/queries.py`** as one pure function over a queryset **[BRIEF:
"Backend APIs will handle the logic for these queries"]**. Views call it; they don't
contain it.

`GET /api/jobs/?search=&category=&location=&sort=` — the exact `JobQuery` shape the
frontend already builds (`src/types/job.ts`).

- `category`, `location` — exact match, applied only when non-empty.
- `search` — matches when the weighted score below is `> 0`, i.e. a case-insensitive
  substring hit in any scored field. This is a superset of the brief's "title, category
  and location" and is what V1 already does.
- `sort` — `newest` (default) | `salary` | `relevance`.
  - `newest` → `-posted_at, -id`
  - `salary` → `-salary_max, -posted_at, -id` (highest ceiling first, as V1)
  - `relevance` → `-relevance, -posted_at, -id`

### Relevance definition **[REC — the brief mandates it and leaves it undefined]**

A **weighted substring match**, computed in SQL as a sum of `Case/When` annotations:

| Field | Weight |
|---|---|
| `title` | 10 |
| `category` | 5 |
| `location` | 5 |
| `employer.name` | 3 |
| `description` | 2 |
| `requirements` (joined via `array_to_string`) | 1 |

`requirements` is an `ArrayField`, which has no `__icontains` lookup, so it is scored by
annotating a joined text form first and referencing that annotation in a second
`annotate()`:

```python
qs = qs.annotate(
    requirements_text=Func(F("requirements"), Value(" "),
                           function="array_to_string", output_field=TextField()),
).annotate(relevance=<sum of Case/When, including requirements_text__icontains>)
```

**Verified before it was relied on, not assumed.** Test group 5a (§8) ran first, before
any other query test was written, and asserts, against real PostgreSQL, that a job whose
search term appears *only* in `requirements` is matched and scores exactly 1. **It passed
on the first implementation** — `array_to_string(varchar[], text)` accepts what
`ArrayField(CharField)` actually stores, a later `annotate()` can reference an earlier
annotation inside `Case/When`, and `__icontains` compiles correctly against an expression
rather than a column. The fallback below was not needed.

**Pre-agreed fallback if 5a had not come out clean:** drop `requirements` from the
formula — it carries the lowest weight, the brief mandates searching title, category and
location only, and every other field is a plain column. The divergence from V1's formula
would be recorded in `docs/BACKEND.md`. No second search mechanism is introduced either
way, and `ArrayField` stays regardless, since storage and search are separable concerns.

Deterministic (integer scores, total ordering including `id`), directly assertable in
tests, requires no extension, and matches the V1 formula in `src/lib/data/jobs.ts` — so
sorting behaviour does not visibly change at integration.

Rejected: Postgres full-text `SearchVector`/`SearchRank` (stemmed, float-ranked, no
substring matching — harder to test and would change observable behaviour for no gain
here); Elasticsearch, embeddings, or any AI search (disproportionate infrastructure).

**Relevance with no search query → falls back to `newest`**, documented and tested. The
frontend already hides the Relevance option until a search term exists
(`SORT_OPTIONS.requiresSearch`), so the fallback is a safety net for direct API callers,
not a UI path. An unknown `sort` value also falls back to `newest`.

---

## 6. Validation and business rules

Enforced in serializers (and at the DB where it is an integrity rule):

**Job** — title required; description ≥ 40 chars; ≥ 1 requirement; `salary_min ≥ 0`;
`salary_max ≥ salary_min` (serializer **and** `CheckConstraint`); `category`,
`employment_type`, `status`, `salary_currency`, `salary_period` limited to their choices;
`employer` read-only, always taken from `request.user`.

**Application** — name required; valid email; cover letter 50–2000 chars;
**the job must exist (`404`) and be `Open` (`400`)** — the rule `JobForm`'s status section
already promises ("Closed jobs stay visible but cannot be applied to") and which the V1
frontend does not currently enforce anywhere; one application per email per job (`400`).

**Auth** — email unique and normalised (case-insensitive); password ≥ 8 chars plus
Django's validators; `role` limited to its choices; **`companyName` required when
`role == "employer"` and rejected when `role == "seeker"`** (so a seeker can never end up
with an `Employer` row, and an employer can never end up without one).

Thresholds are stated once as module constants so the numbers are not duplicated across
serializer, model, and tests (DRY).

---

## 7. Django module structure

The frontend stays exactly where it is at the repository root; the backend is added
alongside it as `backend/`, plus a root `docker-compose.yml` and `backend/Dockerfile`.

```
backend/
  Dockerfile                  # python:3.12-slim, dev target
  manage.py
  requirements.txt
  pytest.ini                  # DJANGO_SETTINGS_MODULE, coverage config
  config/
    settings.py               # env-driven; no hardcoded credentials
    urls.py                   # /api/ root, /admin/
    wsgi.py  asgi.py
  accounts/
    models.py                 # User, UserManager, Employer
    serializers.py            # SignupSerializer, LoginSerializer, UserSerializer, EmployerSerializer
    views.py                  # signup, login, logout, me, csrf
    permissions.py            # IsEmployer, IsEmployerOrReadOnly  ← all role checks live here
    urls.py  admin.py  migrations/
    tests/  test_models.py  test_auth_api.py  test_permissions.py
  jobs/
    models.py                 # Job + choices
    serializers.py            # JobSerializer, JobCreateSerializer, EmployerJobSerializer
    queries.py                # search / filter / sort / relevance  ← the only "logic" module
    views.py                  # JobListCreateView, JobDetailView,
                              #   EmployerJobListView, EmployerJobDetailView  (scoped querysets)
    urls.py  admin.py  migrations/
    tests/  test_models.py  test_queries.py  test_jobs_api.py  test_scoping.py
  applications/
    models.py  serializers.py  views.py  urls.py  admin.py  migrations/
    tests/  test_models.py  test_applications_api.py
```

Separation of concerns: models persist, serializers validate and shape, `queries.py`
holds query logic, permissions hold **role** authorization, view querysets hold
**ownership** scoping, views only orchestrate. Each module is describable without an "and"
(CLAUDE.md §8). `jobs/permissions.py` no longer exists — with ownership enforced by
scoping, every permission class left is role-based and belongs next to the `role` field
in `accounts/`. Admin registration is minimal — three `ModelAdmin`s, useful for manual
verification, no customisation.

---

## 8. TDD implementation sequence

Strict red → green → refactor per step; the failing test is written first (CLAUDE.md §12).
Tests run against **PostgreSQL**, never SQLite.

| # | Group | Red tests first |
|---|---|---|
| 0 | Harness | settings load, Postgres connection, smoke test, **and the §3 status-code pin: assert the code DRF actually returns for an anonymous protected request** |
| 1 | `accounts` models | email uniqueness + normalisation, password hashing, role choices, `Employer` 1–1 + cascade, **`full_name` and `Employer.name` independently settable and independently returned** |
| 2 | Auth API | signup seeker (no `Employer` row, `employer: null`) / signup employer (creates `Employer`, `employer.name` = `companyName` ≠ `name`) / **employer signup without `companyName` → 400** / **seeker signup with `companyName` → 400** / duplicate email / short password / login ok / login wrong password `400` / `me` `403` then `200` / logout clears session |
| 3 | `jobs` model | required fields, defaults (`status=Open`, `posted_at`), ordering, salary `CheckConstraint`, cascade from `Employer` |
| 4 | Jobs read API | list shape (camelCase), `employerName` resolves to the company not the person, detail, `404` unknown id, empty list |
| 5a | `queries.py` **spike first** | **`array_to_string` relevance over `ArrayField` against real PostgreSQL** — a job matching *only* in `requirements` is returned and scores exactly 1. Gates whether §5's fallback is taken; run before the rest of group 5 |
| 5b | `queries.py` | filter by category / location / both; search hits and misses; sort newest; sort salary; **relevance ranking order**; relevance without a query = newest; unknown sort = newest; ties broken deterministically |
| 6 | Jobs write API | create as employer `201`; as seeker `403`; anonymous `403`; validation `400`s; **client-supplied `employer` ignored** |
| 7 | Scoping | `/api/employer/jobs/` returns only own jobs with correct counts; PATCH/DELETE own ok; **another employer's job `404`** (not 403 — it is out of queryset scope); delete cascades applications |
| 8 | `applications` model | FK + cascade, ordering, unique (job, email) |
| 9 | Applications API | submit `201`; missing/invalid fields `400`; cover letter too short/long `400`; unknown job `404`; **closed job `400`**; duplicate `400` |
| 10 | Applications read | owner employer `200` newest-first; **other employer `404`**; seeker `403`; anonymous `403` |
| 11 | Gate | full run + `pytest --cov`; report the **actual** number |

Shared fixtures (`conftest.py`): `seeker`, `employer`, `other_employer`, `job`,
`api_client`, `auth_client` — so no test rebuilds the same setup (DRY).

---

## 9. Frontend integration contract

**Executed as its own later phase**, exactly as planned here — this backend phase ended
with the API verified independently first. The contract below is unchanged from what was
approved; `docs/FRONTEND.md` §20 records the implementation and its own small divergences.

The entire change is inside `src/lib/data/` plus three small component edits.

1. **Delete `src/lib/mock/`** (4 files). Nothing outside `lib/data` imports it — already
   grep-verified in V1.
2. **Add `src/lib/data/client.ts`** — one fetch wrapper: base URL from
   `NEXT_PUBLIC_API_BASE_URL` (already in `.env.example`), `credentials: "include"`,
   JSON encode/decode, `X-CSRFToken` on writes, and DRF error bodies flattened into an
   `Error` message. The only new module.
3. **Rewrite the three `lib/data` modules** function-for-function — same names, same
   signatures, same return types:
   `listJobs(query)` → `GET /api/jobs/?…` · `getJob(id)` → `GET /api/jobs/{id}/` ·
   `createJob(input)` → `POST /api/jobs/` · `setJobStatus(id, status)` → `PATCH` ·
   `deleteJob(id)` → `DELETE` · `listEmployerJobs()` → `GET /api/employer/jobs/` ·
   `listApplications(jobId)` / `submitApplication(input)` → the applications endpoints ·
   `signIn` / `signUp` → the auth endpoints, plus a new `getCurrentUser()`.
4. **Component edits, all small:**
   - `AuthProvider.tsx` — hydrate from `GET /api/auth/me` on mount instead of holding
     in-memory state; `signOut` calls the endpoint. Session now survives a refresh.
   - `LoginForm.tsx` — remove the mock `Alert` and the `EMPLOYER_EMAIL_HINT` rule; the
     role comes from the API response.
   - `EmployerDashboard.tsx` — drop `countApplicationsByJob()`; read `applicationCount`
     off each job.

### Two genuine incompatibilities **[revised — the earlier "none found" was wrong]**

Both were confirmed by reading the code, and both are *recorded* here for the integration
phase, not fixed now. Neither is a redesign; together they are one new field and a handful
of deletions.

**(a) Signup collects no company name.** `SignupForm.tsx:88` renders a single
`Field id="name" label="Full name"` for both roles — only the *placeholder* changes to
"Acme Inc." when the Employer toggle is on. So the company name is never captured. V1 hides
this because `lib/data/auth.ts:46` makes sign-in *always* return the hardcoded
`DEMO_EMPLOYER` as an employer's `name`, and `AuthProvider.tsx:38-41` then serves that as
`employerName`. Against a real backend, the dashboard `<h1>` would show the signing-up
person's personal name as the company. Minimum change required:

| File | Change |
|---|---|
| `SignupForm.tsx` | one conditional `Field` — **Company name**, shown only when `role === "employer"`; relabel `name` to "Your name" in that branch; add `companyName` to the `signUp` payload and its validator |
| `types/user.ts` | `MockUser` → `User`, gaining `employer: { id, name, contactEmail } \| null`; `SignUpInput` gains optional `companyName` |
| `AuthProvider.tsx` | `employerName` reads `user.employer?.name`; `DEFAULT_EMPLOYER_NAME` deleted with the mock layer |

**(b) Application `status` disappears.** Dropped from the backend (§2). Consequence:

| File | Change |
|---|---|
| `ApplicationListItem.tsx:34` | remove the `New` badge |
| `types/application.ts` | remove `status` |
| `types/job.ts` | remove the now-unreferenced `ApplicationStatus` type |
| `constants/statuses.ts` | remove `APPLICATION_STATUSES` (already referenced nowhere) |

Everything else does survive untouched: `Job`, `JobQuery`, `JobSort` and the whole
`lib/data` function surface, because the API is camelCase, `id` is a string (UUID), and
the query parameters are `JobQuery`'s own field names.

Two further things become newly possible once real auth exists. Both were resolved during
the integration phase, not here:

- **A route guard on `/employer`** (V1 deliberately had none — `docs/FRONTEND.md` §13).
  Decided: anonymous → `/login`, seeker → `/`, employer → allowed. Implemented as
  `src/middleware.ts`, not inside any page — see `docs/FRONTEND.md` §20.
- **Reverting `/jobs/[id]` to a Server Component for a true `404`** (§18.1). Explicitly
  **not done** this phase (told not to); the page stays a Client Component and an unknown
  id still resolves client-side, so an unknown job returns HTTP `200` before the not-found
  UI renders. Still open for a future phase.

---

## 10. Intentionally excluded from this phase

Frontend containerisation, the production image, gunicorn wiring, and AWS EC2 deployment
(the Dockerisation phase — only a minimal dev `db` + `backend` Compose is built here) ·
frontend rewiring (§9) ·
frontend tests **[BRIEF: not required]** · job editing · application status transitions ·
pagination / infinite scroll · résumé or file upload · password reset, email
verification, social login, MFA · email notifications · rate limiting / throttling ·
seeker application history · public employer profiles · saved jobs · caching, queues,
background jobs · full-text search infrastructure · API versioning · OpenAPI schema
generation (the API doc is written by hand in `docs/BACKEND.md`).

---

## 11. Verification and exit criteria — all met

1. `docker compose run --rm backend pytest` — **117/117 tests passing**, against
   PostgreSQL 16 in the `db` container.
2. `pytest --cov` (source-only: `.coveragerc` excludes `tests/`, `migrations/`, and
   `wsgi.py`/`asgi.py`) — **98% (436 statements, 8 missed)**, well above the 70% gate.
   The actual tool output, not an estimate; see §16 for the full per-file table.
3. Every endpoint in §4 exercised manually with `curl` against a running
   `docker compose up` server — session cookies and CSRF tokens handled exactly as a real
   browser client would. Full transcript in §16.
4. Both mandated workflows proved end to end through the live API: employer signup
   (`dana@northwind.test` / "Northwind Labs") → post job → job appears in the public
   list → seeker (`priya@example.com`) applies → employer reads the application via
   `GET /api/employer/jobs/{id}/applications/`. Search, both filters, and all three
   sorts each verified to return different, correct orderings against three live jobs.
5. Negative paths demonstrated live, not just asserted in tests: anonymous
   `POST /api/jobs/` → **403**; seeker → **403**; employer B touching employer A's job
   → **403 then 404** (see §15.3 — the first attempt used a CSRF token captured before
   login, which Django rotates on login; with a fresh token the request correctly
   returned **404**); employer B reading employer A's applications → **404** directly;
   applying to a closed job → **400**; duplicate application (same email, same job) →
   **400**; missing CSRF token on an authenticated write → **403**. No `401` was observed
   anywhere, matching §3.
6. Confirmed live: signup as **Dana Okoro** with company name **Northwind Labs** →
   `GET /api/auth/me` returns `"name": "Dana Okoro"` and `"employer": {"name": "Northwind
   Labs"}` as genuinely distinct fields, and `employerName` on that employer's jobs is
   `"Northwind Labs"`, never the person's name.
7. `python manage.py makemigrations --check --dry-run` → `No changes detected`.
   `manage.py check` → `System check identified no issues (0 silenced)`.
8. `docs/BACKEND.md` (this document) rewritten at implementation time to status
   `Implemented`, describing the schema, the API, the relevance definition, the
   status-code table, and testing guidelines as actually built **[BRIEF deliverable]**.
   §9's integration contract is unchanged from the approved plan — both incompatibilities
   it flagged were confirmed exactly as written during implementation.
9. No secret, credential, or `.env` committed. `git log --all` and the final `git status`
   were checked (§16). `.env.example` carries only placeholder values, already in place
   before this phase's code was written.

Nothing here is unverified.

---

## 12. Approved decisions (2026-09-15)

1. **Backend lives at `backend/`**; the Next.js app stays at the repository root. No
   frontend files move.
2. **Django session-cookie authentication** (DRF `SessionAuthentication`, CSRF enforced,
   `django-cors-headers` with credentials). No JWT, no DRF tokens.
3. **Minimal dev Compose (`db` + `backend`)** is the run and test environment, because
   the host cannot run Django 5.1 and has no PostgreSQL. Full containerisation stays in
   the Dockerisation phase.
4. **Backend only this phase.** The frontend keeps running on mock data; rewiring
   `src/lib/data/` is a separate, later increment (§9).
5. **The New/Reviewed application status and its badge are dropped** (§2). No
   status-update endpoint and no application-review feature is built in this phase. If
   application review is wanted later, it is designed and approved as its own increment,
   backend and UI together.

## 13. Design decisions recorded rather than escalated

Called out so they are visible rather than buried: UUID primary keys on `Job` and
`Application` (keeps the frontend's `id: string`); camelCase JSON via explicit `source=`
rather than a mapping layer or a dependency; choice values stored as the frontend's exact
wire strings; `requirements` as a Postgres `ArrayField`; `pytest`/`pytest-django` as the
test runner; one application per email per job; relevance as the weighted substring score
in §5; applications stay anonymous (no FK to `User`).

Added in revision: **403 not 401** for unauthenticated denials, taken from stock DRF
rather than overridden (§3); **404 not 403** for cross-employer access, from queryset
scoping, with `IsJobOwner` deleted (§3, §4); employer object routes moved to
`/api/employer/jobs/{id}/` so each view has one queryset (§4); `companyName` added to
signup and `employer` added to the user payload (§4).

## 14. Pending decisions

**None.** Both open items are resolved:

- The relevance definition — the brief's one explicitly open item — is defined in §5.
- The New/Reviewed application status was the last decision outstanding at approval. It is
  **dropped** (§2, §12.5): nothing in V1 can change the value, so every real application
  would read `New` permanently. No status-update endpoint is added.

New open questions found during implementation are recorded here rather than resolved
silently (CLAUDE.md §6).

---

## 15. Divergences from the approved plan

Recorded per CLAUDE.md §6. All are small, discovered during TDD exactly as the process is
meant to surface them — none change the approved architecture, API surface, or scope.

### 15.1 Group 0 and Group 1 were built together

The plan lists "harness" (group 0) before "accounts models" (group 1) with the status-code
pin as part of group 0. In practice `django.setup()` cannot complete at all while
`AUTH_USER_MODEL = "accounts.User"` points at a model that does not exist yet — Django
fails during admin autodiscovery before a single test can run. The `User` and `Employer`
models were therefore written immediately after the harness test was confirmed red, and
both groups' tests were run together as one red → green cycle. No test content changed;
only the implementation ordering was interleaved out of necessity.

### 15.2 Two model-layer bugs, found and fixed during group 1

- `UserManager.create_user()` originally called `full_clean()` before saving. Django's
  `full_clean()` performs its own uniqueness check and raises `ValidationError`, which
  pre-empted the database's own unique constraint — a duplicate email raised the wrong
  exception type at the model layer. Removed: validation belongs to the API layer
  (serializers, §6), and the manager now relies on the DB constraint, which raises
  `IntegrityError` as the model-level contract.
- Django's stock `normalize_email()` only lowercases the domain part of an address, not
  the local part — by design, since email local parts are technically case-sensitive.
  That does not satisfy this project's requirement of case-insensitive email uniqueness
  (§6), so `User.save()` now lowercases the email in full.

Both were caught by tests written before the implementation (`test_email_uniqueness_is_
enforced`, `test_email_is_normalised_case_insensitively`), exactly as TDD is meant to
work — not discovered later or worked around silently.

### 15.3 `CheckConstraint(check=...)` → `CheckConstraint(condition=...)`

Django 5.1 deprecates the `check` keyword on `CheckConstraint` in favour of `condition`
(a rename of the same argument, not a behaviour change). Switched during the group 3
refactor step; confirmed with `makemigrations --check` that no migration was generated,
since the underlying constraint is identical.

### 15.4 Group 7's `applicationCount` required pulling the `Application` model forward

The plan sequences "scoping" (group 7, including `/api/employer/jobs/` returning
"correct counts") before "applications model" (group 8) — but a correct count needs the
`Application` model to exist. The model (§2) was implemented when group 7's count test
needed it, exactly as it was already specified for group 8, and group 8's own tests
(written afterward) exercise the same model with no changes. As with 15.1, this is an
ordering necessity, not a change to what was built.

### 15.5 Manual verification: a stale CSRF token, not a scoping bug

During the live negative-path check (§11.5), the first attempt to `PATCH` employer A's
job as employer B returned **403** instead of the expected **404**. Investigation showed
the CSRF token had been captured *before* that employer's signup — Django rotates the
CSRF token on `login()` as a deliberate anti-fixation measure, so the pre-login token was
stale and failed CSRF validation before the request ever reached the view's queryset
scoping. Re-fetching a fresh token and retrying produced the correct **404**. Recorded
here because it is a real thing a real API client must handle (fetch CSRF once per
session, after establishing it, not before) — not a defect in the scoping logic, which
behaved exactly as designed once CSRF was satisfied.

### 15.6 CSRF endpoint and dev-database migration were not pre-specified, and are now covered

- `GET /api/auth/csrf/` is listed in the plan's §4 endpoint table but had no test in any
  numbered TDD group. Added a test for it during the coverage pass (§11.2) once coverage
  data showed the view's body was never executed by the suite.
- The dev `db` container starts with no schema; `python manage.py migrate` must be run
  against it once (pytest's own test database is separate and migrates itself
  automatically). This is standard Django/pytest-django behaviour, not a defect, but it
  was not written down anywhere — it now is, here and in the setup note below.

**Dev setup, for the record:** `docker compose up -d db && docker compose run --rm
backend python manage.py migrate` once, before `docker compose up backend` is expected to
serve real data.

---

## 16. Verification record

Run on 2026-09-15 against the implemented code, in the approved Compose environment.

### Automated

| Check | Result |
|---|---|
| `pytest` (full suite) | **117 passed, 0 failed** |
| `pytest --cov` (source only — see `.coveragerc`) | **98% (436 stmts, 8 missed)** |
| `makemigrations --check --dry-run` | `No changes detected` |
| `manage.py check` | `System check identified no issues (0 silenced)` |
| Docker image build | clean, `Django-5.1.15` installed |
| `git status` after final commit | clean; no `.env`, secret, or build artifact tracked |

Coverage by app: `accounts` 89–100% per file (uncovered lines are `create_superuser`,
never exercised by API tests since nothing calls it, and `__str__` methods used only for
admin/shell display) · `jobs` 98–100% · `applications` 94–100% · `config/settings.py`
100%. No file is below the 70% gate; most are at 100%.

Test breakdown (116 written across the numbered TDD groups, +1 added for the CSRF gap in
§15.6 = 117): accounts models 13, auth API 19, jobs models 9, jobs queries 14
(including the 5a relevance spike), jobs read API 12, jobs write API 10, jobs scoping 15,
applications models 7, applications API 18.

### Manual, against a live server (`docker compose up`)

All executed with `curl`, handling session cookies and CSRF tokens as a real client must.

1. **CSRF** — `GET /api/auth/csrf/` → 200, sets `csrftoken`.
2. **Employer signup** — `dana@northwind.test`, full name "Dana Okoro", company name
   "Northwind Labs" → 201, `name` ≠ `employer.name` in the same response.
3. **`GET /api/auth/me`** — 200, confirms the same distinct fields persist across a
   request, not just in the signup response.
4. **Post a job** — 201, `employerName: "Northwind Labs"`, `status: "Open"` by default
   even though the client never sent `status`.
5. **Public list** — the new job appears, `GET /api/jobs/` → 200.
6. **Seeker signup + apply** — `priya@example.com` signs up (201), applies to the job
   with no auth and no CSRF token (201, confirming submission is genuinely public).
7. **Employer reads the application** — `GET /api/employer/jobs/{id}/applications/` → 200,
   the submitted application present with full cover letter.
8. **Employer dashboard count** — `GET /api/employer/jobs/` → `applicationCount: 1`.
9. **Search** — `?search=backend` returns only the two jobs with "backend" in the title,
   out of three live jobs.
10. **Filter** — `?category=Design` and `?location=Berlin, Germany` each isolate exactly
    the one matching job.
11. **Sort — newest** (default) — three jobs returned most-recently-posted first.
12. **Sort — salary** — same three jobs returned strictly by descending `salaryMax`
    (260000 → 160000 → 85000), a different order than newest.
13. **Sort — relevance** — `?search=engineer&sort=relevance` ranks both "Engineer" jobs
    above the "Design" job, a third distinct ordering.
14. **Negative: anonymous create** — `POST /api/jobs/` with no auth → 403.
15. **Negative: seeker create** — same request authenticated as a seeker → 403.
16. **Negative: cross-employer PATCH** — employer B against employer A's job → 403 on the
    first attempt (stale pre-login CSRF token, §15.5), **404** once the token was fresh.
17. **Negative: cross-employer applications read** — employer B against employer A's
    job's applications → 404 directly.
18. **Negative: apply to a closed job** — employer closes the job (200), then an anonymous
    application to it → 400.
19. **Negative: duplicate application** — same email, same job, submitted twice → 400 on
    the second attempt.
20. **Negative: missing CSRF on an authenticated write** — `PATCH` with a valid session
    but no `X-CSRFToken` header → 403.
21. **No `401` observed** anywhere across all of the above, matching §3.
22. **Browsable API** — `GET /api/jobs/` with `Accept: text/html` → 200 (renders DRF's
    browsable API, covering the brief's Postman-equivalent expectation).
23. **Admin** — `GET /admin/login/` → 200.

Every item above was executed against a running container, not inferred from the test
suite. Full request/response bodies are in the session transcript; the table above
summarises outcomes.
