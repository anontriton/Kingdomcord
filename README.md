# Kingdomcord

An all-in-one Discord bot for churches — daily Bible verses, a Kingdom Points engagement system, and an AI-powered Bible study assistant.

---

## Bots

| Bot | Purpose |
|---|---|
| **KingdomBot** | Posts a daily verse, tracks engagement via Kingdom Points (KP), and runs a rewards economy |
| **Pastor Apollo** | LLM-powered Bible study assistant for text channels and voice calls *(coming Phase 3–4)* |

---

## Getting Started (Server Admins)

### 1. Invite the bot
Invite Kingdomcord to your Discord server using the invite link provided by your instance owner.

### 2. Configure your channels
Run the following command in any channel the bot can see:

```
/admin channel set  type: Daily Word  channel: #daily-word
```

Repeat for any other channels you want to configure:

| Type | Purpose |
|---|---|
| **Daily Word** | Where the bot posts the daily Bible verse each morning |
| **Leaderboard** | *(future)* Pinned leaderboard display |
| **Kingdom Store** | *(future)* Where members browse and spend KP |
| **Bible Study Notes** | *(future)* Where Apollo posts session summaries |

### 3. That's it
The bot will automatically post a verse to your `#daily-word` channel every day at **8:00 AM**.

---

## Commands

### For Everyone

| Command | Description |
|---|---|
| `/leaderboard` | Shows the top 10 Kingdom Points earners in this server |

### For Admins
*Requires the **Manage Server** permission.*

| Command | Description |
|---|---|
| `/admin channel set [type] [channel]` | Assigns a Discord channel to a Kingdomcord feature |

---

## Kingdom Points (KP)

Members earn **Kingdom Points** by engaging with daily content. Points are tracked per server and reset each season.

| Action | KP Earned |
|---|---|
| React to the daily verse | **+5 KP** |
| *(more ways to earn coming in Phase 2)* | |

Use `/leaderboard` to see where you rank in your server.

---

## Daily Verse

- A new verse is posted every day at **8:00 AM** to the configured `#daily-word` channel
- Verses are drawn from a curated rotation of 30 well-known passages
- Members earn **5 KP** for reacting to each post — one award per post, per member

---

## Roadmap

| Phase | Features |
|---|---|
| **Phase 1** ✅ | Daily verse, Kingdom Points, leaderboard, channel config |
| **Phase 2** | Trivia & reflection prompts, streak bonuses, rewards store, season system |
| **Phase 3** | Pastor Apollo text commands (`/reference`, `/explain`, `/pray`, etc.) |
| **Phase 4** | Apollo voice — joins calls, transcribes, posts Bible study summaries |
| **Phase 5** | Web dashboard, Stripe billing, multi-tier SaaS |
