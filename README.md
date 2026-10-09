# Peta Belajar

Monorepo pnpm workspaces.

- `apps/web` — Next.js App Router + TypeScript + Tailwind CSS + shadcn/ui + Lucide React
- `apps/api` — Express + TypeScript + Drizzle ORM + better-sqlite3
- `packages/shared` — Zod schemas & shared types (kontrak AI, status kompetensi)

## Quickstart

```bash
pnpm install
cp .env.example apps/api/.env
pnpm db:migrate && pnpm db:seed
pnpm dev:api   # http://localhost:4000
pnpm dev:web   # http://localhost:3000
```

Demo judge account: seeded via `pnpm db:seed` (see `apps/api/src/seed.ts`).
