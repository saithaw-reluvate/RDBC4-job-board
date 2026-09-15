# Deployment — Design & Implementation Record

**Status:** `Implemented`
**Date:** 2026-09-15
**Phase:** Docker deployment setup, for a single AWS EC2 instance. Follows Frontend V1,
Backend + Database, Frontend ↔ Backend Integration, the post-integration fixes, and
Seeker Application History (all `Implemented`).
**Scope:** Containerise the completed app for production and verify the full stack
locally. **AWS resources are not touched by this phase** — no EC2 instance was created
or modified; "deployment" here means the Docker Compose stack that a future step runs
on one.

Per CLAUDE.md §6 this is a living document, written from the actual implementation and
its verification, not a pre-implementation plan.

---

## 1. Target architecture

```
Internet ──:80──▶ nginx ──▶ frontend:3000  (Next.js, standalone build)
                       └──▶ backend:8000   (Django, Gunicorn)
                                  │
                                  ▼
                                 db:5432   (PostgreSQL 16, named volume)
```

- **Only `nginx` publishes a host port** (`80`, the one place the task's requirement is
  enforced). `frontend`, `backend`, and `db` have **no published ports** — reachable only
  from other containers, over the Compose network, by service name.
- One public origin. The browser only ever talks to Nginx; `frontend` and `backend` are
  never addressed directly from outside the Docker network. This is the "behind one
  origin on EC2" architecture `docs/BACKEND.md` §3 already anticipated when session
  auth was designed — CORS becomes unnecessary for the browser, since every request the
  browser makes is same-origin.
- `docker-compose.prod.yml` is a **new, separate file** from the existing
  `docker-compose.yml`. The existing file is the dev/test environment from the Backend
  phase (bind-mounted source, `runserver`, host ports for local tooling) and is
  **completely unchanged** — nothing about local development or `docker compose run
  --rm backend pytest` is affected by this phase. `docker-compose.prod.yml` reuses the
  same `db` service shape (image, env-driven credentials, healthcheck idiom) and the
  same `backend/Dockerfile` (unchanged — see §3), adding what production needs on top.

---

## 2. Reused from the existing setup

- `backend/Dockerfile` — **unchanged**. Still `python:3.12-slim`, still installs
  `requirements.txt` (which already included `gunicorn` from the Backend phase — no new
  Python dependency was needed for this phase at all), still `COPY . .`. Production
  behaviour (migrate, collectstatic, Gunicorn instead of `runserver`) comes entirely from
  `docker-compose.prod.yml` overriding `entrypoint`/`command` — the dev compose file
  never sets those, so it keeps using the image's default `CMD` (`manage.py runserver`)
  exactly as before.
- `docker-compose.yml`'s `db` service pattern (env-driven credentials via `${VAR:-default}`,
  a named volume, a `pg_isready` healthcheck) — copied into `docker-compose.prod.yml`,
  with weak dev defaults removed (§4).
- The relevance/search/sort API, session-cookie auth, CSRF handling, and every model and
  endpoint — entirely unchanged. This phase adds infrastructure around the existing
  application; it does not touch application code beyond the two settings/env additions
  in §5.

---

## 3. New files

| File | Purpose |
|---|---|
| `docker-compose.prod.yml` | The four-service production stack (§1). |
| `Dockerfile.frontend` | Multi-stage production image for the Next.js app (§4). |
| `backend/entrypoint.sh` | `migrate` + `collectstatic`, then hands off to Gunicorn — invoked only by the prod compose file (§2). |
| `nginx/default.conf` | The reverse-proxy server block (§4). |
| `nginx/proxy_params.conf` | Shared `proxy_set_header` lines, `include`d by every proxied location — the three location blocks would otherwise repeat them verbatim. |
| `.dockerignore` | Keeps the frontend image's build context (the repo root) from including `backend/`, `.git`, and `node_modules`. |

`Dockerfile.frontend` lives at the repo root, not inside a `frontend/` subdirectory,
because the Next.js app itself lives at the repo root (`docs/BACKEND.md` §7) — there is
no frontend subdirectory to nest it in, and creating one purely to hold a Dockerfile
would be exactly the kind of unrelated restructuring this phase was told to avoid.

---

## 4. Key decisions

**Next.js: `output: "standalone"`** (`next.config.mjs`). The standard, Next.js-documented
way to produce a minimal self-contained production server — the final image ships
`.next/standalone` + `.next/static`, not the full `node_modules` tree. `Dockerfile.frontend`
is a three-stage build (deps → builder → runner) mirroring Next's own official Docker
example, including running the server as a non-root `nextjs` user.

**`NEXT_PUBLIC_API_BASE_URL=/api` in production — a relative path, not a host.** Since
Nginx puts the frontend and the API on one origin, the browser can call `/api/...`
relative to whatever page it's on. This means the **same frontend image works behind any
EC2 IP or domain with no rebuild** — the alternative (baking a specific host into the
image at build time) would need a new image per environment. Set as a fixed Docker build
arg in `docker-compose.prod.yml`, not read from `.env`, since it never needs to vary.

