# CLAUDE.md — RBDC Exercise 4: Job Board

Working agreement for this repository. It carries two things: the **mandatory
requirements baseline** from the brief, and the **durable rules** for how work is done
here. Detailed, changeable designs live in `docs/`, never in this file.

## Using this file

- `RBDC_Ex_4.pdf` is the original brief. §1 below summarises its mandatory requirements
  so a session does not need to re-read the PDF for the baseline — but read the PDF when
  a detail matters or something here looks incomplete.
- **Precedence:** the brief > this file > approved docs in `docs/` > code.
- This file is amendable. If a rule stops fitting the project, propose the edit — do not
  silently work around it, and do not rewrite it without approval.
- Do not add product decisions to this file. They belong in `docs/`.

---

## 1. Requirements baseline (mandatory)

**Purpose:** the simplest job board where employers post jobs and job seekers search
and apply. Minimal, clean, modular, maintainable.

### Core workflows

**Job posting**
- Employers can create job posts.
- A job post carries **title, description, location, requirements, and status**.
- Job posts are persisted and retrievable by the frontend.

**Applications**
- Job seekers can submit an application to a job.
- An application carries **applicant name, email, and cover letter**.
- Applications are persisted and **associated with the relevant job post**.
- Employers can access/manage the applications for their jobs.

**Search, filter, sort**
- Job seekers can browse and search jobs.
- Filter/search by **title, category, and location**.
- Sort by **date posted, relevance, and salary**.
- This query logic lives in the **backend API**, not the client.

### Frontend baseline
- **Next.js 14**.
- Core responsibilities the brief names: **JobList** (display listings), **JobForm**
  (employer posts a job), **ApplicationForm** (seeker applies). These are required
  *capabilities*; their exact component decomposition is a design decision.
- **Frontend tests are not required at this stage.** Focus on clean, modular components.

### Backend baseline
- **Django 5.1**.
- Core domain concepts the brief names: **Job**, **Application**, **Employer**
  (employer name and contact information).
- Backend APIs must support all the workflows above.

### Database
- **PostgreSQL**. Job and application data is persistent.

### Testing and quality
- Backend follows **TDD**: failing test → implementation → refactor with tests green.
- Write tests for **models, views, and API endpoints**.
- **≥70% backend test coverage.**
- **100% of backend tests passing.**
- **SRP**, **DRY**, **separation of concerns** (business logic, UI, and data management
  independent), and modular design throughout.
- The brief demonstrates verifying backend APIs with Postman before relying on them.
  Treat manual API verification as expected; the specific tool is not mandated.

### Deployment and deliverables
- GitHub repository.
- **Dockerized** frontend, backend, and PostgreSQL.
- **Docker Compose** for running the services together.
- Documentation: **setup instructions**, **API documentation**, **testing guidelines**.
- **Live deployment on AWS EC2.**

### Illustrative only — do NOT treat as mandatory design

The brief includes sample code. It demonstrates intent; it is not the specification, and
in places it contradicts the brief's own requirements. Design properly instead of copying.

- **Sample SQL schema** — incomplete. It omits `requirements` and `status` (both
  mandated above), has no `category` or `salary` (both mandated for search/sort), and no
  employer relationship despite `Employer` being a required model. Column types, table
  names, and ID strategy are all open.
- **Sample Dockerfile** — uses `python:3.9-slim`, which **cannot run Django 5.1**
  (needs Python 3.10+). Base image, Python version, and server are design decisions.
- **Sample docker-compose.yml** — uses an obsolete `version:` key, `postgres:13`, hardcoded
  credentials, and inconsistent env vars. Service layout, images, volumes, and
  configuration are design decisions. Credentials come from the environment (§13).
- **Sample Django model test** — illustrates the TDD habit, not a required test style,
  framework, or runner.
- **Sample `POST /api/jobs` request** — illustrates a call shape. Endpoint paths,
  payloads, and response formats are not fixed by it.

### Open by design

The brief mandates sorting by **relevance** but never defines it. Treat this as a real
decision to make during backend planning, not something to improvise.

---

## 2. What stays flexible

The following are **not** decided by this file and must not be locked in here. Decide
them in the relevant planning phase and record them in `docs/`:

exact pages and routes · UI, layout, and design system · authentication and
authorisation approach · database schema and field types · API endpoint paths ·
request/response formats · folder structure · optional/extra features

