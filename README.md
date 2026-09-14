# Manoa Menu [![ci-badge](https://github.com/manoa-menu/manoa-menu/actions/workflows/ci.yml/badge.svg)](https://github.com/manoa-menu/manoa-menu/actions/workflows/ci.yml)

A multilingual dining menu viewer for the University of Hawaii at Manoa campus. Browse daily and weekly menus for the Campus Center Food Court with support for English, Japanese, Korean, and Chinese.

## Overview

Manoa Menu fetches and displays the weekly Campus Center Food Court menu, sourced from a PDF and parsed by OpenAI. Menus are cached in a PostgreSQL database and served via Next.js API routes. Non-English translations are generated on demand using OpenAI and also cached per language.

## Features

- **Live open/closed status** for Campus Center, computed in Hawaii Standard Time
- **Multilingual menus** — English, Japanese, Korean, and Chinese
- **Per-user language preference** stored in the database
- **Responsive layout** — tabbed day-picker on mobile, grid view on desktop

## How It Works

### Campus Center Menu Pipeline

1. On request, the server checks the database for a cached English menu for the current week.
2. If none exists, [src/lib/scrapeCCUrl.ts](src/lib/scrapeCCUrl.ts) uses JSDOM to scrape the Campus Center page and locate the current week's PDF link by parsing anchor text date ranges (e.g., "Menu 03 Mar to 09 Mar").
3. The PDF is downloaded and its text extracted with `pdf-parse`, then sent to **OpenAI** (`gpt-4o-mini`) with a structured JSON schema prompt to extract `plateLunch` and `grabAndGo` arrays for Mon–Fri.
4. For non-English languages, the English menu is passed back to OpenAI with culturally-aware translation rules and strict JSON schema enforcement. Results are additionally post-processed with manual correction overrides in [src/lib/manualTranslate.ts](src/lib/manualTranslate.ts).

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router), React 19, TypeScript 5 |
| UI | MUI v6 (Material UI), React-Bootstrap 2, Bootstrap 5 |
| Database | PostgreSQL via Prisma 5 |
| AI | OpenAI SDK (`gpt-5-mini`) for menu parsing and translation |
| Scraping | JSDOM (HTML), `pdf-parse` (PDF text extraction) |
| HTTP | Axios |
| Testing | Playwright (E2E) |
| Linting | ESLint 9, Prettier |

## Database Models

| Model | Purpose |
|---|---|
| `CampusCenterMenus` | Cached weekly CC menus keyed by `week_of` date and language |
| `FoodTable` | Menu item registry with category labels and translations |
| `AIStatus` | Tracks background AI translation job status |

## API Routes

| Route | Method | Description |
|---|---|---|
| `/api/cc-menu` | GET | Weekly Campus Center menu; accepts `?language=` |
| `/api/cc-hours` | GET | Campus Center open/closed status (HST time logic) |

## Menu reliability

- Campus Center discovery accepts named months, shared-month ranges (`September 7–11`), numeric and ISO dates, ordinals, explicit years, several range separators, accessible link labels, embedded metadata, and dated PDF filenames. Impossible dates and out-of-week menus are rejected.
- Source downloads have timeouts and limited retries for temporary failures. Dining API requests continue through configured backups and live page discovery after errors, empty menus, or invalid payloads. Discovery preserves the API host, version, and query parameters.
- Menu responses are validated before caching or rendering. Damaged cache entries can be replaced, and cache failures do not discard freshly fetched English menus. Concurrent English requests share work within each server process.
- A failed dining day is reported separately from an empty menu. Other days remain available. Translation failures can fall back to English with a visible notice; fallback English is not saved as a translation.
- The page cancels superseded requests, offers a retry button, and displays Campus Center menus even when only one food section is available.

Run `npm test` for parser, API validation, retry, timeout, and recovery regression tests. Run `npx playwright test tests/menu-recovery.spec.ts --project=chromium` for desktop/mobile recovery checks; Playwright starts the local server when necessary. Both suites run in CI. Browser tests mock external services and do not require paid AI calls.

External providers can still remove menus or change their contracts. When no valid current menu can be recovered, the app reports that it is unavailable instead of substituting an older week's food.