**Two different "API base URLs," because middleware runs server-side.**
`src/middleware.ts` (the `/employer` and `/applications` route guards) executes inside
the Next.js container, not the browser — a relative `/api` path means nothing to a
server-side `fetch`. It now reads `INTERNAL_API_BASE_URL` first (falling back to the
existing `NEXT_PUBLIC_API_BASE_URL` / localhost default, so **dev is completely
unaffected** — dev never sets this variable). In production it's
`http://backend:8000/api`, the direct container-to-container address, bypassing Nginx
entirely for this one server-to-server call.

**Static files: a shared named volume, served by Nginx directly — no Whitenoise, no new
Python dependency.** `collectstatic` (run by `entrypoint.sh`) writes into `STATIC_ROOT`
(`backend/config/settings.py`, newly set — this app had no static-serving story before,
since dev's `runserver` serves app static files itself and nothing in the app used
`collectstatic`), a volume also mounted read-only into the `nginx` container. Chosen over
adding Whitenoise because it needs no new dependency and is the more idiomatic use of the
reverse proxy this phase already introduces. Admin CSS/JS and the DRF browsable API's
styling — both genuinely used for manual verification per `docs/BACKEND.md` §11 — are
served this way; without it they would still function, just unstyled.

**`DJANGO_DEBUG` is fixed to `"False"` in `docker-compose.prod.yml`, not read from
`.env`.** A misconfigured or copy-pasted dev `.env` can then never leave debug mode on in
production — Django's own documentation calls running with `DEBUG=True` in production a
serious security issue (stack traces, settings values). Every other backend variable
(`DJANGO_SECRET_KEY`, `DJANGO_ALLOWED_HOSTS`, the three `POSTGRES_*`) is **required** —
`${VAR:?message}` — so the stack refuses to start with a missing secret rather than
silently falling back to a dev-only default the way `docker-compose.yml` does. `db` has
**no published port** in production (dev exposes one, for local `psql`/tooling
convenience) — nothing outside this stack needs to reach it directly.

**`DJANGO_ALLOWED_HOSTS` always includes `backend`, appended automatically, in addition
to whatever public host/IP is configured.** Found during verification (§7): the
middleware's internal call to `http://backend:8000/api/auth/me/` carries `Host: backend`,
which is not the public hostname a real visitor uses — without this, Django's own
`ALLOWED_HOSTS` protection correctly rejected that internal call with `400`, which broke
the `/employer` and `/applications` guards for every real, valid session. `backend` is
never reachable from outside the Compose network (no published port), so this doesn't
weaken the protection `ALLOWED_HOSTS` exists for.

**`CORS_ALLOWED_ORIGINS` is normally empty in production.** Same-origin requests need no
CORS headers at all; the variable stays available (unchanged code path) for a future
setup that isn't single-origin, but nothing in this phase requires it to be set.

**Healthchecks use `127.0.0.1`, not `localhost`.** Found during verification (§7): the
Alpine-based frontend image resolves `localhost` to the IPv6 loopback first, which
nothing listens on (Node binds the IPv4 `0.0.0.0` per `HOSTNAME=0.0.0.0`) — the
healthcheck failed even though the server was running correctly. Both the frontend
(`wget`) and backend (`python -c "urllib.request..."`) healthchecks use the explicit IPv4
loopback for consistency, even though only the frontend one was actually broken.

