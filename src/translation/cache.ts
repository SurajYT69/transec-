import { createHash } from 'crypto';
import { CacheEntry, TranslationResult, DetectedLanguage, TargetLanguage } from '../types';

/**
 * In-memory LRU cache for translations.
 */
export class TranslationCache {
  private cache: Map<string, CacheEntry<TranslationResult>>;
  private maxSize: number;
  private ttlMs: number;

  constructor(maxSize: number = 1000, ttlMs: number = 3600000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
  }

  /**
   * Generates a unique cache key based on the text and languages.
   */
  public generateKey(text: string, sourceLanguage: DetectedLanguage, targetLanguage: TargetLanguage): string {
    const hash = createHash('sha256');
    hash.update(`${sourceLanguage}:${targetLanguage}:${text}`);
    return hash.digest('hex');
  }

  /**
   * Retrieves a translation from the cache if it exists and hasn't expired.
   */
  public get(key: string): TranslationResult | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;

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
  public set(key: string, result: TranslationResult): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    const entry: CacheEntry<TranslationResult> = {
      value: { ...result, cached: true },
      createdAt: Date.now(),
      ttl: this.ttlMs
    };

    this.cache.set(key, entry);
  }

  /**
   * Checks if an unexpired cache entry exists for the given key.
   */
  public has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Clears all cached translations.
   */
  public clear(): void {
    this.cache.clear();
  }

  /**
   * Gets the current number of cached items.
   */
  public get size(): number {
    return this.cache.size;
  }

  /** Returns the current size of the cache */
  public getSize(): number {
    return this.cache.size;
  }
}
