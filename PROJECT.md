# Kingdomcord — Master Project Design Document

> All-in-one community engagement and Bible study assistant platform for churches on Discord.

---

## Vision

Kingdomcord makes Discord a spiritually alive space for churches — driving daily engagement through gamified Bible interaction and providing AI-powered pastoral support through every stage of community life, from casual members to deep study groups.

The long-term goal is a multi-tenant SaaS platform where any church can spin up Kingdomcord in their Discord server with a few clicks.

---

## Core Bots

### 1. KingdomBot — Community Engagement Bot
Drives daily participation through Bible content, trivia, and a gamified rewards economy.

### 2. Pastor Apollo — AI Bible Study Assistant
An LLM-powered pastoral companion that joins voice calls, assists in text channels, and supports both in-person and remote Bible study sessions.

---

## Feature Breakdown

### KingdomBot

#### Daily Verse Posts
- Posts to a designated `#daily-word` channel every day at a configurable time (default: 8:00 AM server timezone)
- Fetches 1–2 verses from Scripture API (api.bible)
- Selects verses thematically or randomly, with optional admin-curated override
- Post includes the verse, its reference, and a short reflection prompt
- Includes 1–3 engagement prompts per post (mix of):
  - Trivia questions (multiple choice reactions)
  - Reflection prompts (open-ended replies)
  - Pop quizzes (e.g. "Who said this?")

#### Kingdom Points System
- Members earn Kingdom Points (KP) by engaging with daily posts:
  - Reacting to the daily verse: +5 KP
  - Answering a trivia question correctly: +10 KP
  - Submitting a reflection response: +8 KP
  - Streaks (7-day, 30-day): bonus KP multipliers
- Points tracked per guild (server) and per user
- Leaderboard available via `/leaderboard` command

#### Rewards Store
- Members spend KP in `#kingdom-store` or via `/store` command
- Reward categories:
  - **Titles** — Custom role names displayed in the server (e.g. "Scribe", "Deacon", "Apostle")
  - **Badges** — Custom emoji or profile flair
  - **Custom Emojis** — Unlockable server emojis
  - **Boosts** — Temporary KP multipliers
  - **Cosmetic Roles** — Color roles with seasonal names
- Purchases are logged; titles and badges persist across seasons (see Seasons below)

#### Season System (Quarterly Resets)
- Inspired by battle pass / seasonal game models (Fortnite, etc.)
- Each season: ~3 months, named (e.g. "Season 1: The Psalms")
- At season end:
  - KP balances reset to 0
  - Season leaderboard is archived and announced
  - Seasonal titles/badges are locked as "Legacy" collectibles
  - New season theme and rewards drop
- Admins can configure season length and reset date

#### Admin Controls
- `/admin setup` — Initial server configuration wizard
- `/admin channel set [daily-word|store|leaderboard]` — Set dedicated channels
- `/admin season` — Manage season dates and themes
- `/admin verse override` — Schedule a specific verse for a specific date
- `/admin points adjust @user [amount]` — Manual KP adjustments

---

### Pastor Apollo

#### Text Channel Commands
| Command | Description |
|---|---|
| `/reference [topic]` | Returns 3–5 Bible verses related to a topic |
| `/summary [topic]` | Concise theological summary of a topic |
| `/explain [verse]` | Deep contextual explanation of a specific verse |
| `/devotional` | Generates a short personalized devotional |
| `/pray [intention]` | Writes a contextual prayer |
| `/compare [topic]` | Compares OT and NT perspectives on a topic |
| `/denomination [topic]` | Summarizes different denominational views |

#### Voice Call Integration
- Apollo can be invited to any voice channel via `/apollo join`
- Listens to audio in the call and transcribes using OpenAI Whisper
- Maintains a running transcript buffer per session

**Session Commands (in-call or text):**
| Command | Description |
|---|---|
| `/apollo summary` | Summarizes the Bible study discussion so far |
| `/apollo highlight` | Extracts key theological points raised |
| `/apollo references` | Lists all Bible verses mentioned in the session |
| `/apollo note [text]` | Adds a manual annotation to the session summary |
| `/apollo end` | Ends the session and posts a full summary to a designated channel |

#### In-Person Bible Study Mode
- A user in the room can `/apollo join` a voice channel, then hold their phone/mic near the group
- Apollo transcribes ambient audio and treats it identically to a Discord call
- Session summary is posted to `#bible-study-notes` at the end

#### Pastoral Personality & Guardrails
- Apollo's LLM system prompt positions it as a warm, knowledgeable, non-denominational pastoral guide
- It does NOT:
  - Give personal legal, medical, or financial advice
  - Make doctrinal declarations on contested theological debates without acknowledging multiple views
  - Replace professional pastoral counseling for serious personal matters
- It does:
  - Cite Bible references for every claim
  - Acknowledge denominational diversity where relevant
  - Respond with empathy and encourage human connection

