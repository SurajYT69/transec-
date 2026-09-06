"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metrics = void 0;
class MetricsCollector {
    static instance;
    metrics = {
        translationsRequested: 0,
        translationsCompleted: 0,
        translationsFailed: 0,
        cacheHits: 0,
        cacheMisses: 0,
        providerLatencyMs: [],
        providerFailures: new Map(),
        sourceLanguageDistribution: new Map(),
        targetLanguageDistribution: new Map(),
        duplicatesPrevented: 0,
    };
    constructor() { }
    static getInstance() {
        if (!MetricsCollector.instance) {
            MetricsCollector.instance = new MetricsCollector();
        }
        return MetricsCollector.instance;
    }
    recordTranslationRequested() {
        this.metrics.translationsRequested++;
    }
    recordTranslationCompleted() {
        this.metrics.translationsCompleted++;
    }
    recordTranslationFailed() {
        this.metrics.translationsFailed++;
    }
    recordCacheHit() {
        this.metrics.cacheHits++;
    }
    recordCacheMiss() {
        this.metrics.cacheMisses++;
    }
    recordDuplicatePrevented() {
        this.metrics.duplicatesPrevented++;
    }
    recordProviderLatency(latency) {
        this.metrics.providerLatencyMs.push(latency);
        if (this.metrics.providerLatencyMs.length > 100) {
            this.metrics.providerLatencyMs.shift();
        }
    }
    recordProviderFailure(providerName) {
        const current = this.metrics.providerFailures.get(providerName) || 0;
        this.metrics.providerFailures.set(providerName, current + 1);
    }
    recordSourceLanguage(language) {
        const current = this.metrics.sourceLanguageDistribution.get(language) || 0;
        this.metrics.sourceLanguageDistribution.set(language, current + 1);
    }
    recordTargetLanguage(language) {
        const current = this.metrics.targetLanguageDistribution.get(language) || 0;
        this.metrics.targetLanguageDistribution.set(language, current + 1);
    }
    getSnapshot() {
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
    reset() {
        this.metrics = {
            translationsRequested: 0,
            translationsCompleted: 0,
            translationsFailed: 0,
            cacheHits: 0,
            cacheMisses: 0,
            providerLatencyMs: [],
            providerFailures: new Map(),
            sourceLanguageDistribution: new Map(),
            targetLanguageDistribution: new Map(),
            duplicatesPrevented: 0,
        };
    }
}
exports.metrics = MetricsCollector.getInstance();
//# sourceMappingURL=metrics.js.map