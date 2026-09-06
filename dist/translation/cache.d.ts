import { TranslationResult, DetectedLanguage, TargetLanguage } from '../types';
/**
 * In-memory LRU cache for translations.
 */
export declare class TranslationCache {
    private cache;
    private maxSize;
    private ttlMs;
    constructor(maxSize?: number, ttlMs?: number);
    /**
     * Generates a unique cache key based on the text and languages.
     */
    generateKey(text: string, sourceLanguage: DetectedLanguage, targetLanguage: TargetLanguage): string;
    /**
     * Retrieves a translation from the cache if it exists and hasn't expired.
     */
    get(key: string): TranslationResult | null;
    /**
     * Caches a translation result. Evicts the oldest entry if max size is exceeded.
     */
    set(key: string, result: TranslationResult): void;
    /**
     * Checks if an unexpired cache entry exists for the given key.
     */
    has(key: string): boolean;
    /**
     * Clears all cached translations.
     */
    clear(): void;
    /**
     * Gets the current number of cached items.
     */
    get size(): number;
    /** Returns the current size of the cache */
    getSize(): number;
}
//# sourceMappingURL=cache.d.ts.map