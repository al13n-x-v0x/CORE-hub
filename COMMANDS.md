# Command reference

Generated from the actual registry. Use `/core help` in Discord. Prefix examples use `>`; mentions and configured extra prefixes work too. Quote multiword arguments when another argument follows.

## /setup

- **/setup prefixes** <values> — Set additional prefixes separated by |. Requires ManageGuild. 
- **/setup verify** <channel> <role> — Publish a verification button. Requires ManageRoles. 
- **/setup ratings** <channel> — Set the avatar-rating channel. Requires ManageGuild. 
- **/setup trap** <channel> — Set a clearly marked do-not-post safety channel. Requires ManageGuild. 
- **/setup freegames** <channel> [platform] — Publish an automatically refreshed giveaway digest. Requires ManageGuild. 
  - platform: all, steam, epic-games-store, gog, pc, android, ios.
- **/setup ai** <channel> — Enable AI only in a chosen channel. Requires ManageGuild. 
- **/setup cards** <state> — Turn automatic animated welcome GIF cards on or off. Requires ManageGuild. 
  - state: on, off.
- **/setup guard** <state> [threshold] — Alert staff about bursts of joins or channel deletions. Requires ManageGuild. 
  - state: on, off.
- **/setup autochat** <channel> <mode> — Enable AI conversation in one channel. Requires ManageGuild. 
  - mode: named, all.
- **/setup massmentions** <state> — Allow explicit authorized ping-everyone requests. Requires Administrator. 
  - state: on, off.
- **/setup sticky** <channel> <text> — Set a sticky message. Requires ManageGuild. 
- **/setup arcade** <channel> — Set a sticky arcade menu. Requires ManageGuild. 
- **/setup commandchannels** <channel> <mode> — Allow or block commands in a channel. Requires ManageGuild. 
  - mode: allow, block, reset.
- **/setup prefix** <prefix> — Change the prefix for this server. Requires ManageGuild. Shortcuts: `>prefix`. 
- **/setup logs** <channel> — Choose a moderation log channel. Requires ManageGuild. 
- **/setup welcome** <channel> [message] — Configure an animated welcome with a verified “Was invited by” field. Custom messages support `{user}`, `{server}`, and `{inviter}`. Requires ManageGuild. 
- **/setup autorole** <role> — Give a safe role to new members. Requires ManageRoles. 
- **/setup levels** <state> — Enable or disable chat XP. Requires ManageGuild. 
  - state: on, off.
- **/setup automod** <invites> <mentions> — Configure invite and mention filtering. Requires ManageGuild. 
  - invites: on, off.
- **/setup ticket** <channel> <staff> [title] — Publish a private support ticket panel. Requires ManageGuild. 
- **/setup roles** <channel> <role> [label] — Publish a safe self-assign role button. Requires ManageRoles. 
- **/setup view**  — View the current server settings. Requires ManageGuild. 
- **/setup disable** <feature> — Disable a configured feature. Requires ManageGuild. 
  - feature: welcome, autorole, logs, tickets, automod, levels, ratings, trap, freegames, ai, autochat, cards, guard.

## /alias

- **/alias add** <name> <command> — Create a server shortcut for an existing command. Requires ManageGuild. 
- **/alias remove** <name> — Remove a server shortcut. Requires ManageGuild. 
- **/alias list** [page] — List custom shortcuts. 

## /level

- **/level roles**  — Show configured level rewards. Shortcuts: `>levelroles`. 
- **/level scan**  — Find safe level roles from names such as Level 05. Requires ManageRoles. 
- **/level reward** <level> <role> — Set a safe role reward at a level. Requires ManageRoles. 
- **/level remove** <level> — Remove a level reward. Requires ManageRoles. 
- **/level perks**  — See how XP and rewards work. 
- **/level sync**  — Claim all level roles you qualify for. 
- **/level rank** [user] — View your rendered level and XP card. Shortcuts: `>rank`, `>level`. 
- **/level leaderboard**  — Show the rendered chat XP leaderboard. Shortcuts: `>leaderboard`, `>lb`. 

