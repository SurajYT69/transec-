import { getDatabase } from './connection';
import { TargetLanguage, TranslationMapping } from '../types';
import { createLogger } from '../utils/logger';

const logger = createLogger('database:translationMapping');

/**
 * Creates a new translation mapping in the database.
 * @param mapping The mapping data to insert
 * @returns The created mapping with its auto-incremented ID
 */
export function createMapping(mapping: Omit<TranslationMapping, 'id'>): TranslationMapping {
  try {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO translation_mappings (
        source_message_id, source_channel_id, guild_id, target_language, 
        translation_message_id, requesting_user_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(
      mapping.sourceMessageId,
      mapping.sourceChannelId,
      mapping.guildId,
      mapping.targetLanguage,
      mapping.translationMessageId,
      mapping.requestingUserId,
      mapping.createdAt
    );

    return {
      ...mapping,
      id: info.lastInsertRowid as number,
    };
  } catch (error) {
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
export function findMapping(sourceMessageId: string, targetLanguage: TargetLanguage): TranslationMapping | null {
  try {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM translation_mappings WHERE source_message_id = ? AND target_language = ?');
    const row = stmt.get(sourceMessageId, targetLanguage) as any;

    if (!row) return null;

    return mapRowToTranslationMapping(row);
  } catch (error) {
    logger.error({ err: error, sourceMessageId }, 'Failed to find mapping');
    return null;
  }
}

/**
 * Finds a translation mapping by the translated message ID.
 * @param translationMessageId The ID of the translated message
 * @returns The mapping if found, otherwise null
 */
export function findMappingByTranslationId(translationMessageId: string): TranslationMapping | null {
  try {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM translation_mappings WHERE translation_message_id = ?');
    const row = stmt.get(translationMessageId) as any;

    if (!row) return null;

    return mapRowToTranslationMapping(row);
  } catch (error) {
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
export function deleteMapping(sourceMessageId: string, targetLanguage: TargetLanguage): boolean {
  try {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM translation_mappings WHERE source_message_id = ? AND target_language = ?');
    const info = stmt.run(sourceMessageId, targetLanguage);
    return info.changes > 0;
  } catch (error) {
    logger.error({ err: error, sourceMessageId }, 'Failed to delete mapping');
    return false;
  }
}

/**
 * Deletes all translation mappings for a given source message.
 * @param sourceMessageId The ID of the original message
 * @returns The number of mappings deleted
 */
export function deleteMappingsForMessage(sourceMessageId: string): number {
  try {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM translation_mappings WHERE source_message_id = ?');
    const info = stmt.run(sourceMessageId);
    return info.changes;
  } catch (error) {
    logger.error({ err: error, sourceMessageId }, 'Failed to delete mappings for message');
    return 0;
  }
}

function mapRowToTranslationMapping(row: any): TranslationMapping {
  return {
    id: row.id,
    sourceMessageId: row.source_message_id,
    sourceChannelId: row.source_channel_id,
    guildId: row.guild_id,
    targetLanguage: row.target_language as TargetLanguage,
    translationMessageId: row.translation_message_id,
    requestingUserId: row.requesting_user_id,
    createdAt: row.created_at,
  };
}
