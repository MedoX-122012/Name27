# Watan Guard 🛡️ - Discord Anti-Swear & AutoMod Bot

Production-ready bot with anti-bypass normalization, escalation, multi-guild, logging.

## Features
- 4 severity levels (MILD/MEDIUM/SEVERE/EXTREME) with configurable timeouts
- Anti-bypass: zero-width, homoglyphs, leet, arabic normalization, repeat collapse, symbols, transliteration
- False-positive protection via word boundaries + whitelist/blacklist
- Auto warn + timeout + log + DM + delete
- Escalation by points (MILD 1, MED 2, SEV 4, EXT 7)
- Warn expiration (30d default)
- Spam / Caps / Emoji / Mention / Link protection
- Commands: warn/warns/clearwarn/clearwarns/timeout/untimeout/mute/unmute/kick/ban/unban/purge/automod/setup/help/stats
- Multi-server with per-guild settings, Prisma SQLite (easy switch to Postgres)

## Installation
```bash
npm install
cp .env.example .env
# edit .env DISCORD_TOKEN CLIENT_ID DATABASE_URL
npx prisma generate
npx prisma db push
npm run deploy  # deploy slash commands (uses GUILD_ID if set else global)
npm run dev
```

## Env
```
DISCORD_TOKEN=...
CLIENT_ID=...
DATABASE_URL="file:./dev.db"
GUILD_ID= # optional for guild deploy
```

## Bot Permissions
`Manage Messages, Moderate Members, Kick, Ban, Manage Guild, Send Messages, Manage Channels, View Audit Log`

Invite URL: `https://discord.com/api/oauth2/authorize?client_id=CLIENT_ID&permissions=1099511627904&scope=bot%20applications.commands`

## Commands Permissions
- ModerateMembers → warn/warns/clearwarn/timeout/untimeout/mute/unmute/purge
- Administrator → clearwarns/automod/setup
- BanMembers → ban/unban
- KickMembers → kick

## Configuration
`/automod enable|disable|settings|set-timeout <level> <minutes>|addword <word> <level>|removeword|whitelist|blacklist|set-log #channel`
`/setup` creates #watan-logs and default settings.

## Testing Bypass
Try: `f u c k`, `F**K`, `fuuuck`, `f0ck`, `f‌uck` (zero-width), `ك ل ب`, `7abibi` etc. All detected via normalization.

## Production Deploy
`npm run build && npm start` - use PM2/systemd.
Migrate to Postgres: change `provider = "postgresql"` in schema.prisma and set DATABASE_URL.

## Performance
- In-memory TTL cache for words/settings (60s)
- Compiled regex per word sorted by length
- Async DB, try/catch, rate-limit safe
