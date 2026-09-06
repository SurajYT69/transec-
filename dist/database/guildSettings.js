"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGuildSettings = getGuildSettings;
exports.upsertGuildSettings = upsertGuildSettings;
exports.getOrCreateGuildSettings = getOrCreateGuildSettings;
const connection_1 = require("./connection");
const logger_1 = require("../utils/logger");
const logger = (0, logger_1.createLogger)('database:guildSettings');
/**
 * Retrieves the settings for a specific guild.
 * @param guildId The ID of the guild
 * @returns The guild settings or null if not found
 */
function getGuildSettings(guildId) {
    try {
        const db = (0, connection_1.getDatabase)();
        const stmt = db.prepare('SELECT * FROM guild_settings WHERE guild_id = ?');
        const row = stmt.get(guildId);
        if (!row)
            return null;
        return {
            guildId: row.guild_id,
            enabled: Boolean(row.enabled),
            reactionTranslationEnabled: Boolean(row.reaction_translation_enabled),
            allowHindi: Boolean(row.allow_hindi),
            allowEnglish: Boolean(row.allow_english),
            deleteOnReactionRemove: Boolean(row.delete_on_reaction_remove),
            maxMessageLength: row.max_message_length,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }
    catch (error) {
        logger.error({ err: error, guildId }, 'Failed to get guild settings');
        return null;
    }
}
/**
 * Updates or inserts guild settings.
 * @param settings Partial settings to update
 * @returns The updated or newly created guild settings
 */
function upsertGuildSettings(settings) {
    try {
        const db = (0, connection_1.getDatabase)();
        const existing = getGuildSettings(settings.guildId);
        const now = Date.now();
        if (existing) {
            const updated = { ...existing, ...settings, updatedAt: now };
            const stmt = db.prepare(`
        UPDATE guild_settings SET 
          enabled = ?,
          reaction_translation_enabled = ?,
          allow_hindi = ?,
          allow_english = ?,
          delete_on_reaction_remove = ?,
          max_message_length = ?,
          updated_at = ?
        WHERE guild_id = ?
      `);
            stmt.run(updated.enabled ? 1 : 0, updated.reactionTranslationEnabled ? 1 : 0, updated.allowHindi ? 1 : 0, updated.allowEnglish ? 1 : 0, updated.deleteOnReactionRemove ? 1 : 0, updated.maxMessageLength, updated.updatedAt, updated.guildId);
            return updated;
        }
        else {
            const defaultSettings = getDefaultGuildSettings(settings.guildId);
            const newSettings = { ...defaultSettings, ...settings, createdAt: now, updatedAt: now };
            const stmt = db.prepare(`
        INSERT INTO guild_settings (
          guild_id, enabled, reaction_translation_enabled, allow_hindi, allow_english, 
          delete_on_reaction_remove, max_message_length, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
            stmt.run(newSettings.guildId, newSettings.enabled ? 1 : 0, newSettings.reactionTranslationEnabled ? 1 : 0, newSettings.allowHindi ? 1 : 0, newSettings.allowEnglish ? 1 : 0, newSettings.deleteOnReactionRemove ? 1 : 0, newSettings.maxMessageLength, newSettings.createdAt, newSettings.updatedAt);
            return newSettings;
        }
    }
    catch (error) {
        logger.error({ err: error, guildId: settings.guildId }, 'Failed to upsert guild settings');
        return { ...getDefaultGuildSettings(settings.guildId), ...settings };
    }
}
/**
 * Retrieves guild settings or creates them with defaults if they don't exist.
 * @param guildId The ID of the guild
 * @returns The existing or newly created guild settings
 */
function getOrCreateGuildSettings(guildId) {
    const existing = getGuildSettings(guildId);
    if (existing) {
        return existing;
    }
    return upsertGuildSettings({ guildId });
}
function getDefaultGuildSettings(guildId) {
    const now = Date.now();
    return {
        guildId,
        enabled: true,
        reactionTranslationEnabled: true,
        allowHindi: true,
        allowEnglish: true,
        deleteOnReactionRemove: true,
        maxMessageLength: 2000,
        createdAt: now,
        updatedAt: now,
    };
}
//# sourceMappingURL=guildSettings.js.map