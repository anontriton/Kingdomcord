# Kingdomcord — Session Handoff

**Date:** 2026-05-27  
**Session scope:** Project setup through Phase 1 complete + live tested  
**Repo:** https://github.com/anontriton/Kingdomcord  
**Branch:** `main` (4 commits)

---

## What Was Built This Session

### Infrastructure
- Full TypeScript monorepo with npm workspaces (`packages/bot`, `packages/db`, `packages/shared`)
- TypeScript project references enforce build order: `shared → db → bot`
- Prisma + PostgreSQL — all tables migrated, schema covers all phases (1–4)
- Railway deploy config (`railway.toml`) — auto-migrates and starts on deploy
- `ts-node-dev` hot reload with `tsconfig-paths/register` for monorepo alias resolution
- `deployCommands` script for instant guild-scoped slash command registration

### Phase 1 Features (all live and tested)
| Feature | Status |
|---|---|
| Daily verse post (node-cron, 8 AM) | ✅ Working |
| Scripture API (NIV, rest.api.bible) | ✅ Working |
| KP awarded on daily verse reaction | ✅ Working |
| `/leaderboard` command | ✅ Working |
| `/admin channel set` | ✅ Working |
| `/admin config kp` (per-server KP tuning) | ✅ Deployed |
| `/admin post-now` (manual trigger for testing) | ✅ Working |

---

## Current Live State

**Guild:** SDTPC (`1404880626619908216`)  
**Daily Word channel:** `1509325664661143622`  
**Active users:** 1 (ivermino, 5 KP)  
**Daily posts logged:** 1  

The bot is currently running locally via `npm run dev`. It is **not yet deployed to Railway** — that is the next infrastructure task before Phase 2.

---

## Environment

All secrets live in `.env` at the repo root (gitignored). Key values in use:

| Variable | Notes |
|---|---|
| `DISCORD_TOKEN` | Bot token — regenerate at discord.com/developers if it stops working |
| `DISCORD_CLIENT_ID` | `1509277919112069131` |
| `BIBLE_API_KEY` | From rest.api.bible dashboard |
| `DATABASE_URL` | `postgresql://iverson@localhost/kingdomcord` (local only) |
| `DEPLOY_GUILD_ID` | `1404880626619908216` — SDTPC server, used for instant command registration |
| `NODE_ENV` | `development` |

**Local Postgres quirk:** Must be started with `LC_ALL="en_US.UTF-8"`:
```bash
LC_ALL="en_US.UTF-8" pg_ctl -D /opt/homebrew/var/postgresql@16 -l /opt/homebrew/var/log/postgresql@16.log start
```

---

## Architecture Decisions Made

| Decision | Rationale |
|---|---|
| Default Bible: NIV (`78a9f6124f344018-01`) | Widely used in churches; configurable per guild via `GuildConfig.bibleId` |
| Bible API base URL: `rest.api.bible` | The `api.scripture.api.bible` domain returns 401 — correct host confirmed |
| Manual migration files instead of `prisma migrate dev` | `migrate dev` requires an interactive TTY; non-interactive environments must create SQL manually and apply with `migrate deploy` |
| `tsconfig-paths/register` in all ts-node scripts | npm workspace scripts run from the package dir, so tsconfig `paths` aliases don't resolve without it |
| `DOTENV_CONFIG_PATH=../../.env` in all bot scripts | Same reason — dotenv's default `.env` lookup is relative to cwd, which is `packages/bot/` in workspace mode |
| `Promise.allSettled` in daily verse job | One guild's failure should never block others; errors are logged per-guild |
| KP amounts on `GuildConfig.kp` | Per-server configurability without a separate DB table |
| User upsert before `DailyPostReaction` insert | FK constraint — a member reacting for the first time has no `User` row yet |

---

## Known Issues / Tech Debt

| Issue | Priority | Notes |
|---|---|---|
| **Not deployed to Railway** | High | Bot only runs locally. Need to provision Railway Postgres + Redis, set env vars, and push |
| `Guild.config` missing `kp` key for existing guilds | Low | Old configs pre-date `KpConfig`. `getConfig()` deep-merges defaults so it works, but a backfill migration would be clean |
| `node-cron` runs on server timezone | Medium | 8 AM is server time, not per-guild timezone. Phase 2 should use `config.timezone` to schedule per guild |
| Git committer identity | Low | Shows as `iverson@Mac.lan` — run `git config --global user.email` to set properly |
| `DEPLOY_GUILD_ID` in `.env` | Low | Fine for dev; for production remove this to use global command registration |
| No error boundary on `interactionCreate` for unknown subcommand groups | Low | Falls through silently — add a fallback `else` log |

---

## File Map (key files only)

```
packages/
  shared/src/types.ts          — GuildConfig, KpConfig, Snowflake — source of truth for config shape
  db/prisma/schema.prisma      — Full DB schema
  db/src/index.ts              — Prisma client singleton — always import from here
  bot/src/index.ts             — Client bootstrap, event registration, job start
  bot/src/logger.ts            — Shared pino logger — import this, not index.ts
  bot/src/types.ts             — Command interface + discord.js Client augmentation
  bot/src/services/
    guild.service.ts           — GuildConfig read/write — all config access goes here
    points.service.ts          — PointsService.adjust() — all KP changes go here
    bible.service.ts           — Scripture API client + daily verse rotation
  bot/src/jobs/
    dailyVerse.ts              — Cron job + postDailyVerseToAllGuilds (also used by /admin post-now)
  bot/src/commands/
    admin.ts                   — /admin (channel set, config kp, post-now)
    leaderboard.ts             — /leaderboard
  bot/src/events/
    interactionCreate.ts       — Slash command dispatcher
    messageReactionAdd.ts      — KP award on daily verse reactions
    guildCreate.ts             — Auto-upsert guild on bot join
  bot/src/scripts/
    deployCommands.ts          — Register slash commands with Discord API
```

---

## How to Resume

```bash
# Start Postgres (if not running)
LC_ALL="en_US.UTF-8" pg_ctl -D /opt/homebrew/var/postgresql@16 -l /opt/homebrew/var/log/postgresql@16.log start

# Start Redis (if not running)
brew services start redis

# Start bot
npm run dev

# After any schema change — create migration SQL manually, then:
DATABASE_URL="postgresql://iverson@localhost/kingdomcord" npx prisma migrate deploy --schema packages/db/prisma/schema.prisma

# After adding/changing slash commands
npm run deploy:commands -w packages/bot
```

---

## Phase 2 Scope (next session)

Per `PROJECT.md`:

- [ ] **Trivia + reflection prompts** on daily posts (multiple choice reactions, open-ended reply detection)
- [ ] **Streak bonuses** — 7-day and 30-day streak tracking with `KpConfig.streakBonusMultiplier`
- [ ] **KP rewards store** — `/store` command, purchaseable titles and cosmetic roles
- [ ] **Season system** — quarterly resets, archive to `SeasonRecord`, season leaderboard announcement

Recommended start: streak tracking, since it builds on the reaction system already in place and `User.streakDays` / `User.lastActive` are already in the schema.
