"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMapping = createMapping;
exports.findMapping = findMapping;
exports.findMappingByTranslationId = findMappingByTranslationId;
exports.deleteMapping = deleteMapping;
exports.deleteMappingsForMessage = deleteMappingsForMessage;
const connection_1 = require("./connection");
const logger_1 = require("../utils/logger");
const logger = (0, logger_1.createLogger)('database:translationMapping');
/**
 * Creates a new translation mapping in the database.
 * @param mapping The mapping data to insert
 * @returns The created mapping with its auto-incremented ID
 */
function createMapping(mapping) {
    try {
        const db = (0, connection_1.getDatabase)();
        const stmt = db.prepare(`
      INSERT INTO translation_mappings (
        source_message_id, source_channel_id, guild_id, target_language, 
        translation_message_id, requesting_user_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
        const info = stmt.run(mapping.sourceMessageId, mapping.sourceChannelId, mapping.guildId, mapping.targetLanguage, mapping.translationMessageId, mapping.requestingUserId, mapping.createdAt);
        return {
            ...mapping,
            id: info.lastInsertRowid,
        };
    }
    catch (error) {
        logger.error({ err: error, sourceMessageId: mapping.sourceMessageId }, 'Failed to create translation mapping');
        return { ...mapping, id: 0 };
    }
}
/**
 * Finds a translation mapping by the original message ID and the target language.
 * @param sourceMessageId The ID of the original message
 * @param targetLanguage The target language of the translation
 * @returns The mapping if found, otherwise null
 */
function findMapping(sourceMessageId, targetLanguage) {
    try {
        const db = (0, connection_1.getDatabase)();
        const stmt = db.prepare('SELECT * FROM translation_mappings WHERE source_message_id = ? AND target_language = ?');
        const row = stmt.get(sourceMessageId, targetLanguage);
        if (!row)
            return null;
        return mapRowToTranslationMapping(row);
    }
    catch (error) {
        logger.error({ err: error, sourceMessageId }, 'Failed to find mapping');
        return null;
    }
}
/**
 * Finds a translation mapping by the translated message ID.
 * @param translationMessageId The ID of the translated message
 * @returns The mapping if found, otherwise null
 */
function findMappingByTranslationId(translationMessageId) {
    try {
        const db = (0, connection_1.getDatabase)();
        const stmt = db.prepare('SELECT * FROM translation_mappings WHERE translation_message_id = ?');
        const row = stmt.get(translationMessageId);
        if (!row)
            return null;
        return mapRowToTranslationMapping(row);
    }
    catch (error) {
        logger.error({ err: error, translationMessageId }, 'Failed to find mapping by translation id');
        return null;
    }
}
/**
 * Deletes a translation mapping for a specific target language.
 * @param sourceMessageId The ID of the original message
 * @param targetLanguage The target language to delete
 * @returns True if a mapping was deleted, false otherwise
 */
function deleteMapping(sourceMessageId, targetLanguage) {
    try {
        const db = (0, connection_1.getDatabase)();
        const stmt = db.prepare('DELETE FROM translation_mappings WHERE source_message_id = ? AND target_language = ?');
        const info = stmt.run(sourceMessageId, targetLanguage);
        return info.changes > 0;
    }
    catch (error) {
        logger.error({ err: error, sourceMessageId }, 'Failed to delete mapping');
        return false;
    }
}
/**
 * Deletes all translation mappings for a given source message.
 * @param sourceMessageId The ID of the original message
 * @returns The number of mappings deleted
 */
function deleteMappingsForMessage(sourceMessageId) {
    try {
        const db = (0, connection_1.getDatabase)();
        const stmt = db.prepare('DELETE FROM translation_mappings WHERE source_message_id = ?');
        const info = stmt.run(sourceMessageId);
        return info.changes;
    }
    catch (error) {
        logger.error({ err: error, sourceMessageId }, 'Failed to delete mappings for message');
        return 0;
    }
}
function mapRowToTranslationMapping(row) {
    return {
        id: row.id,
        sourceMessageId: row.source_message_id,
        sourceChannelId: row.source_channel_id,
        guildId: row.guild_id,
        targetLanguage: row.target_language,
        translationMessageId: row.translation_message_id,
        requestingUserId: row.requesting_user_id,
        createdAt: row.created_at,
    };
}
//# sourceMappingURL=translationMapping.js.map