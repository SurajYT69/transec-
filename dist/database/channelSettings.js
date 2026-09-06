"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChannelSettings = getChannelSettings;
exports.upsertChannelSettings = upsertChannelSettings;
exports.isChannelEnabled = isChannelEnabled;
const connection_1 = require("./connection");
const logger_1 = require("../utils/logger");
const logger = (0, logger_1.createLogger)('database:channelSettings');
/**
 * Retrieves the settings for a specific channel.
 * @param channelId The ID of the channel
 * @returns The channel settings or null if not found
 */
function getChannelSettings(channelId) {
    try {
        const db = (0, connection_1.getDatabase)();
        const stmt = db.prepare('SELECT * FROM channel_settings WHERE channel_id = ?');
        const row = stmt.get(channelId);
        if (!row)
            return null;
        return {
            channelId: row.channel_id,
            guildId: row.guild_id,
            enabled: Boolean(row.enabled),
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }
    catch (error) {
        logger.error({ err: error, channelId }, 'Failed to get channel settings');
        return null;
    }
}
/**
 * Updates or inserts channel settings.
 * @param settings Partial settings to update
 * @returns The updated or newly created channel settings
 */
function upsertChannelSettings(settings) {
    try {
        const db = (0, connection_1.getDatabase)();
        const existing = getChannelSettings(settings.channelId);
        const now = Date.now();
        if (existing) {
            const updated = { ...existing, ...settings, updatedAt: now };
            const stmt = db.prepare(`
        UPDATE channel_settings SET 
          enabled = ?,
          updated_at = ?
        WHERE channel_id = ?
      `);
            stmt.run(updated.enabled ? 1 : 0, updated.updatedAt, updated.channelId);
            return updated;
        }
        else {
            const newSettings = {
                channelId: settings.channelId,
                guildId: settings.guildId,
                enabled: settings.enabled ?? true,
                createdAt: now,
                updatedAt: now,
            };
            const stmt = db.prepare(`
        INSERT INTO channel_settings (
          channel_id, guild_id, enabled, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?)
      `);
            stmt.run(newSettings.channelId, newSettings.guildId, newSettings.enabled ? 1 : 0, newSettings.createdAt, newSettings.updatedAt);
            return newSettings;
        }
    }
    catch (error) {
        logger.error({ err: error, channelId: settings.channelId }, 'Failed to upsert channel settings');
        return {
            channelId: settings.channelId,
            guildId: settings.guildId,
            enabled: settings.enabled ?? true,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
    }
}
/**
 * Checks if a channel is enabled for translation.
 * @param channelId The ID of the channel
 * @param guildId The ID of the guild
 * @returns True if the channel is enabled, false otherwise
 */
function isChannelEnabled(channelId, guildId) {
    const settings = getChannelSettings(channelId);
    if (settings) {
        return settings.enabled;
    }
    return true; // Default to enabled if no settings exist
}
//# sourceMappingURL=channelSettings.js.map