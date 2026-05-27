# Changelog

All notable changes to Kingdomcord will be documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versions follow [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

---

## [0.1.0] - 2026-05-27

Phase 1 MVP — first live version of Kingdomcord running in a Discord server.

### Added

**Infrastructure**
- TypeScript/Node.js monorepo with npm workspaces (`packages/bot`, `packages/db`, `packages/shared`)
- TypeScript project references for correct build order (`shared → db → bot`)
- Prisma ORM with PostgreSQL — full schema for all planned features (Guild, User, Season, Reward, PointsLedger, DailyPost, BibleStudySession, etc.)
- Railway deploy config (`railway.toml`) — nixpacks build, auto-migration on start
- Hot-reload dev server via `ts-node-dev` with `tsconfig-paths` for monorepo alias resolution
- `deployCommands` script for guild-scoped (dev) or global slash command registration

**KingdomBot — Daily Verse**
- `BibleService`: fetches verses from the Scripture API (`rest.api.bible`) with NIV as default translation
- 30-verse curated daily rotation (deterministic by day-of-year)
- `node-cron` job posts a verse embed to each guild's configured `#daily-word` channel at 8:00 AM daily
- `DailyPost` DB record created for each post, keyed by Discord `messageId`

**KingdomBot — Kingdom Points**
- `PointsService.adjust()`: all KP changes go through a single method that writes an atomic `PointsLedger` audit entry alongside the balance update (Prisma transaction)
- `messageReactionAdd` event: awards KP when a member reacts to a daily verse post — one award per member per post (idempotent via `DailyPostReaction` table)
- KP amounts are configurable per guild via `/admin config kp`

**Commands**
- `/leaderboard` — top 10 KP earners with medal display
- `/admin channel set [type] [channel]` — configure Daily Word, Store, Leaderboard, and Bible Study Notes channels
- `/admin config kp [action] [amount]` — tune KP awards per action per server
- `/admin post-now` — trigger a verse post immediately (testing)

**Shared Types**
- `GuildConfig` interface: typed shape for the `Guild.config` JSON column, includes `channels`, `kp`, `season`, `timezone`, and `bibleId`
- `KpConfig` interface: per-server KP amounts for all earn actions

### Fixed
- `messageReactionAdd` FK violation: user row now upserted before `DailyPostReaction` insert
- Silent error swallowing in `postDailyVerseToAllGuilds` — rejected promises are now logged
- Scripture API base URL corrected to `rest.api.bible`
- `ts-node-dev` path alias resolution — added `tsconfig-paths/register`
- Discord privileged intents (`MessageContent`, `GuildMembers`) documented and enabled

---

## [0.0.1] - 2026-05-27

### Added
- Project planning: `PROJECT.md` master design document
- `CLAUDE.md` for Claude Code session context
- `CHANGELOG.md`
