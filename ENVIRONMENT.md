# Environment Variables

SmartTranslate relies on several environment variables. Copy `.env.example` to `.env` and fill them out.

## Discord
- `DISCORD_TOKEN` **(Required)**
  - Description: Your Discord Bot Token.
  - Example: `MTA...`
- `DISCORD_CLIENT_ID` **(Required)**
  - Description: The Discord Application Client ID.
  - Example: `123456789012345678`

## Translation Providers
- `GEMINI_API_KEY` *(Optional)*
  - Description: API key for Google Gemini (Primary provider).
- `GEMINI_MODEL` *(Optional)*
  - Description: The Gemini model to use.
  - Default: `gemini-2.0-flash`
- `AZURE_TRANSLATOR_KEY` *(Optional)*
  - Description: API key for Azure Cognitive Services Translator.
- `AZURE_TRANSLATOR_REGION` *(Optional)*
  - Description: Azure region.
  - Default: `eastus`
- `AZURE_TRANSLATOR_ENDPOINT` *(Optional)*
  - Description: Azure endpoint.
  - Default: `https://api.cognitive.microsofttranslator.com`

## Database
- `DATABASE_PATH` *(Optional)*
  - Description: File path to the SQLite database.
  - Default: `./data/smarttranslate.db`

## Logging
- `LOG_LEVEL` *(Optional)*
  - Description: Pino log level (`fatal`, `error`, `warn`, `info`, `debug`, `trace`).
  - Default: `info`

## Rate Limits
- `RATE_LIMIT_PER_USER` *(Optional)*
  - Description: Max translation requests per user per window.
  - Default: `10`
- `RATE_LIMIT_PER_GUILD` *(Optional)*
  - Description: Max translation requests per guild per window.
  - Default: `50`
- `RATE_LIMIT_WINDOW_SECONDS` *(Optional)*
  - Description: Time window for rate limiting in seconds.
  - Default: `60`

## Cache
- `CACHE_MAX_SIZE` *(Optional)*
  - Description: Max entries in the LRU cache.
  - Default: `1000`
- `CACHE_TTL_SECONDS` *(Optional)*
  - Description: Time-to-live for cache entries.
  - Default: `3600`

## Translation Engine
- `MAX_MESSAGE_LENGTH` *(Optional)*
  - Description: Maximum characters allowed for a translation request.
  - Default: `2000`
- `TRANSLATION_TIMEOUT_MS` *(Optional)*
  - Description: Maximum time allowed for provider API calls before aborting.
  - Default: `10000`
