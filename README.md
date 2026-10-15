# CORE Hub

One Discord bot for moderation, community tools, games, profiles and AI. Minecraft hosting controls live in the independent CORE-mc project. See [all commands](COMMANDS.md) and [sample cards](previews/rank.png).

## Run locally

Install Node.js 24 LTS. In this folder:

```powershell
npm ci
Copy-Item .env.example .env
```

Edit the private `.env`: set DISCORD_TOKEN, CLIENT_ID, GUILD_ID for a test server, and OWNER_IDS (your Discord user ID). Never commit that file. Enable **Message Content** and **Server Members** intents in the Discord Developer Portal. Invite your bot with `bot` and `applications.commands` scopes. Grant only permissions needed by enabled features; position its role above roles/members it must manage.

```powershell
npm run check
npm test
npm run register
npm start
```

Register replaces this application's commands in the selected guild (or globally if GUILD_ID is blank). Use a distinct Discord application/token for CORE-mc. Register/start have not been run against a live account by this rebuild.

## Set up in Discord

### Sticky messages, verification and arcade

`/setup verify channel:#verify role:@Member` publishes a rules-acceptance button. The bot role must be above Member; clicking again keeps the role. This is not identity verification or a CAPTCHA. Republish older verification panels to use the one-way button behavior.

`/setup sticky channel:#general text:Read the rules before posting` creates a sticky message. Prefix equivalent: `>sticky set #general Read the rules before posting`. `/sticky show` displays its settings and `/sticky off` removes it. One sticky per channel; setting another replaces it. Human messages trigger a repost at most every 30 seconds (checked every 15 seconds). Settings survive restarts. Bot/webhook messages do not trigger reposts, and sticky text cannot ping anyone. The bot deletes only its own previous sticky; it needs View Channel, Send Messages, Embed Links and Read Message History.

`/setup arcade channel:#arcade` creates a sticky arcade menu. `>arcade` or `>games` opens the same menu without making it sticky. Four generated puzzle modes—math, sequence, compare and scramble—support unlimited repeat plays, plus launch buttons for trivia, tic-tac-toe and dice. These are seven menu entries, not infinitely many distinct games. `/arcade score` tracks your puzzle wins. One active puzzle per member per server, expiring after two minutes; only its owner can answer, and an answer scores once. Official external game links moved to `>gamelinks`.

- `/setup logs` and `/setup welcome`: logs and personalized, looping welcome GIFs. Welcome posts name the inviter when a single invite link can be identified from Discord's use counts; ambiguous joins omit the attribution. `/setup cards off` disables the GIF.
- `/setup ticket`: publishes the ticket button with staff access. Tickets remain as read-only channels after closing; transcripts cover the latest 1,000 messages.
- `/setup verify` and `/setup roles`: safe role buttons. Verification acknowledges rules; it is not a CAPTCHA or identity check.
- `/setup levels on`, `/level scan`: XP and safe role rewards. Review `/level roles` after scanning.
- `/setup ratings`, `/setup trap`, `/setup guard`: rating reactions, a clearly labeled do-not-post channel, and burst alerts to staff. Guard alerts do not automatically ban anyone.
- `/setup freegames`: one digest message refreshed every 30 minutes while online.
- `/setup prefix`, `/setup prefixes`: primary prefix plus up to 20 additional prefixes. `/alias add` supports up to 1,000 shortcuts per server. These are finite, bounded settings, not 50,000 duplicate commands.
- `/bot activity`, `/bot rotate`, `/bot status`: owner-only global presence settings.

`>ban @member reason`, `>action slap @member`, `>slap @member`, `>rank`, `>quote create keep building`, `>game tictactoe`, and `>help` are examples. Actions honor the target's opt-out setting. CORE Nitro is a seven-day cosmetic profile perk bought with 500 earned coins; it is **not Discord Nitro**, a paid subscription, or a redeemable gift code.

## Gemini + Groq: six key slots

In `.env`, fill GEMINI_API_KEY_1 through GEMINI_API_KEY_3 and GROQ_API_KEY_1 through GROQ_API_KEY_3. Set GEMINI_MODEL and GROQ_MODEL to model IDs available to your accounts. Unused slots may remain blank. Restart after changes. Keys are sent only in request headers and excluded from status output.

The starting slot is randomized; requests rotate through slots with failover for transient failures. A 429 pauses the whole affected provider according to Retry-After, since keys can share quota. Authentication failures disable the affected slot until restart. Rotation does not create additional quota. Two concurrent AI requests maximum; AI_DAILY_REQUESTS defaults to 100 per server shared by commands and auto-chat. Failed attempts also consume budget.

Use `/setup ai` to choose a channel for `/ai chat`, explain, summarize and code. Use `/setup autochat` with `named` to answer mentions or "core", or `all` to answer human messages in that channel. Auto-chat is off until configured, ignores bots/webhooks, has a 15-second channel cooldown, and sends only the triggering message to providers. It does not collect chat history or execute AI-generated commands. `/ai autostop` disables it.

Normal bot replies cannot ping users, roles or everyone. Optional `/setup massmentions on` allows a direct `core ping everyone` (or `ping everyone @Bot`) only when both the requesting member and bot have current Mention Everyone permission. There is a five-minute server cooldown. AI output cannot activate this path.

## Persistence and hosting

SQLite stores settings, XP, coins, warnings and active feature state under DATA_DIR. Use one running process per database and persistent storage. Stop the bot before copying its complete data directory for a backup. Do not expose that directory publicly.