## /profile

- **/profile view** [user] — Show a personal profile image. Shortcuts: `>profile`. 
- **/profile bio** <text> — Set your profile bio. 
- **/profile theme** <theme> — Choose a card color theme. 
  - theme: mint, sunset, ice, gold.

## /nitro

- **/nitro info**  — About the pretend CORE Nitro cosmetic perk. Shortcuts: `>nitro`. 
- **/nitro buy**  — Spend 500 coins for seven days of CORE cosmetics. 
- **/nitro gift** <user> — Gift seven cosmetic days with 500 coins. 
- **/nitro status**  — Check your cosmetic perk expiry. 

## /quote

- **/quote random**  — Get an original CORE quote card. Shortcuts: `>quote`. 
- **/quote create** <text> — Render your own words as a quote card. Shortcuts: `>quotecard`. 
- **/quote message** <id> — Quote a visible message from this channel. 

## /game

- **/game free** [platform] — Show current free-game and loot offers. Shortcuts: `>freegames`. 
  - platform: all, steam, epic-games-store, gog, pc, android, ios.
- **/game discover** [genre] — Find a free-to-play game. Shortcuts: `>freeplay`. 
  - genre: shooter, mmorpg, strategy, racing, moba, sandbox, survival, battle-royale.
- **/game links**  — Open official game hubs. Shortcuts: `>gamelinks`. 
- **/game number**  — Start a number guessing game, 1 to 100. Shortcuts: `>number`. 
- **/game guess** <number> — Guess your hidden number. Shortcuts: `>guess`. 
- **/game tictactoe**  — Start a button-based game against CORE. Shortcuts: `>ttt`. 
- **/game joke**  — Get a playful joke. Shortcuts: `>joke`. 
- **/game compliment**  — Get a playful compliment. Shortcuts: `>compliment`. 
- **/game roast**  — Get a playful roast. Shortcuts: `>roast`. 
- **/game wouldyou**  — Get a playful wouldyou. Shortcuts: `>wouldyou`. 
- **/game coinflip**  — Flip a coin. Shortcuts: `>coinflip`, `>flip`. 
- **/game dice** [sides] — Roll a die. Shortcuts: `>dice`, `>roll`. 
- **/game rps** <move> — Rock, paper, scissors. Shortcuts: `>rps`. 
  - move: rock, paper, scissors.
- **/game 8ball** <question> — Ask the magic 8-ball. Shortcuts: `>8ball`. 
- **/game choose** <choices> — Pick from choices separated by |. Shortcuts: `>choose`. 
- **/game rate** <thing> — Give something a playful random rating. Shortcuts: `>rate`. 
- **/game trivia**  — Start a 30-second trivia question. Shortcuts: `>trivia`. 

## /bot

- **/bot status** <status> — Owner: set the global online status. 
  - status: online, idle, dnd, invisible.
- **/bot activity** <type> <text> — Owner: set a playing/watching/listening activity. 
  - type: playing, watching, listening, competing.
- **/bot rotate** <texts> — Owner: rotate activity text every minute. 

## /ai

- **/ai chat** <prompt> — Ask Gemini/Groq to chat. Shortcuts: `>ask`. 
- **/ai explain** <prompt> — Ask Gemini/Groq to explain. 
- **/ai summarize** <prompt> — Ask Gemini/Groq to summarize. 
- **/ai code** <prompt> — Ask Gemini/Groq to code. 
- **/ai status**  — Check provider slot availability without exposing keys. 
- **/ai autostop**  — Disable auto-chat in this server. Requires ManageGuild. 

## /media

- **/media gif** <category> — Get a reaction GIF. Shortcuts: `>gif`, `>gifs`. 
  - category: hug, slap, pat, wave, dance, happy, cry, laugh, smile, thumbsup.

