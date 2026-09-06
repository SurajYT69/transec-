# SmartTranslate

A production-grade Discord bot for seamless **Hindi/Hinglish ↔ English** translation via flag reactions.

---

## How It Works

> A Discord user writes normally. Another user reacts with 🇮🇳 or 🇺🇸. The bot instantly translates the original message into the selected language.

### Example 1: Hinglish → English

**User sends:**
> bhai yaar mere man nhi kar rha aaj jane ka bahar

**Someone reacts: 🇺🇸**

**Bot replies:**
> 🇺🇸 **English**
> Bro, I really don't feel like going out today.

### Example 2: English → Hindi

**User sends:**
> I really don't feel like going out today, bro.

**Someone reacts: 🇮🇳**

**Bot replies:**
> 🇮🇳 **Hindi**
> Bhai, aaj bahar jaane ka bilkul mann nahi hai.

---

## Quick Start

### Prerequisites
- **Node.js** v20+ 
- A **Discord Bot** application ([Discord Developer Portal](https://discord.com/developers/applications))
- At least one translation provider API key (**Google Gemini** recommended)

### Setup

```bash
# 1. Clone and install
git clone <repository_url>
cd trans
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your Discord bot token, client ID, and at least one provider key

# 3. Deploy slash commands to Discord
npm run deploy:commands

# 4. Start the bot
npm run dev     # Development (with hot reload)
npm start       # Production (compiled)
```

### Required Discord Bot Settings

In your [Discord Developer Portal](https://discord.com/developers/applications):

1. **Bot → Privileged Gateway Intents:** Enable **Message Content Intent**
2. **OAuth2 → URL Generator:** Select scopes `bot` + `applications.commands`
3. **Bot Permissions:** `330816` (View Channel, Send Messages, Read Message History, Add Reactions, Use External Emojis)

---

## Features

### 🇮🇳 Hinglish First-Class Support
Unlike standard translation APIs, SmartTranslate understands Romanized Hindi typed in Latin script — slang, abbreviations, missing vowels, mixed languages:

| Input | Translation |
|-------|-------------|
| `bhai yaar mere man nhi kar rha` | Bro, I really don't feel like it |
| `kya scene hai` | What's going on? |
| `kal aa rha h?` | Are you coming tomorrow? |
| `mereko ye samajh nahi aaya` | I didn't understand this |
| `bhai today mera mood nahi hai` | Bro, I'm not in the mood today |

### 🔁 Reaction-Based Translation
- **🇺🇸** → Translate to English
- **🇮🇳** → Translate to Hindi

### 📋 Context Menu Translation
Right-click any message → **Apps** → **Translate to English** / **Translate to Hindi**

Works even on messages where reactions are disabled.

### ⚡ Multi-User Deduplication
50 users react 🇺🇸 on the same message? Only **one** translation request is made.

### 🧹 Clean Channel Experience
- Translations reply to the original message
- Removing the last reaction deletes the translation
- No spam, no embeds, no branding on every message
- Bot messages are never re-translated (loop prevention)

### 🏗️ Provider Failover
Primary provider fails? Automatic fallback with circuit breaker:
```
Gemini (primary) → Azure (fallback) → Graceful error
```

### 💾 Smart Caching
SHA-256 keyed LRU cache prevents duplicate API calls. Same message = one provider request regardless of how many users react.

---

## Commands

| Command | Description | Permission |
|---------|-------------|------------|
| `/translate status` | Bot health, provider status, cache stats | Everyone |
| `/translate settings` | Current server/channel translation settings | Everyone |
| `/translate enable` | Enable translation in current channel | Manage Channels |
| `/translate disable` | Disable translation in current channel | Manage Channels |

---

## Architecture

```
Discord Reaction Event
    ↓
Event Handler (fetch message, validate)
    ↓
Translation Service (rate limit, deduplicate)
    ↓
Translation Pipeline
    ├── Preprocess (trim, validate length)
    ├── Detect (script analysis → lexicon → heuristics)
    ├── Validate (source ≠ target check)
    ├── Normalize (Hinglish abbreviation expansion)
    ├── Tokenize (protect mentions, URLs, emoji, code)
    ├── Cache Check (SHA-256 key lookup)
    ├── Translate (provider router with circuit breaker)
    ├── Restore (replace token placeholders)
    ├── Postprocess (trim, cleanup)
    └── Cache Store
    ↓
Discord Reply (formatted translation)
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed documentation.

---

## Provider Setup

### Google Gemini (Primary — Recommended)

Best quality for Hinglish/Romanized Hindi. ~$0.075/1M tokens.

1. Get an API key at [Google AI Studio](https://aistudio.google.com/)
2. Set `GEMINI_API_KEY` in `.env`

### Azure Translator (Fallback)

Good for Devanagari Hindi. 2M chars/month free.

1. Create Azure Cognitive Services resource
2. Set `AZURE_TRANSLATOR_KEY` and `AZURE_TRANSLATOR_REGION` in `.env`

See [ENVIRONMENT.md](ENVIRONMENT.md) for all configuration options.

---

## Required Discord Permissions & Intents

### Gateway Intents (Privileged)
| Intent | Required | Reason |
|--------|----------|--------|
| `MESSAGE_CONTENT` | **Yes** | Read message text for translation |
| `GUILD_MESSAGE_REACTIONS` | **Yes** | Receive reaction events |
| `GUILD_MESSAGES` | **Yes** | Populate message cache |
| `GUILDS` | **Yes** | Guild context |

### Bot Permissions
| Permission | Reason |
|-----------|--------|
| View Channel | Access message channels |
| Send Messages | Send translation replies |
| Read Message History | Fetch reacted messages |
| Add Reactions | Optional: acknowledgment reactions |
| Use External Emojis | Support custom emoji preservation |

---

## Development

```bash
# Run tests
npm test

# Run tests with watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Build for production
npm run build

# Run provider benchmark
npm run benchmark

# Deploy Discord commands
npm run deploy:commands
```

See [TESTING.md](TESTING.md) for testing documentation.

---

## Privacy & Security

- Translation API calls process user message content — only the text needed for translation
- Translations are cached in-memory (not persisted to disk) with TTL expiration
- Database stores only IDs and settings, not message content
- API keys are never exposed in Discord messages or logs
- Rate limiting prevents abuse

---

## Known Limitations (V1)

- Only Hindi/Hinglish ↔ English (no other languages)
- No voice translation
- No image/OCR translation
- Short ambiguous messages (1-2 words like "ok", "bro") may not trigger translation
- Azure fallback quality for Hinglish is lower than Gemini

---

## License

MIT License
