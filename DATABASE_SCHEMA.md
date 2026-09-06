# Database Schema Documentation

SmartTranslate uses SQLite (via `better-sqlite3`) for persistent guild configuration, channel overrides, and translation lifecycle message mappings. The database uses Write-Ahead Logging (`PRAGMA journal_mode = WAL`) for concurrent read/write stability.

---

## Tables

### 1. `guild_settings`
Stores guild-level configuration and operational toggles.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `guild_id` | `TEXT` | `PRIMARY KEY` | Discord Guild Snowflake ID |
| `enabled` | `INTEGER` | `DEFAULT 1` | Global translation master switch for the server (1=enabled, 0=disabled) |
| `reaction_translation_enabled` | `INTEGER` | `DEFAULT 1` | Whether reaction-triggered translations are active |
| `allow_hindi` | `INTEGER` | `DEFAULT 1` | Whether translation into Hindi (`🇮🇳`) is allowed |
| `allow_english` | `INTEGER` | `DEFAULT 1` | Whether translation into English (`🇺🇸`) is allowed |
| `delete_on_reaction_remove` | `INTEGER` | `DEFAULT 1` | Whether translation message is deleted when the last reaction is removed |
| `max_message_length` | `INTEGER` | `DEFAULT 2000` | Maximum character length of messages accepted for translation |
| `created_at` | `INTEGER` | `NOT NULL` | Epoch timestamp (ms) when settings row was created |
| `updated_at` | `INTEGER` | `NOT NULL` | Epoch timestamp (ms) of the last update |

---

### 2. `channel_settings`
Stores per-channel overrides that supersede guild-level defaults.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `channel_id` | `TEXT` | `PRIMARY KEY` | Discord TextChannel Snowflake ID |
| `guild_id` | `TEXT` | `NOT NULL, REFERENCES guild_settings(guild_id)` | Owning Discord Guild Snowflake ID |
| `enabled` | `INTEGER` | `DEFAULT 1` | Channel-specific override (1=enabled, 0=disabled) |
| `created_at` | `INTEGER` | `NOT NULL` | Epoch timestamp (ms) when channel override was created |
| `updated_at` | `INTEGER` | `NOT NULL` | Epoch timestamp (ms) of the last update |

---

### 3. `translation_mappings`
Tracks relationships between original Discord messages and the bot's posted translation replies for idempotent reaction lifecycle management and reaction removal cleanup.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Internal row identifier |
| `source_message_id` | `TEXT` | `NOT NULL` | Original message Snowflake ID |
| `source_channel_id` | `TEXT` | `NOT NULL` | Channel Snowflake ID where both messages reside |
| `guild_id` | `TEXT` | `NOT NULL` | Guild Snowflake ID |
| `target_language` | `TEXT` | `NOT NULL` | Target ISO code (`en` or `hi`) |
| `translation_message_id` | `TEXT` | `NOT NULL` | Snowflake ID of the bot's translated reply |
| `requesting_user_id` | `TEXT` | `NOT NULL` | User Snowflake ID of the initial reactor |
| `created_at` | `INTEGER` | `NOT NULL` | Epoch timestamp (ms) when mapping was created |

---

## Indexes

```sql
CREATE INDEX IF NOT EXISTS idx_mapping_source ON translation_mappings(source_message_id, target_language);
CREATE INDEX IF NOT EXISTS idx_mapping_translation ON translation_mappings(translation_message_id);
```

- **`idx_mapping_source`**: Optimizes fast lookups when users add or remove reactions on a specific source message for a target language.
- **`idx_mapping_translation`**: Prevents the bot from processing reactions added directly to its own translation messages (loop prevention).