## /arcade

- **/arcade menu**  — Open the replayable arcade. Shortcuts: `>arcade`, `>games`. 
- **/arcade math**  — Play a fresh math puzzle. Shortcuts: `>math`. 
- **/arcade sequence**  — Play a fresh sequence puzzle. Shortcuts: `>sequence`. 
- **/arcade compare**  — Play a fresh compare puzzle. Shortcuts: `>compare`. 
- **/arcade scramble**  — Play a fresh scramble puzzle. Shortcuts: `>scramble`. 
- **/arcade score**  — See your puzzle wins. 
- **/arcade sticky** [channel] — Keep the arcade sticky here or in another channel. Requires ManageGuild. Shortcuts: `>stickarcade`. 

## /sticky

- **/sticky set** <channel> <text> — Set a sticky message in a channel. Requires ManageGuild. 
- **/sticky arcade** <channel> — Keep the arcade menu near the bottom. Requires ManageGuild. 
- **/sticky off** <channel> — Remove the sticky from a channel. Requires ManageGuild. 
- **/sticky show** <channel> — Show current sticky settings. Requires ManageGuild. 

## /counter

- **/counter setup** <type> — Create an auto-updating server statistics channel. Requires ManageGuild. 
  - type: members, humans, bots, online.
- **/counter remove** <type> — Stop tracking a counter; leave its channel intact. Requires ManageGuild. 
  - type: members, humans, bots, online.
- **/counter list**  — Show configured server statistics counters. Requires ManageGuild. 

## /reply

- **>reply set** <name> <text> — Create or replace a custom prefix reply. Requires ManageGuild. 
- **>reply remove** <name> — Remove a custom prefix reply. Requires ManageGuild. 
- **>reply list** [page] — List custom prefix replies. 

## /extra

- **>extra prefixmenu** [page] — Browse prefix-only commands. Shortcuts: `>prefixmenu`. 
- **>extra reverse** <text> — Transform or inspect text. Shortcuts: `>reverse`. 
- **>extra uppercase** <text> — Transform or inspect text. Shortcuts: `>uppercase`. 
- **>extra lowercase** <text> — Transform or inspect text. Shortcuts: `>lowercase`. 
- **>extra titlecase** <text> — Transform or inspect text. Shortcuts: `>titlecase`. 
- **>extra spaced** <text> — Transform or inspect text. Shortcuts: `>spaced`. 
- **>extra mocktext** <text> — Transform or inspect text. Shortcuts: `>mocktext`. 
- **>extra wordcount** <text> — Transform or inspect text. Shortcuts: `>wordcount`. 
- **>extra rot13** <text> — Transform or inspect text. Shortcuts: `>rot13`. 
- **>extra fortune**  — Get a random fortune. Shortcuts: `>fortune`. 
- **>extra pep**  — Get a random pep. Shortcuts: `>pep`. 
- **>extra dadjoke**  — Get a random dadjoke. Shortcuts: `>dadjoke`. 
- **>extra quest**  — Get a random quest. Shortcuts: `>quest`. 
- **>extra wouldyourather**  — Get a random wouldyourather. Shortcuts: `>wouldyourather`. 
- **>extra truth**  — Get a random truth. Shortcuts: `>truth`. 
- **>extra dare**  — Get a random dare. Shortcuts: `>dare`. 
- **>extra loot**  — Get a random loot. Shortcuts: `>loot`. 
- **>extra pet**  — Get a random pet. Shortcuts: `>pet`. 
- **>extra boss**  — Get a random boss. Shortcuts: `>boss`. 
- **>extra achievement**  — Get a random achievement. Shortcuts: `>achievement`. 
- **>extra vibe**  — Get a random vibe. Shortcuts: `>vibe`. 
- **>extra shuffle** <text> — Shuffle a list separated by |. Shortcuts: `>shuffle`. 
- **>extra rollmany** <count> <sides> — Roll several dice. Shortcuts: `>rollmany`. 
- **>extra secretstart**  — Start a number guessing round. Shortcuts: `>secretstart`. 
- **>extra secretguess** <number> — Submit a guess. Shortcuts: `>secretguess`. 
- **>extra secretstop**  — End your guessing round. Shortcuts: `>secretstop`. 

