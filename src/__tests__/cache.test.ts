import { describe, it, expect, beforeEach } from 'vitest';
import { TranslationCache } from '../translation/cache';
import { DetectedLanguage, TranslationResult } from '../types';

describe('TranslationCache', () => {
  let cache: TranslationCache;
  const mockResult: TranslationResult = {
    translatedText: "hello",
    sourceLanguage: DetectedLanguage.ROMAN_HINDI,
    targetLanguage: 'en',
    provider: 'test',
    cached: false,
    latencyMs: 100,
    confidence: 1.0
  };

  beforeEach(() => {
    cache = new TranslationCache(2, 1000); // Max 2 items, 1s TTL
  });

  it('sets and gets values correctly', () => {
    const key = cache.generateKey("namaste", DetectedLanguage.ROMAN_HINDI, 'en');
    cache.set(key, mockResult);
    
    const retrieved = cache.get(key);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.translatedText).toBe("hello");
    expect(retrieved?.cached).toBe(true);
  });

  it('returns null for missing keys', () => {
    expect(cache.get("nonexistent")).toBeNull();
  });

  it('returns null for expired TTL', async () => {
    const fastCache = new TranslationCache(10, 10); // 10ms TTL
    const key = fastCache.generateKey("namaste", DetectedLanguage.ROMAN_HINDI, 'en');
    fastCache.set(key, mockResult);
    
    await new Promise(r => setTimeout(r, 20));
    
    expect(fastCache.get(key)).toBeNull();
  });

  it('generates consistent keys', () => {
    const key1 = cache.generateKey("namaste", DetectedLanguage.ROMAN_HINDI, 'en');
    const key2 = cache.generateKey("namaste", DetectedLanguage.ROMAN_HINDI, 'en');
    const key3 = cache.generateKey("hello", DetectedLanguage.ENGLISH, 'hi');
    
    expect(key1).toBe(key2);
    expect(key1).not.toBe(key3);
  });

  it('evicts oldest items when at capacity (LRU)', () => {
    cache.set("key1", mockResult);
    cache.set("key2", mockResult);
    cache.set("key3", mockResult); // Should evict key1
    
    expect(cache.has("key1")).toBe(false);
    expect(cache.has("key2")).toBe(true);
    expect(cache.has("key3")).toBe(true);
  });

  it('clears all items', () => {
    cache.set("key1", mockResult);
    cache.clear();
    expect(cache.size).toBe(0);
    expect(cache.has("key1")).toBe(false);
  });

  it('tracks size correctly', () => {
    expect(cache.size).toBe(0);
    cache.set("key1", mockResult);
    expect(cache.size).toBe(1);
  });
});
