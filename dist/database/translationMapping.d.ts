import { TargetLanguage, TranslationMapping } from '../types';
/**
 * Creates a new translation mapping in the database.
 * @param mapping The mapping data to insert
 * @returns The created mapping with its auto-incremented ID
 */
export declare function createMapping(mapping: Omit<TranslationMapping, 'id'>): TranslationMapping;
/**
 * Finds a translation mapping by the original message ID and the target language.
 * @param sourceMessageId The ID of the original message
 * @param targetLanguage The target language of the translation
 * @returns The mapping if found, otherwise null
 */
export declare function findMapping(sourceMessageId: string, targetLanguage: TargetLanguage): TranslationMapping | null;
/**
 * Finds a translation mapping by the translated message ID.
 * @param translationMessageId The ID of the translated message
 * @returns The mapping if found, otherwise null
 */
export declare function findMappingByTranslationId(translationMessageId: string): TranslationMapping | null;
/**
 * Deletes a translation mapping for a specific target language.
 * @param sourceMessageId The ID of the original message
 * @param targetLanguage The target language to delete
 * @returns True if a mapping was deleted, false otherwise
 */
export declare function deleteMapping(sourceMessageId: string, targetLanguage: TargetLanguage): boolean;
/**
 * Deletes all translation mappings for a given source message.
 * @param sourceMessageId The ID of the original message
 * @returns The number of mappings deleted
 */
export declare function deleteMappingsForMessage(sourceMessageId: string): number;
//# sourceMappingURL=translationMapping.d.ts.map