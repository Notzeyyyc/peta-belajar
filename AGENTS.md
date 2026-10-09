# AGENTS.md — Peta Belajar

## Project

Peta Belajar is an Indonesian learning-map web app for SD students. A student writes one learning goal, answers 2–3 short AI clarification questions, receives a competency-gap roadmap, and completes guided material without receiving instant answers.

## Product principles

- Guide thinking; do not become a homework-answer chatbot.
- One clear next action per screen.
- Use simple Indonesian with “kamu”; avoid dense technical language.
- Red/yellow/green are reserved for roadmap status: gap, setengah, kuasai.
- Status must never rely on color alone: include text and/or an icon.
- Every generated roadmap must be explainable and editable by the user.
- Never invent progress, resources, user data, or claims.

## Required stack

- Next.js App Router + TypeScript
- Tailwind CSS + shadcn/ui
- Express backend in TypeScript
- SQLite with Drizzle ORM and better-sqlite3 for the initial VPS deployment
- OpenAI SDK through a server-only backend adapter
- Zod for request/response and model-output validation
- Lucide React for functional icons

## Architecture rules

- Keep OpenAI credentials server-side; never expose them to the browser.
- Browser → Express API → OpenAI SDK. The browser must not call the model provider directly.
- Validate every request at the API boundary with Zod.
- Validate and constrain every model response before persisting or rendering it.
- Use an allowlisted resource catalog; AI may recommend catalog IDs but may not invent URLs.
- Use stable IDs, timestamps, and explicit status values in the database.
- Keep the Next.js frontend and Express backend independently startable.
- Prefer simple REST endpoints over a second abstraction layer.

## UI rules

- Follow `/root/DESIGN.md` as the visual source of truth.
- Use Lucide icons instead of Unicode symbols for interface icons.
- Preserve the mint app frame, dark canvas, flat surfaces, and semantic roadmap colors.
- Touch targets must be at least 44px in production.
- Support keyboard focus, reduced motion, loading, empty, error, and offline/API-failure states.
- Do not add gradients, shadows, glassmorphism, generic dashboard stat grids, or decorative AI sparkle without a documented purpose.

## Core flows

1. Landing → demo entry or login/register.
2. Login/register → home.
3. Home → new goal → AI clarification.
4. AI clarification → validated roadmap generation → roadmap menu.
5. Roadmap menu → roadmap material → completion update.
6. Profile → saved maps, cumulative gaps, and learning preferences.

## Suggested API surface

- `POST /api/auth/demo`
- `POST /api/auth/magic-link/request`
- `GET /api/me`
- `GET /api/roadmaps`
- `POST /api/roadmaps/clarify`
- `POST /api/roadmaps/generate`
- `GET /api/roadmaps/:id`
- `POST /api/roadmaps/:id/steps/:stepId/complete`
- `GET /api/resources`

## Testing and verification

- Unit-test roadmap validation, status transitions, auth/session helpers, and API error mapping.
- Test the primary demo path with a seeded demo account.
- Test model failure, malformed model output, rate limiting, empty roadmap, and duplicate completion.
- Run typecheck, lint, unit tests, and production build before claiming completion.
- Verify the live demo at desktop and mobile widths and check browser console errors.

## Security and privacy

- Store only the minimum student data needed for the demo.
- Do not send unnecessary personal data to the model provider.
- Rate-limit AI generation and cap input/output lengths.
- Redact model/API secrets and personal data from logs.
- Add consent/guardian considerations before production use with children.
