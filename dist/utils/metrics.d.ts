import { DetectedLanguage, TargetLanguage, TranslationMetrics } from '../types';
declare class MetricsCollector {
    private static instance;
    private metrics;
    private constructor();
    static getInstance(): MetricsCollector;
    recordTranslationRequested(): void;
    recordTranslationCompleted(): void;
    recordTranslationFailed(): void;
    recordCacheHit(): void;
    recordCacheMiss(): void;
    recordDuplicatePrevented(): void;
    recordProviderLatency(latency: number): void;
    recordProviderFailure(providerName: string): void;
    recordSourceLanguage(language: DetectedLanguage): void;
    recordTargetLanguage(language: TargetLanguage): void;
    getSnapshot(): TranslationMetrics;
    reset(): void;
}
export declare const metrics: MetricsCollector;
export {};
//# sourceMappingURL=metrics.d.ts.map