The project may change after review of implemented work. Assume it will.

---

## 3. Planning and approval

Work proceeds **plan first, at the phase level** — not feature by feature.

- A **major phase or sufficiently large unit of work** requires an approved plan before
  implementation. (e.g. "Frontend V1", "Database design", "Backend API", "Dockerisation".)
- A plan states: goal, scope included, scope explicitly excluded, the module boundaries,
  how it will be verified, and the exit criteria. Keep it proportional.
- **Once a plan is approved, implement its full scope without stopping for per-feature
  or per-component approval.** Approving "Frontend V1" approves every component in it.
- Routine implementation decisions inside approved scope — naming, file splits, local
  structure, styling details, small refactors — are yours to make. Make them and move on.
- The approved plan is recorded in `docs/` (§6) and is the reference for what "the
  approved scope" means.

### Stop and ask when you hit

- A **significant new decision** not covered by the approved plan
- **Material ambiguity** where different readings produce materially different work
- A **scope change** — anything the approved plan does not cover
- A **conflict** with the approved plan, this file, or an existing design doc
- A **destructive action**: deleting/rewriting working code, history rewriting, dropping
  data, removing a doc
- An **architectural decision** not already approved — stack, major dependency, auth,
  schema shape, API surface, deployment or anything with a cost/external footprint

When stopping: give 2–4 concrete options with brief trade-offs, **recommend one**, and
wait. Don't survey exhaustively. Don't stop for things the approved plan already covers.

---

## 4. Iterative development

- Work in increments that leave the project in a working state.
- Expect direction to change between increments. After each, assume the next may add,
  remove, or replace what was just built.
- Build for the increment in front of you. Don't add structure for unagreed features.
- Reversibility beats completeness — prefer the choice that is cheap to undo.

---

## 5. Read before you change

Never rely on memory from an earlier session, or on what a plan said *should* exist.

**Before planning or implementing in a major area, read the current `docs/` file(s) for
that area.** For example:

| Work | Read first |
|---|---|
| Frontend | the current frontend design/planning doc |
| Backend | the current backend design/planning doc |
| Database | the relevant backend/database design doc |
| API / integration | the relevant frontend, backend, and API docs |
| Docker / deployment | the relevant deployment doc |

If a relevant design doc does not exist yet, **do not invent one silently and do not
pretend it exists** — say so; planning that area is what establishes it.

**Also inspect the actual current code before changing it:**

- Read the files being changed.
- Check what already exists before creating a new component, hook, util, type, or doc —
  reuse or extend rather than adding a parallel version.
- Check `package.json` / `requirements.txt` / lockfiles before importing a dependency.
  Never import something not installed; never assume a version.
- Run `git status` / `git diff` before committing or before building on a dirty tree.

---

## 6. Design docs in `docs/`

Design docs are **living documents**, not contracts. They may describe approved work
that is not yet built — provided the status is explicit.

Every design doc carries a status near the top:

- `Planning`
- `Plan approved — not yet implemented`
- `Implementation in progress`
- `Implemented`
- `Superseded` (say what replaced it)

Rules:

- **Update the status as the work moves.** An old plan must never read as though it
  describes the current implementation.
- When implementation completes, revise the doc so it describes **what was actually
  built**, including where the build diverged from the plan and why.
- Record open questions under a **Pending decisions** heading instead of resolving them
  silently or inventing specifics that haven't been decided.
- Document decisions at the level of detail they have actually been decided at.
- When a decision is superseded, update the doc and note what changed and why. Don't
  leave two conflicting versions in the repo.
- Never treat a written decision as immovable — but never change one without saying so.

---

## 7. Documentation tracks reality

- Docs about **implemented** things describe what the code actually does right now.
- Update the affected doc in the same change as the code, not in a later cleanup pass.
- If a doc marked `Implemented` disagrees with the code, **do not assume either one is
  correct.** Stop and resolve the discrepancy against the requirements (§1) and the
  approved design: determine which one reflects what was actually agreed, then fix the
  wrong side — the doc, the code, or both. Report the discrepancy and how it was
  resolved. If the requirements and approved design do not settle it, treat it as a
  decision point (§3) and ask.
- `README.md` must stay runnable: if setup steps change, the README changes.
- Anything in a doc that is planned but not built must be visibly marked as such (§6) —
  never presented as existing.

---

