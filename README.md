# NorthwindJobs — Job Board

A minimal job board where employers post jobs and job seekers search for and apply to
them. Built with Next.js 14, Django 5.1, and PostgreSQL, containerised with Docker
Compose for both local development and production.

## Features

**Job seekers** (no account required to browse or apply)
- Browse and search jobs by title, category, and location
- Sort by date posted, relevance, or salary
- View full job details and submit an application (name, email, cover letter)
- Create an account to view a history of submitted applications

**Employers** (account required)
- Sign up with a company name, separate from the account holder's personal name
- Post jobs (title, description, location, requirements, category, salary, status)
- View applications submitted to their own jobs
- Close/reopen or delete a job
- Employer accounts can browse jobs but cannot submit applications

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend | Django 5.1, Django REST Framework, Gunicorn |
| Database | PostgreSQL 16 |
| Auth | Django session-cookie authentication (httpOnly cookie + CSRF) |
| Testing | pytest / pytest-django, with coverage.py |
| Deployment | Docker Compose, Nginx reverse proxy |

## Architecture

**Development** — the frontend runs directly on the host (`npm run dev`); PostgreSQL and
Django run in containers, since the host cannot run Django 5.1 or PostgreSQL natively.

```
npm run dev (host, :3000) ──┐
                             ├──▶ Django + DRF (:8000, container) ──▶ PostgreSQL (container)
Browser ─────────────────────┘
```

**Production** — everything runs in containers behind a single reverse proxy. Only Nginx
is publicly exposed; the frontend, backend, and database are reachable only from other
containers, over the internal Docker network.

```
Internet ──:80──▶ nginx ──▶ frontend (Next.js, standalone build)
                       └──▶ backend (Django, Gunicorn)
                                  │
                                  ▼
                                 db (PostgreSQL 16, persistent volume)
```

Full design and decisions: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Local development setup

Requires Docker and Node.js (the frontend runs on the host; the host's Node/npm version
does not need to match production — see `Dockerfile.frontend` for the pinned image).

```bash
# 1. Configure environment
cp .env.example .env
# edit .env if you want non-default values; the defaults work as-is for local dev

# 2. Start PostgreSQL and the Django backend
docker compose up -d db backend

# 3. First run only: apply migrations
docker compose exec backend python manage.py migrate

# 4. Install frontend dependencies and start the dev server
npm install
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api/
- Django admin: http://localhost:8000/admin/ (create an account with
  `docker compose exec backend python manage.py createsuperuser`)

### Running the backend test suite

```bash
docker compose run --rm backend pytest --cov
```

Tests run against a real PostgreSQL instance (never SQLite), per the project's testing
policy.

## Backend testing

TDD throughout: failing test → implementation → refactor. Current results, run against
this codebase:

```
134 passed
Coverage: 98% (468 statements, 8 missed)
```

Required: ≥70% coverage, 100% of tests passing. Both are exceeded. Re-run the command
above at any time to reproduce these numbers — nothing here is estimated.

## API overview

Base path `/api`. All request/response bodies are camelCase JSON.

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/auth/signup/` | Create an account (seeker or employer) |
| `POST` | `/api/auth/login/` | Start a session |
| `POST` | `/api/auth/logout/` | End a session |
| `GET` | `/api/auth/me/` | Current signed-in user |
| `GET` | `/api/jobs/` | Browse jobs — supports `search`, `category`, `location`, `sort` |
| `POST` | `/api/jobs/` | Post a job (employer only) |
| `GET` | `/api/jobs/{id}/` | Job detail |
| `POST` | `/api/jobs/{id}/applications/` | Submit an application (not employers) |
| `GET` | `/api/employer/jobs/` | The signed-in employer's own jobs |
| `PATCH` / `DELETE` | `/api/employer/jobs/{id}/` | Close/reopen or delete an own job |
| `GET` | `/api/employer/jobs/{id}/applications/` | Applications for an own job |
| `GET` | `/api/seeker/applications/` | The signed-in seeker's own application history |

Full endpoint reference, request/response shapes, and status-code conventions:
[`docs/BACKEND.md`](docs/BACKEND.md).

## Production deployment

A separate Compose file builds and runs the full production stack — Nginx, a
standalone Next.js build, Django under Gunicorn, and PostgreSQL — with only Nginx
publicly exposed:

```bash
cp .env.example .env
# fill in real values for POSTGRES_*, DJANGO_SECRET_KEY, and DJANGO_ALLOWED_HOSTS
# (the stack refuses to start if any of these are left unset)

docker compose -f docker-compose.prod.yml up -d --build
```

The app is then served on port 80. Full architecture, every configuration decision, and
the local verification record: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Project structure

```
backend/
  accounts/       User, Employer models; auth views; role permissions
  jobs/           Job model; search/filter/sort; job endpoints
  applications/   Application model; submission and review endpoints
  config/         Django settings, URL root, WSGI/ASGI entrypoints
  entrypoint.sh   Production entrypoint (migrate, collectstatic, then Gunicorn)

src/
  app/            Next.js routes (App Router)
  components/     UI, layout, and feature components
  lib/data/       The only modules that call the API — one fetch wrapper (client.ts)
                  plus domain-named functions (jobs.ts, applications.ts, auth.ts)
  types/          Frontend domain types
  middleware.ts   Route guards for /employer and /applications

nginx/            Production reverse-proxy configuration
docker-compose.yml        Development stack (PostgreSQL + Django; frontend runs on host)
docker-compose.prod.yml   Production stack (Nginx + frontend + backend + PostgreSQL)
docs/                     Design and implementation records (see below)
```

## Documentation

| Doc | Covers |
|---|---|
| [`docs/BACKEND.md`](docs/BACKEND.md) | Models, API reference, auth, search/sort logic, testing |
| [`docs/FRONTEND.md`](docs/FRONTEND.md) | Pages, components, data layer, integration with the API |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Production architecture, configuration decisions, verification |
| [`CLAUDE.md`](CLAUDE.md) | Project requirements baseline and working conventions |