## /core

- **/core help** [category] — Browse command categories and prefix shortcuts. Shortcuts: `>help`. 
- **/core ping**  — Check gateway latency. Shortcuts: `>ping`. 
- **/core info**  — Bot uptime and measured memory. Shortcuts: `>botinfo`. 
- **/core server**  — Server information and image card. Shortcuts: `>serverinfo`. 
- **/core user** [user] — Member information. Shortcuts: `>userinfo`. 
- **/core avatar** [user] — Show a member avatar. Shortcuts: `>avatar`, `>av`. 

## /mod

- **/mod ban** <user> [reason] — ban a member after role checks. Requires BanMembers. Shortcuts: `>ban`. 
- **/mod kick** <user> [reason] — kick a member after role checks. Requires KickMembers. Shortcuts: `>kick`. 
- **/mod unban** <id> [reason] — Unban a user by Discord ID. Requires BanMembers. Shortcuts: `>unban`. 
- **/mod timeout** <user> <minutes> [reason] — Temporarily restrict a member. Requires ModerateMembers. Shortcuts: `>timeout`, `>mute`. 
- **/mod untimeout** <user> [reason] — Remove a member timeout. Requires ModerateMembers. Shortcuts: `>untimeout`, `>unmute`. 
- **/mod warn** <user> <reason> — Save a warning for a member. Requires ModerateMembers. Shortcuts: `>warn`. 
- **/mod warnings** <user> — Show the latest ten warnings. Requires ModerateMembers. Shortcuts: `>warnings`. 
- **/mod clearwarnings** <user> — Clear all warnings for a member. Requires ModerateMembers. Shortcuts: `>clearwarns`. 
- **/mod purge** <count> — Delete recent messages under 14 days old. Requires ManageMessages. Shortcuts: `>purge`, `>clear`. 
- **/mod slowmode** <seconds> — Set this channel slowmode. Requires ManageChannels. Shortcuts: `>slowmode`. 
- **/mod lock**  — Prevent @everyone from sending messages. Requires ManageChannels. Shortcuts: `>lock`. 
- **/mod unlock**  — Restore the saved @everyone send permission. Requires ManageChannels. Shortcuts: `>unlock`. 
- **/mod role-add** <user> <role> [reason] — Add a member role. Requires ManageRoles. Shortcuts: `>addrole`. 
- **/mod role-remove** <user> <role> [reason] — Remove a member role. Requires ManageRoles. Shortcuts: `>removerole`. 
- **/mod nickname** <user> <name> — Change a member nickname. Requires ManageNicknames. Shortcuts: `>nick`. 

## /action

- **/action slap** <user> — slap another member. Shortcuts: `>slap`. 
- **/action hug** <user> — hug another member. Shortcuts: `>hug`. 
- **/action pat** <user> — pat another member. Shortcuts: `>pat`. 
- **/action bonk** <user> — bonk another member. Shortcuts: `>bonk`. 
- **/action highfive** <user> — highfive another member. Shortcuts: `>highfive`. 
- **/action wave** <user> — wave another member. Shortcuts: `>wave`. 
- **/action poke** <user> — poke another member. Shortcuts: `>poke`. 
- **/action cuddle** <user> — cuddle another member. Shortcuts: `>cuddle`. 
- **/action cheer** <user> — cheer another member. Shortcuts: `>cheer`. 
- **/action boop** <user> — boop another member. Shortcuts: `>boop`. 
- **/action dance** <user> — dance another member. Shortcuts: `>dance`. 
- **/action fistbump** <user> — fistbump another member. Shortcuts: `>fistbump`. 
- **/action privacy** <state> — Allow or block actions targeting you. 
  - state: on, off.