On Render use an always-on service with a persistent disk, point DATA_DIR at its mount, install with `npm ci`, start with `npm start`, and use `/health` when PORT is set. **Render Free is unsuitable for retaining this SQLite data:** its filesystem is ephemeral and free web services can sleep. See [Render's documented limits](https://render.com/docs/free). A health pinger is not a persistence solution.

The optional Dockerfile uses Node 24 and a data volume. Docker deployment has not been tested here. Memory is bounded with cache limits and serialized image rendering, but 300 MB is not a guaranteed maximum; see [measured local scenario](reports/memory.json). No music/voice playback, real Discord Nitro, AI image generation, or full antinuke system is included.

## Checks and sources

`npm test`, `npm run check`, `node scripts/preview-cards.js`, `node scripts/benchmark.js`, and `node scripts/smoke-public.js` are reproducible. Public endpoint results are in [the API report](reports/public-apis.json). Mocked Discord tests do not replace live guild tests.

Providers: [Gemini](https://ai.google.dev/api/generate-content), [Groq](https://console.groq.com/docs/api-reference), [GamerPower](https://www.gamerpower.com/api-read), [FreeToGame](https://www.freetogame.com/api-doc), [nekos.best](https://docs.nekos.best/getting-started/api-endpoints.html). API listings and availability can change. External providers receive requests only when their features run.

## CORE Collect

Use `/collect cat`, `/collect anime`, `/collect fox`, or `/collect relic` to find one of 32 original cards. Each card has its own locally encoded, looping GIF with category art, item colors, a unique mark, and motion. Pulls are stored per server. Each category has a 30-minute cooldown and published odds: common 60%, rare 28%, epic 10%, legendary 2%.

`/collect album` tracks discoveries; `/collect show` replays an owned card. Duplicates remain in the album and award a small coin bonus. `/collect gift` gives a spare copy to another member. Five pulls in a UTC day complete `/collect quest` for coins and a streak. `/collect weekly` and `/collect leaderboard` give members short and long term goals. Render sample encoded cards with `npm run preview:collect` and see [the collection gallery](previews/collect/GALLERY.md).

`/collect trade` posts a one-for-one offer with Accept and Decline buttons. Only the invited member can accept; either trader can decline. The cards swap atomically if both are still owned when accepted within 10 minutes. `/collect hunt` tracks a Monday-to-Monday UTC server goal of 20 pulls by at least two members. Anyone with two personal pulls can claim 250 coins once per week after the goal is met.

Admins can run `/invite setup` to choose an invite destination and coin reward, then `/embed invite` to publish a link button. Members use `/invite link`, `/invite stats`, and `/invite leaderboard`. CORE creates a tracked link per member and awards a new recruit after a 24-hour stay. Invite attribution requires the bot's Manage Server permission and a clear change in Discord invite use counts; ambiguous joins are skipped. Rewards and links persist in SQLite, while fresh invite snapshots are taken on startup. Re-register slash commands after updating.

## Server statistics counters

Use `/counter setup type:members`, then repeat with `humans`, `bots`, or `online`. Prefix equivalents include `>counter setup bots`. Each creates one read-only voice channel with the count in its name. Setup requires Manage Server and Manage Channels for you, and Manage Channels for the bot. Enable Server Members Intent in the Developer Portal for full human/bot counts.

Counters persist across restarts and refresh every 10 minutes; unchanged names are not rewritten. Online is Discord's approximate presence count (including bots), shown as **Online ~**. It is not an exact human-only online count. See [Discord Get Guild counts](https://github.com/discord/discord-api-docs/blob/main/developers/resources/guild.mdx). A failed fetch preserves the last displayed count.

Use `/counter list` to inspect channels and `/counter remove type:bots` to stop tracking. Removal leaves the channel intact. If a counter channel is deleted, remove its tracking and set it up again. Re-register slash commands after updating.

For the arcade, `/arcade sticky` keeps the menu in the current channel; `/setup arcade channel:#arcade` selects another channel.

## Prefix expansion and command channels

Use `>prefixmenu` (or `>prefixmenu 2`, etc.) for the new prefix-only pack: text transforms, fortunes, quests, truth/dare prompts, loot, dice, list shuffling and secret-number rounds. There are 29 additional prefix-only handlers; they are excluded from slash registration.

Manage Server members can create custom replies with `>reply set rulesinfo Please read the rules before posting.`, invoke them with `>rulesinfo`, list them with `>reply list`, and remove them with `>reply remove rulesinfo`. Replies are saved per server, cannot replace built-in commands, and never ping mentions. They are plain text, not executable scripts. There is no hard-coded count limit for custom reply entries; storage and Discord message/rate limits still apply.

Channels named general (including emoji-separated names) and their threads block commands by default. Prefix commands stay silent there; slash commands return an ephemeral redirect. Moderation filters, sticky maintenance and ordinary chat XP still work. Explicitly configured auto-chat can still respond to normal conversation. To control a channel use `/setup commandchannels channel:#general mode:block` or `mode:allow`. `mode:reset` restores the name-based default. This administrative setup command remains accessible to authorized admins to avoid lockout. An explicit parent-channel block applies to threads. Verification/ticket buttons continue to work.

[View every card preview](previews/GALLERY.md) ? [All-card contact sheet](previews/all-cards.jpg). These use synthetic sample names and statistics.
