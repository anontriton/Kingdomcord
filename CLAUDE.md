# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> Read PROJECT.md for full feature specs and architecture decisions before making any changes.

---

## Project Overview

Kingdomcord is a Discord application for churches with two bots:
- **KingdomBot** — Daily Bible verse posts, Kingdom Points gamification, seasonal rewards
- **Pastor Apollo** — LLM-powered Bible study assistant with voice transcription

TypeScript/Node.js monorepo deployed on Railway.

---

## Stack & Key Libraries

- **Language**: TypeScript (strict mode, no `any`)
- **Runtime**: Node.js 20 LTS
- **Discord**: discord.js v14 (slash commands, voice via `@discordjs/voice`)
- **Database**: PostgreSQL via Prisma ORM
- **LLM**: Anthropic Claude API (`@anthropic-ai/sdk`)
- **Transcription**: OpenAI Whisper API (`openai` SDK)
- **Bible data**: Scripture API — `https://api.scripture.api.bible/v1`
- **Scheduling**: `node-cron`
- **Cache**: Redis (`ioredis`)
- **Hosting**: Railway (Postgres and Redis as plugins)

---

## Commands

```bash
# Install deps (run from repo root)
npm install

# Dev (ts-node-dev hot reload)
npm run dev

# Production build — must build in dependency order
npm run build          # builds shared → db → bot via TypeScript project references

# Start production build
npm start

# DB: create a new migration during development
npm run db:migrate:dev -- --name <migration-name>

# DB: apply pending migrations (used by Railway on deploy)
npm run db:migrate

# DB: regenerate Prisma client after schema changes
npm run db:generate

# Run tests (Vitest)
npm test

# Run a single test file
npx vitest run packages/bot/src/services/points.service.test.ts
```

---

## Repo Structure

```
kingdomcord/
├── packages/
│   ├── bot/              # Main Discord bot (KingdomBot + Pastor Apollo)
│   │   └── src/
│   │       ├── commands/     # Slash command handlers
│   │       ├── events/       # Discord event handlers
│   │       ├── jobs/         # Scheduled tasks (daily verse, etc.)
│   │       ├── services/     # Business logic (points, rewards, apollo, etc.)
│   │       ├── voice/        # Voice + Whisper transcription pipeline
│   │       └── index.ts      # Entry point — Discord client bootstrap only
│   ├── db/               # Prisma schema, migrations, generated client
│   │   ├── prisma/schema.prisma
│   │   └── src/index.ts  # Singleton PrismaClient — import from here, not @prisma/client
│   └── shared/           # Cross-package TypeScript types (GuildConfig, Snowflake, etc.)
├── railway.toml          # Build + deploy config for Railway
└── tsconfig.json         # Base TS config extended by all packages
```

---

## Package Wiring

The three packages form a dependency chain: `shared` ← `db` ← `bot`.

- During **dev** (`ts-node-dev`), `packages/bot/tsconfig.json` uses `paths` to resolve `@kingdomcord/db` and `@kingdomcord/shared` directly to their `src/index.ts` — no build step required.
- During **build** (`tsc --build`), TypeScript project references enforce the correct compilation order.
- Always import database types from `@kingdomcord/db`, never directly from `@prisma/client`. The db package re-exports everything.
- `GuildConfig` from `@kingdomcord/shared` is the typed shape of the `Guild.config` JSON column.

---

## Coding Conventions

- **Async/await** everywhere — no raw Promises or callbacks
- **Error handling**: all Discord interaction handlers must have try/catch; reply with an ephemeral error message on failure — never let an interaction time out silently
- **Slash commands**: each command lives in its own file under `commands/`, exports a `data` (SlashCommandBuilder) and `execute` function
- **Services**: all business logic lives in `services/` — command handlers call services, they do not contain logic themselves
- **Prisma**: always use transactions for any operation that modifies KP balances
- **Logging**: use the `pino` logger exported from `packages/bot/src/index.ts`; always include `guild_id` and `user_id` in log context

---

## Environment Variables

```
DISCORD_TOKEN=
DISCORD_CLIENT_ID=
ANTHROPIC_API_KEY=
OPENAI_API_KEY=          # Whisper transcription only
BIBLE_API_KEY=           # api.bible key
DATABASE_URL=            # Postgres connection string (Railway)
REDIS_URL=               # Redis connection string (Railway)
NODE_ENV=development|production
```

Copy `.env.example` to `.env` for local dev. Railway injects these automatically in production.

---

## Database Schema

Prisma schema at `packages/db/prisma/schema.prisma`. Key models:

| Model | Purpose |
|---|---|
| `Guild` | Per-server config; `config` JSON column typed as `GuildConfig` |
| `User` | Per-user KP balance, streak, lifetime points; unique on `(userId, guildId)` |
| `Season` | Guild-scoped season with start/end dates |
| `SeasonRecord` | Archived end-of-season rank/points snapshot |
| `Reward` / `UserReward` | Reward catalog and user inventory |
| `PointsLedger` | Append-only audit log of every KP delta with reason string |
| `DailyPost` | Record of each daily verse post and its engagement |
| `BibleStudySession` | Apollo voice session transcript and summary |

---

## Critical Rules

- **Never push directly to `main`** — all changes via PRs
- **Never hardcode guild IDs** — always read from DB config
- **KP changes**: all adjustments go through `PointsService.adjust()` which writes a `PointsLedger` row — never mutate `kingdomPoints` directly
- **Season resets are destructive** — always archive to `SeasonRecord` before resetting; test on a staging guild first
- **Apollo LLM calls**: always include the theological system prompt from `services/apollo/systemPrompt.ts` — do not inline it elsewhere
- **Rate limiting**: use discord.js built-in rate limit handling; never bulk-post without queuing
- **Voice sessions**: always call `connection.destroy()` on session end or error — leaked connections cause bot instability

---

## Deployment (Railway)

- `railway.toml` configures the build (nixpacks) and start command (`npm run db:migrate && npm start`)
- Main branch auto-deploys to production; `staging` branch maps to the staging environment
- Migrations run automatically on every deploy via `prisma migrate deploy`
- Monitor: Railway dashboard → Deployments, or `railway logs`

---

## Out of Scope (Do Not Build Yet)

- Web dashboard — Phase 5
- Stripe billing — Phase 5
- White-label / enterprise features

---

## Open Architecture Questions

Consult the "Open Questions / Decisions Log" in PROJECT.md before deciding on:
- Voice transcription provider (Whisper API vs self-hosted whisper.cpp)
- Default Bible translation (leaning ESV, configurable per guild)
- Apollo session memory behavior (how many past sessions to load into context)