## /economy

- **/economy daily**  — Claim your daily coins. Shortcuts: `>daily`. 
- **/economy work**  — Claim your work coins. Shortcuts: `>work`. 
- **/economy balance** [user] — View a coin balance. Shortcuts: `>balance`, `>bal`. 
- **/economy pay** <user> <amount> — Transfer coins to another member. Shortcuts: `>pay`. 
- **/economy leaderboard**  — Show the ten richest members. Shortcuts: `>rich`. 

## /ticket

- **/ticket open**  — Open a private support ticket. Shortcuts: `>ticket`. 
- **/ticket close**  — Close this ticket and preserve its transcript. 
- **/ticket transcript**  — Download the latest 1,000 messages in this ticket. 
- **/ticket add** <user> — Add a member to this ticket. 

## /giveaway

- **/giveaway start** <minutes> <winners> <prize> — Start a giveaway with persistent entries. Requires ManageGuild. 
- **/giveaway end** <id> — End a giveaway early. Requires ManageGuild. 
- **/giveaway reroll** <id> — Choose new winners for an ended giveaway. Requires ManageGuild. 

## /community

- **/community announce** <channel> <text> — Publish an announcement without mass pings. Requires ManageGuild. Shortcuts: `>announce`. 
- **/community poll** <question> <choices> — Create a native Discord poll. Shortcuts: `>poll`. 
- **/community suggest** <text> — Post a suggestion for voting. Shortcuts: `>suggest`. 

## /tool

- **/tool hash** <text> — Calculate a SHA-256 hash. Shortcuts: `>hash`. 
- **/tool base64** <mode> <text> — Encode or decode Base64. Shortcuts: `>base64`. 
  - mode: encode, decode.
- **/tool timestamp** <seconds> — Format a Unix timestamp for Discord. Shortcuts: `>timestamp`. 
- **/tool color** <hex> — Preview a six-digit hex color. Shortcuts: `>color`. 


## /collect

- **/collect cat**, **/collect anime**, **/collect fox**, **/collect relic** — Pull an original animated card from that series. Each series has its own 30-minute cooldown.
- **/collect album** [category] [user] — See collection progress and item IDs.
- **/collect show** <category> <item> — Replay a card you own as a GIF.
- **/collect gift** <user> <category> <item> — Give a spare copy to another member.
- **/collect trade** <user> <offer_category> <offer_item> <want_category> <want_item> — Offer a one-for-one trade. The recipient must accept within 10 minutes. Both cards are checked at acceptance.
- **/collect hunt** — Show the UTC weekly server hunt and claim 250 coins after 20 shared pulls from at least two members, including two of your own.
- **/collect quest** — Claim a daily coin reward after five pulls; consecutive UTC days build a streak.
- **/collect weekly** — See the most active collectors over the last seven days.
- **/collect leaderboard** — Rank distinct cards found in this server.
- **/collect odds** — See rarity odds and duplicate rewards.

## /invite and /embed

- **/invite setup** <channel> <coins> — Admin: enable tracked personal invite links and choose a 25–1000 coin reward. The bot needs Manage Server and Create Invite.
- **/invite disable** — Admin: stop tracking new joins. Pending verified rewards still settle.
- **/invite link** — Get your personal tracked link privately.
- **/invite stats** — See tracked, pending and rewarded joins.
- **/invite leaderboard** — Rank verified inviters.
- **/embed invite** <channel> — Admin: post an invite rewards panel with a private link button.

Invite rewards are paid once per new member after 24 hours in the server. The bot credits only an unambiguous one-use increase on a known link; it does not guess when simultaneous joins or unavailable invite data prevent attribution. A returning member cannot produce another reward.

Owner and hosting controls have additional checks inside their handlers. Prefix shortcuts use exactly the same command handlers and permissions as slash commands.
