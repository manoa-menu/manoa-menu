# AGENTS.md

## Cursor Cloud specific instructions

Manoa Menu is a single Next.js 16 (App Router) + Prisma 5 + PostgreSQL app. Standard scripts live in `package.json` (`dev`, `lint`, `test`, `build`) and CI is `.github/workflows/ci.yml` (lint + unit tests only). The notes below cover non-obvious setup/run caveats for this environment.

### Services
- **Next.js dev server** — `npm run dev` on http://localhost:3000. This is the whole product (UI + API routes).
- **PostgreSQL** — required by Prisma for the app to run. Not required for `npm run lint` or `npm test`.

### Environment
- `.env` (gitignored) must exist with at least: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, and `OPENAI_API_KEY`. In this environment `DATABASE_URL` points at the local Postgres `manoa_menu` DB.
- **`OPENAI_API_KEY` must be set even just to load the menu API.** `src/app/utils/api/openai.ts` instantiates the OpenAI client at module load, so `/api/cc-menu` throws 500 on import if the var is missing — even for the cached English path, which never actually calls OpenAI. A placeholder value is enough to serve cached menus; a **real** key is only needed for live PDF parsing and translations.
- `GW_API_URL` / `HA_API_URL` / `MMR_API_KEY` are optional and only power the Gateway / Hale Aloha (Sodexo) menus via `/api/sdx-menu`.

### PostgreSQL notes
- Start the server on a fresh boot: `sudo pg_ctlcluster 16 main start` (the service is not auto-enabled). Local superuser is `postgres` / password `postgres`, database `manoa_menu`.
- **Do not use `prisma migrate deploy` / `migrate dev`.** The committed migration history is broken: both `20241203051933_original_user` and `20241207063142_m3` add the `FoodTable.likes` column, so migrations fail on a fresh DB with `column "likes" already exists`. Use `npx prisma db push` to sync the schema instead, then `npx prisma db seed` for default users.
- Seeded accounts (password `changeme`): `admin@foo.com` (ADMIN), `john@foo.com` (USER).

### Running / testing gotchas
- Env var changes require restarting `npm run dev` (Next.js loads `.env` at startup).
- The menu (`/api/cc-menu?language=English`) serves from the `CampusCenterMenus` DB cache when a row exists for the current `week_of` (see `getCurrentWeekOf`); otherwise it scrapes the live UH Sodexo site and calls OpenAI. To demo the UI without network/OpenAI, insert a `CampusCenterMenus` English row for the current week.
- NextAuth is configured with a custom `pages.signIn` of `/auth/signin`, but that page is not implemented (returns 404). The NextAuth API routes under `/api/auth/*` do work.
- Unit tests (`npm test`, `tsx --test src/lib/**/*.test.ts`) are pure logic and need no DB or network. E2E (`npx playwright test`) auto-starts the dev server via `playwright.config.ts` and requires Playwright browsers installed.