---

## Data Models (High Level)

```
Guild
  - guild_id (Discord snowflake)
  - name
  - config (JSON: channels, timezone, season settings, etc.)
  - current_season_id
  - created_at

User
  - user_id (Discord snowflake)
  - guild_id
  - username
  - kingdom_points (current balance)
  - lifetime_points
  - streak_days
  - last_active
  - created_at

Season
  - id
  - guild_id
  - name (e.g. "Season 1: The Psalms")
  - start_date
  - end_date
  - is_active

SeasonRecord (archived per season)
  - user_id
  - guild_id
  - season_id
  - final_points
  - final_rank

Reward
  - id
  - guild_id
  - type (title | badge | emoji | boost | role)
  - name
  - description
  - cost_kp
  - is_seasonal (resets each season)
  - is_legacy (awarded, not purchaseable)

UserReward (inventory)
  - user_id
  - guild_id
  - reward_id
  - acquired_at
  - season_id (null if permanent)
  - is_equipped

DailyPost
  - id
  - guild_id
  - posted_at
  - verse_reference
  - verse_text
  - prompts (JSON array)
  - engagement_count

BibleStudySession
  - id
  - guild_id
  - channel_id
  - started_at
  - ended_at
  - transcript (text)
  - summary (text)
  - participants (JSON array of user_ids)
```

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Language | TypeScript | Type safety, best discord.js support |
| Discord library | discord.js v14 | Industry standard, rich voice support |
| Runtime | Node.js 20 LTS | Stability, ecosystem |
| Database | PostgreSQL | Relational data, transactions for KP |
| ORM | Prisma | Type-safe, great migrations |
| LLM | Anthropic Claude API | Nuanced theological reasoning, usage-based pricing |
| Voice transcription | OpenAI Whisper API | Best accuracy, easy to meter per church |
| Bible data | Scripture API (api.bible) | Free tier, 2,000+ translations |
| Scheduling | node-cron | Daily verse posts |
| Hosting | Railway | Supports Postgres, Redis, auto-deploy from GitHub |
| Cache / queues | Redis (Railway plugin) | Session state, rate limiting |
| Payments (future) | Stripe | Church billing, usage-based tiers |

---

## Multi-Tenant SaaS Architecture (Future)

Each Discord server (guild) is a tenant. Configuration is isolated per guild_id.

### Planned Tiers
| Tier | Price | Features |
|---|---|---|
| Free | $0 | KingdomBot basics, 1 Apollo text channel, 100 API calls/month |
| Community | $9/mo | Full KingdomBot, unlimited Apollo text, no voice |
| Pro | $29/mo | Everything + Apollo voice + Bible study summaries |
| Enterprise | Custom | White-label, dedicated support, custom verse curation |

### Onboarding Flow (Future)
1. Church admin invites Kingdomcord bot to their server
2. Bot posts a setup message with a link to the Kingdomcord web dashboard
3. Admin completes onboarding wizard (timezone, channels, tier selection)
4. Bot configures itself automatically

---

## Project Phases

### Phase 1 — Core MVP
- [ ] Project scaffolding (monorepo, TypeScript, Prisma, Railway deploy)
- [ ] KingdomBot: daily verse post with Scripture API
- [ ] KingdomBot: KP system (earn on reactions)
- [ ] KingdomBot: basic leaderboard
- [ ] Basic guild config (channels, timezone)

### Phase 2 — Engagement Loop
- [ ] Trivia and reflection prompts on daily posts
- [ ] Streak bonuses
- [ ] KP rewards store (titles and roles)
- [ ] Season system with reset logic

### Phase 3 — Pastor Apollo (Text)
- [ ] Apollo slash commands (reference, summary, explain, pray)
- [ ] Claude API integration with theological system prompt
- [ ] Channel-scoped Apollo instances

### Phase 4 — Apollo Voice
- [ ] Voice channel join/leave
- [ ] Whisper transcription pipeline
- [ ] Session summary and highlight commands
- [ ] Auto-post session notes to designated channel

### Phase 5 — SaaS Platform
- [ ] Web dashboard (Next.js)
- [ ] Stripe billing integration
- [ ] Multi-tier feature gating
- [ ] Public bot listing (top.gg, Discord App Directory)

---

## Open Questions / Decisions Log

| Question | Status | Decision |
|---|---|---|
| Voice transcription: Whisper API vs self-hosted whisper.cpp? | Open | Start with API; self-host if costs become prohibitive |
| Bible translation default? | Open | ESV for English; configurable per guild |
| Should Apollo have memory of past sessions? | Open | Store session summaries; load last N into context |
| KP earn rate tuning? | Open | Will need playtesting; start conservative |
| Moderation: who can silence Apollo in a call? | Open | Admins + the user who invited it |

---

*Last updated: project planning phase — pre-implementation*