## 8. Code quality

- **SRP** — one module, one reason to change. Split when a file needs "and" to describe it.
- **DRY** — no copy-pasted logic. But duplication is cheaper than the wrong abstraction:
  two similar things is not a pattern; wait for the third.
- **Separation of concerns** — UI rendering, business/domain logic, and data access are
  separate layers. Components don't call the network directly; data modules hold no
  presentation logic.
- **Modularity** — clear boundaries, explicit inputs/outputs, small named units.
- Match the surrounding code's naming, structure, and comment density.
- Handle errors where they can be acted on; never swallow them silently.

## 9. No unnecessary over-engineering

This is a focused exercise. Build the simplest thing that meets the requirement.

Don't add, unless asked or approved: state-management libraries, caching layers,
queues/workers, background jobs, microservices, generic "framework" abstractions,
config for a single call site, premature optimisation, or a dependency replacing ~20
lines of clear code. Abstraction is earned by a second real use case, not anticipated.

---

## 10. Git

- **Never commit or push unless asked.**
- Branch for feature work; don't commit feature work straight to `main`.
- One commit = one logical change. Don't mix features, refactors, and formatting.
- Review `git diff --staged` before committing. Stage deliberately; never blanket-add a
  tree you haven't looked at.
- Clear, imperative messages that say *why*.
- **Never** run destructive or history-rewriting commands without explicit approval:
  `push --force`, `reset --hard`, `clean -fd`, discarding uncommitted work, `rebase` on
  shared branches, branch/tag deletion.
- Never commit build output, `node_modules`, virtualenvs, local databases, logs, media
  uploads, or `.env*`. Keep `.gitignore` current as the stack grows.

## 11. Verification before claiming completion

"Done" means verified, not written.

- Run it. Build it. Execute the tests. Call the endpoint. Load the page.
- Report honestly: failing tests are reported with their output; skipped or blocked
  steps are named; unverified work is called "not verified".
- Never claim something works from reading the code alone.
- Finish the agreed scope, and explicitly list anything left out and why.
- Type, lint, and build errors are failures — not "minor", not silently deferred.

## 12. Backend TDD (binding once backend work begins)

- Red → green → refactor. The **failing test comes first**; then implementation; then
  refactor with tests green.
- No backend code without tests. Don't write implementation first and retro-fit tests.
- Cover models, views/serializers, and API endpoints — success paths **and**
  error/validation/edge cases.
- **Gate: ≥70% coverage, 100% of tests passing.** Report the **actual number from the
  coverage tool**, never an estimate. Below the bar is not complete.
- **Never weaken, skip, `xfail`, or delete a test to make a suite pass.** A failing test
  is a finding — surface it.
- Run tests against PostgreSQL, not a substitute engine.
- Frontend tests are not required at this stage; don't add a frontend test stack without
  asking.

## 13. Secrets and environment

- **Never commit** secrets, credentials, API keys, tokens, or real `.env` files.
- `.env*` is git-ignored from the start, except a committed `.env.example` with
  placeholder values only.
- Environment-varying configuration comes from env vars — never hardcoded hosts, ports,
  URLs, passwords, or connection strings. This includes Docker and Compose files.
- Never print, log, or echo a secret's value — not in logs, errors, terminal output, or
  this conversation.
- Never send repository contents, env files, or credentials to an external service.
- If a secret is found committed, stop and report it immediately.

---

## 14. Current direction

Changeable. This section is revised as the project moves.

- **Frontend V1, Backend + Database, and Frontend ↔ Backend Integration are all
  implemented** (`docs/FRONTEND.md`, `docs/BACKEND.md`, both status `Implemented`). The
  frontend now runs against the real Django API — the mock layer (`src/lib/mock/`) has
  been deleted.
- The employer route guard is real (`src/middleware.ts`): anonymous → `/login`, seeker
  → `/`, employer → allowed.
- **Dockerisation (frontend container, production image, AWS EC2 deployment) is the next
  planned phase** — not started. The current dev/test environment is the minimal
  `docker-compose.yml` (db + backend only) from the Backend phase; the frontend still
  runs with `npm run dev` directly on the host.
- Any further product changes (new features, schema changes, API changes) go through
  planning and approval per §3, same as every prior phase.

Architecture, component decisions, data shapes, and implementation specifics belong in
the relevant doc under `docs/` — not here.
