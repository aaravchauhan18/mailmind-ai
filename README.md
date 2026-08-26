# MailMind AI

Full-stack email copilot based on the supplied specification.

- `backend/` — Java 21, Spring Boot, PostgreSQL, Flyway, OAuth configuration, AI-ready API.
- `frontend/` — React/Vite dashboard with digest, priority inbox, task completion, search, and reply generation.
- `doc/` — source requirements document.

## Run locally

Copy `.env.example` to `.env` and replace all placeholders before starting the app. It contains every runtime setting used by MailMind. `.env` is ignored by Git and is also loaded by Spring Boot for local runs.

Start PostgreSQL: `docker compose up -d postgres`. MailMind publishes it at host port `5433` (container port `5432`) to avoid colliding with a local PostgreSQL installation.

Backend: `cd backend; mvn spring-boot:run`.

Frontend: `cd frontend; npm install; npm run dev`.

For deployment, add the same names from `.env.example` to your hosting provider's environment-variable settings. Never commit credentials.

`VITE_API_BASE_URL` and `VITE_BACKEND_URL` are frontend build-time settings. Leave `VITE_API_BASE_URL` empty for local Vite development; set both to the public backend HTTPS URL when building the production frontend.