**`nginx`'s host port is `${NGINX_PORT:-80}`, not a bare `80`.** Satisfies the stated
requirement by default; the override exists only so local verification isn't blocked by
an unrelated service already holding port 80 on a given machine (exactly what happened
during this phase's own verification, §7) — the deployed default is unaffected.

**The production compose file is named explicitly** (`name: jobboard-prod`). Found during
verification (§7): without an explicit name, Compose derives the project name from the
directory, which `docker-compose.yml` also does — the two files would then share one
project namespace and one set of service names, and Compose can reuse a stale container
from the *other* file instead of creating the one the current file actually describes.
Naming the production project explicitly makes the two stacks fully independent.

---

## 5. Application-code changes

Two settings additions, both server/build-config only — no model, endpoint, or UI change.

- `backend/config/settings.py`: `STATIC_ROOT = BASE_DIR / "staticfiles"` (§4).
- `src/middleware.ts`: reads `INTERNAL_API_BASE_URL` before `NEXT_PUBLIC_API_BASE_URL`
  (§4). The redirect rules themselves (`docs/FRONTEND.md` §20, §22) are unchanged.

---

## 6. Explicitly out of scope (per the approved instruction)

HTTPS/TLS, Kubernetes, RDS (managed Postgres), CI/CD, and any other new feature. Plain
HTTP only — no `SECURE_SSL_REDIRECT`, no HSTS, nothing that would break a plain-HTTP EC2
deployment was added to Django's settings. Multi-instance scaling, a CDN, log
aggregation, and AWS resource provisioning itself (creating the EC2 instance, security
groups, DNS) are not part of this phase either — they are the next step after this stack
is handed over.

---

## 7. Verification

All performed locally, against the actual `docker-compose.prod.yml` stack — nothing
claimed from reading the config alone (CLAUDE.md §11).

### Build

`docker compose -f docker-compose.prod.yml build` — both custom images (`backend`,
`frontend`) built successfully. `npm run build` inside the frontend build stage produced
the standalone output (`tsc`/`next lint` clean beforehand, confirmed separately on the
host).

### Three real bugs found and fixed during verification (not assumed away)

1. **Compose project-name collision** — the first `up -d` silently reused a stale
   container from `docker-compose.yml`'s project namespace instead of creating the one
   `docker-compose.prod.yml` described (wrong command, wrong ports). Fixed with an
   explicit `name:` (§4). Confirmed fixed: the resolved container names became
   `jobboard-prod-*`, correctly matching the new file, with no ports published except
   Nginx's.
2. **Frontend healthcheck failing while the server was actually healthy** —
   `wget --spider http://localhost:3000/` returned "connection refused" from *inside* the
   container even though `ss -tlnp` showed Node correctly listening on `0.0.0.0:3000`.
   Traced to Alpine resolving `localhost` to `::1` first. Fixed by using `127.0.0.1`
   explicitly (§4). Confirmed fixed: `wget --spider -q http://127.0.0.1:3000/` exits `0`,
   and the container reports `healthy`.
3. **`/employer` and `/applications` incorrectly redirecting a genuinely valid,
   logged-in session** — reproduced live: an authenticated employer hit `/employer`
   through Nginx and was bounced to `/login`, even though `GET /api/auth/me/` (through
   Nginx, same session) correctly returned `200` with the right role. Isolated to the
   middleware's *internal* call: `docker compose exec frontend wget
   http://backend:8000/api/auth/me/` returned `400 Bad Request` — Django's own
   `ALLOWED_HOSTS` rejecting the `Host: backend` header, since only the public host/IP
   was listed. Fixed by appending `backend` to `DJANGO_ALLOWED_HOSTS` (§4). Confirmed
   fixed: the same internal request now returns `403` (the correct, documented response
   for an anonymous request — see `docs/BACKEND.md` §3), and the live employer session
   then reached `/employer` with no redirect.

### Runtime

- `docker compose -f docker-compose.prod.yml ps` — all four services `healthy`/`running`;
  **only `nginx` shows a published port**; `backend`, `frontend`, and `db` show none.
- No errors in any of the four services' logs across the entire verification session.
- **Static files:** `collectstatic` populated the shared volume (`ls` inside `backend`
  confirmed admin CSS present); `GET /static/admin/css/base.css` through Nginx → `200`.
- **Persistent storage:** posted a real job, `docker compose -f docker-compose.prod.yml
  stop db && start db` (full container stop/start, volume retained), confirmed the job
  was still present afterward via the public API.

### Application flows, all through Nginx on the public port (no direct container access)

- `GET /`, `/login`, `/admin/login/`, `/api/jobs/` — all `200`.
- **Route guards**, all six combinations: anonymous → `/employer` and → `/applications`
  both redirect to `/login`; seeker → `/employer` redirects to `/`; employer →
  `/applications` redirects to `/`; employer → `/employer` and seeker → `/applications`
  both load (`200`, no redirect).
- **Employer signup** (with a company name distinct from the personal name) → **post a
  job** → appears in the **public list** → confirmed **search**, **category filter**,
  and **sort by salary** each return the expected result through Nginx.
- **Seeker signup** → **applies** to the job → the application appears in the seeker's
  own **`/api/seeker/applications/` history**, with the live job status nested in it.
- **Employer reviews** the application via the employer-scoped endpoint;
  **`applicationCount`** on the employer's job list reflects it.
- **Employer cannot apply** (`403`, `"Employer accounts cannot submit job
  applications."`); **anonymous can still apply** (`201`) to the same job.
- **Close a job** → applying to it returns `400`; **reopen** → `200`.
- **Duplicate application** (same email, same job) → `400`.
- **Delete a job** → `204`, then `404` on that job's own detail endpoint.
- **Logout** → `200`, and the session is verifiably gone (`GET /api/auth/me/` → `403`
  afterward).

Nothing in this list was assumed from the code — every item above is an actual response
observed through the running stack during this phase.

### Not verified

HTTPS is out of scope (§6), so it was not tested. Real AWS EC2 deployment (security
groups, DNS, the actual public IP) was not performed — this phase verifies the Compose
stack locally; deploying it to a real instance is the next, separate step and was not
part of this task's instruction.

---

## 8. Pending decisions

None for this phase. `NGINX_PORT`'s default (`80`) satisfies the stated requirement
exactly; the override exists solely for local verification convenience (§4) and needs no
further decision. Everything in §6 remains explicitly deferred, not decided here.
