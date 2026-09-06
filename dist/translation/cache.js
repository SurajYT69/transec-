"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TranslationCache = void 0;
const crypto_1 = require("crypto");
/**
 * In-memory LRU cache for translations.
 */
class TranslationCache {
    cache;
    maxSize;
    ttlMs;
    constructor(maxSize = 1000, ttlMs = 3600000) {
        this.cache = new Map();
        this.maxSize = maxSize;
        this.ttlMs = ttlMs;
    }
    /**
     * Generates a unique cache key based on the text and languages.
     */
    generateKey(text, sourceLanguage, targetLanguage) {
        const hash = (0, crypto_1.createHash)('sha256');
        hash.update(`${sourceLanguage}:${targetLanguage}:${text}`);
        return hash.digest('hex');
    }
    /**
     * Retrieves a translation from the cache if it exists and hasn't expired.
     */
    get(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return null;
        if (Date.now() - entry.createdAt > entry.ttl) {
            this.cache.delete(key);
            return null;
        }
        // Refresh position for LRU
        this.cache.delete(key);
        this.cache.set(key, entry);
        return entry.value;
    }
    /**
     * Caches a translation result. Evicts the oldest entry if max size is exceeded.
     */
    set(key, result) {
        if (this.cache.has(key)) {
            this.cache.delete(key);
        }
        else if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey !== undefined) {
                this.cache.delete(firstKey);
            }
        }
        const entry = {
            value: { ...result, cached: true },
            createdAt: Date.now(),
            ttl: this.ttlMs
        };
        this.cache.set(key, entry);
    }
    /**
     * Checks if an unexpired cache entry exists for the given key.
     */
    has(key) {
        return this.get(key) !== null;
    }
    /**
     * Clears all cached translations.
     */
    clear() {
        this.cache.clear();
    }
    /**
     * Gets the current number of cached items.
     */
    get size() {
        return this.cache.size;
    }
    /** Returns the current size of the cache */
    getSize() {
        return this.cache.size;
    }
}
exports.TranslationCache = TranslationCache;
//# sourceMappingURL=cache.js.map