# Kingdomcord — Claude Code Instructions

> Read PROJECT.md for full feature specs and architecture decisions before making any changes.

---

## Project Overview

Kingdomcord is a Discord application for churches with two bots:
- **KingdomBot** — Daily Bible verse posts, Kingdom Points gamification, seasonal rewards
- **Pastor Apollo** — LLM-powered Bible study assistant with voice transcription

This is a TypeScript/Node.js monorepo deployed on Railway.

---

## Stack & Key Libraries

- **Language**: TypeScript (strict mode, no `any`)
- **Runtime**: Node.js 20 LTS
- **Discord**: discord.js v14 (slash commands, voice via `@discordjs/voice`)
- **Database**: PostgreSQL via Prisma ORM
- **LLM**: Anthropic Claude API (`@anthropic-ai/sdk`)
- **Transcription**: OpenAI Whisper API
- **Bible data**: Scripture API — `https://api.scripture.api.bible/v1`
- **Scheduling**: `node-cron`
- **Cache**: Redis (`ioredis`)
- **Hosting**: Railway (Postgres and Redis as plugins)

---

## Repo Structure

```
kingdomcord/
├── packages/
│   ├── bot/              # Main Discord bot (KingdomBot + Pastor Apollo)
│   │   ├── src/
│   │   │   ├── commands/     # Slash command handlers
│   │   │   ├── events/       # Discord event handlers
│   │   │   ├── jobs/         # Scheduled tasks (daily verse, etc.)
│   │   │   ├── services/     # Business logic (points, rewards, apollo, etc.)
│   │   │   ├── voice/        # Voice + Whisper transcription pipeline
│   │   │   └── index.ts      # Entry point
│   ├── db/               # Prisma schema, migrations, seed
│   └── shared/           # Shared types and utilities
├── PROJECT.md
├── CLAUDE.md
├── CHANGELOG.md
└── package.json          # Workspace root
```

---

## Coding Conventions

- **TypeScript strict mode**: no `any`, no implicit returns on async functions
- **Async/await** everywhere — no raw Promises or callbacks
- **Error handling**: all Discord interaction handlers must have try/catch; reply with an ephemeral error message on failure — never let an interaction time out silently
- **Slash commands**: each command lives in its own file under `commands/`, exports a `data` (SlashCommandBuilder) and `execute` function
- **Services**: all business logic lives in `services/` — command handlers call services, they do not contain logic themselves
- **Environment variables**: all config via `.env` — never hardcode tokens, API keys, or guild IDs
- **Prisma**: always use transactions for any operation that modifies KP balances
- **Logging**: use a structured logger (pino); always include `guild_id` and `user_id` in log context

---

## Environment Variables

```
DISCORD_TOKEN=
DISCORD_CLIENT_ID=
ANTHROPIC_API_KEY=
OPENAI_API_KEY=          # For Whisper transcription only
BIBLE_API_KEY=           # api.bible key
DATABASE_URL=            # Postgres connection string (Railway)
REDIS_URL=               # Redis connection string (Railway)
NODE_ENV=development|production
```

---

## Critical Rules

- **Never push directly to `main`** — all changes via PRs
- **Never hardcode guild IDs** — always read from DB config
- **Never delete user KP without logging the reason** — all KP changes go through `PointsService.adjust()` with a reason string
- **Season resets are destructive** — always archive before resetting; write a migration and test it on a staging guild first
- **Apollo LLM calls**: always include the theological system prompt from `services/apollo/systemPrompt.ts` — do not inline it elsewhere
- **Rate limiting**: Discord has strict rate limits; use the built-in discord.js rate limit handling and do not bulk-post without queuing
- **Voice sessions**: always call `connection.destroy()` on session end or error — leaked voice connections will cause bot instability

---

## Database

Run migrations with:
```bash
npx prisma migrate dev --name <migration-name>
```

Regenerate client after schema changes:
```bash
npx prisma generate
```

Prisma schema lives at `packages/db/prisma/schema.prisma`.

---

## Running Locally

```bash
# Install deps
npm install

# Copy env
cp .env.example .env

# Run DB migrations
npm run db:migrate

# Start bot in dev mode (with ts-node-dev hot reload)
npm run dev
```

---

## Testing

- Unit tests: Vitest
- Test files co-located: `services/points.service.test.ts` alongside `points.service.ts`
- Run: `npm test`
- Always test KP transaction logic and season reset logic before shipping

---

## Deployment (Railway)

- Main branch auto-deploys to production on Railway
- Staging environment: `staging` branch
- Database migrations run automatically via `prisma migrate deploy` in the Railway start command
- Monitor logs via Railway dashboard or `railway logs`

---

## What's Out of Scope (Do Not Build Yet)

- Web dashboard — Phase 5, not started
- Stripe billing — Phase 5
- White-label / enterprise features
- Any mobile app

---

## Open Architecture Questions

See the "Open Questions / Decisions Log" table in PROJECT.md before making decisions on:
- Voice transcription provider
- Default Bible translation
- Apollo session memory behavior

If you're about to make a decision on any of these, ask first.
