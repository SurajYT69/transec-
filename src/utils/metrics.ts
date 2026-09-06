import { DetectedLanguage, TargetLanguage, TranslationMetrics } from '../types';

class MetricsCollector {
  private static instance: MetricsCollector;
  
  private metrics: TranslationMetrics = {
    translationsRequested: 0,
    translationsCompleted: 0,
    translationsFailed: 0,
    cacheHits: 0,
    cacheMisses: 0,
    providerLatencyMs: [],
    providerFailures: new Map<string, number>(),
    sourceLanguageDistribution: new Map<DetectedLanguage, number>(),
    targetLanguageDistribution: new Map<TargetLanguage, number>(),
    duplicatesPrevented: 0,
  };

  private constructor() {}

  public static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  public recordTranslationRequested(): void {
    this.metrics.translationsRequested++;
  }

  public recordTranslationCompleted(): void {
    this.metrics.translationsCompleted++;
  }

  public recordTranslationFailed(): void {
    this.metrics.translationsFailed++;
  }

  public recordCacheHit(): void {
    this.metrics.cacheHits++;
  }

  public recordCacheMiss(): void {
    this.metrics.cacheMisses++;
  }

  public recordDuplicatePrevented(): void {
    this.metrics.duplicatesPrevented++;
  }

  public recordProviderLatency(latency: number): void {
    this.metrics.providerLatencyMs.push(latency);
    if (this.metrics.providerLatencyMs.length > 100) {
      this.metrics.providerLatencyMs.shift();
    }
  }

  public recordProviderFailure(providerName: string): void {
    const current = this.metrics.providerFailures.get(providerName) || 0;
    this.metrics.providerFailures.set(providerName, current + 1);
  }

  public recordSourceLanguage(language: DetectedLanguage): void {
    const current = this.metrics.sourceLanguageDistribution.get(language) || 0;
    this.metrics.sourceLanguageDistribution.set(language, current + 1);
  }

  public recordTargetLanguage(language: TargetLanguage): void {
    const current = this.metrics.targetLanguageDistribution.get(language) || 0;
    this.metrics.targetLanguageDistribution.set(language, current + 1);
  }

  public getSnapshot(): TranslationMetrics {
    // Return a deep copy to prevent mutation
    return {
      translationsRequested: this.metrics.translationsRequested,
      translationsCompleted: this.metrics.translationsCompleted,
      translationsFailed: this.metrics.translationsFailed,
      cacheHits: this.metrics.cacheHits,
      cacheMisses: this.metrics.cacheMisses,
      providerLatencyMs: [...this.metrics.providerLatencyMs],
      providerFailures: new Map(this.metrics.providerFailures),
      sourceLanguageDistribution: new Map(this.metrics.sourceLanguageDistribution),
      targetLanguageDistribution: new Map(this.metrics.targetLanguageDistribution),
      duplicatesPrevented: this.metrics.duplicatesPrevented,
    };
  }

  public reset(): void {
    this.metrics = {
      translationsRequested: 0,
      translationsCompleted: 0,
      translationsFailed: 0,
      cacheHits: 0,
      cacheMisses: 0,
      providerLatencyMs: [],
      providerFailures: new Map<string, number>(),
      sourceLanguageDistribution: new Map<DetectedLanguage, number>(),
      targetLanguageDistribution: new Map<TargetLanguage, number>(),
      duplicatesPrevented: 0,
    };
  }
}

export const metrics = MetricsCollector.getInstance();
