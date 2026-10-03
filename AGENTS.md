<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Code Undercover — agent brief

Gamified C-programming course. Users ("agents") clear 60 detective-themed missions in order (TEACHING → MCQ → CODING phases), earn aura, keep combo streaks, and answer one daily challenge. Prod: https://code-undercover.onrender.com (Render, Docker `output: "standalone"`, health check `/api/ping`). Repo: `code-undercover/code-undercover-01`, branch `main`.

## Stack
- Next.js 16 App Router + React 19, Turbopack dev on :3000. `middleware.ts` still uses the pre-16 name (Next 16 calls it Proxy) — read `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md` before touching it.
- Auth: NextAuth v4, JWT sessions, Credentials + optional Google (`lib/auth.ts`). Route gating and the intro redirect live in `middleware.ts`. Supabase Auth is not used; `app/auth/callback` is unlinked.
- DB: Prisma 5.22 → Supabase Postgres (`prisma/schema.prisma`). RLS is on for every table with no policies, so `DATABASE_URL` must be a direct connection, never the pooler — the pooler silently returns zero rows.
- Code execution: self-hosted Judge0 from `docker compose up` (bound to 127.0.0.1:2358), client in `lib/compiler.ts`. With `npm run dev` outside compose, use `JUDGE0_API_URL=http://localhost:2358`.
- Optional: Upstash Redis (`lib/rate-limit.ts`, `lib/cache.ts` fall back in-process), Resend (`lib/email.ts`).

## Where things live
- `app/api/**/route.ts` — every server endpoint. Scoring: `app/api/missions/validate/route.ts`. Daily challenge: `app/api/daily-challenge/route.ts`.
- `services/mission.service.ts` — unlock order; upserts missions from `src/data/missionsData.ts` once per process.
- `src/data/*.server.ts` — answers and expected outputs. Server-only: never import from a client component.
- `src/data/missionsData.ts` also holds answers (each mission's `validationRules` and MCQ `correctIndex`), so it is server-only too. Client code gets briefing copy from `src/data/missionDetails.ts`. `src/data/answerKey.test.ts` fails if `components/`, `hooks/` or a `"use client"` file imports either.
- `lib/` — auth, compiler, rate limits, aura math, validation; tests sit beside code as `*.test.ts` (node) / `*.test.tsx` (jsdom).
- `components/` — UI by feature, CSS Modules + Tailwind. Design rules: `design-system/code-undercover/MASTER.md`.
- Ignore: `MyProject/` (unrelated C sandbox), `.kilo/worktrees/`, `.omo/`, `.playwright-mcp/`, `thoughts/`, `tmp/`, `undefined/`.

## Commands
`npm run dev` · `npm test` · `npm run lint` · `npx tsc --noEmit` · `npm run build`

CI (`.github/workflows/ci.yml`, Node 22) runs prisma generate → tsc → lint → test → build. Run tsc, lint and test before calling work done. `scripts/` is type-checked but not linted — a stale import there has blocked deploys before.

Change code through local git: edit, verify, commit, `git push`. Never write to `main` with the GitHub MCP file tools (`create_or_update_file`, `push_files`). Doing that left local `main` 7 commits behind origin, with stale copies of the same files mixed into the working tree. Every push to `main` deploys production on Render, so ask before pushing. If you have no shell to run the checks, stop and say so. Do not push unverified code.

## Invariants — do not weaken
- `lib/env-validation.ts` fails boot only for `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`/`AUTH_SECRET`. Any other missing integration degrades its own feature and must never 500 the site (this regressed twice).
- Keep `process.env["NEXT_PHASE"]` bracket notation in `lib/auth.ts` and `lib/compiler.ts`, and never add `NEXT_PHASE` to `next.config.mjs` `env` — it got inlined and 500'd every route.
- Aura, badges and streaks are server-authoritative: settle them inside the Serializable transaction that claims completion (validate route) or behind the `(userId, dateKey)` unique (daily challenge). Never trust client-sent scores.
- Grading runs every authored test case on the server (`getGradingCases` → `gradeMissionRuns` in `lib/validation/missionValidator.ts`). Never grade on stdin the agent chose, never pass a mission with no grading key, and never echo a test case's expected output in feedback.
- No `allowDangerousEmailAccountLinking` — registered emails are unverified. For the same reason `/api/auth/register` returns 409 for any existing email and never sets a password on an existing row; only the emailed reset link may do that.
- Judge0 stays bound to loopback. CSP and security headers live in `next.config.mjs`.
- Never print or commit `.env` values or the tokens in `~/.config/kilo/kilo.jsonc`.

## MCP servers
Kilo: `kilo.json` (project) + `~/.config/kilo/kilo.jsonc` (global, holds tokens). Claude Code: `.mcp.json`.
- **next-devtools** — start `npm run dev` first; call `get_errors` / `get_routes` / `get_logs` before guessing at runtime bugs.
- **supabase** — the live production project. Read tools (`list_tables`, `get_logs`, `get_advisors`) freely; writes need approval. Schema changes go through `prisma/schema.prisma` + a migration, not ad-hoc SQL.
- **render** — production logs, deploys and metrics. Check here first when prod misbehaves.
- **github** — PRs, issues, Actions runs. Pushes and merges need approval.
- **context7** — third-party library docs (NextAuth v4, Prisma 5, framer-motion). For Next.js itself use the bundled docs above.
- **playwright** — drive `localhost:3000` to verify UI flows end to end.
