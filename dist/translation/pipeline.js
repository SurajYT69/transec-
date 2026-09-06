"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TranslationPipeline = void 0;
const types_1 = require("../types");
const config_1 = require("../config");
const detection_1 = require("./detection");
const normalizer_1 = require("./normalizer");
const tokenProtector_1 = require("./tokenProtector");
const logger_1 = require("../utils/logger");
const metrics_1 = require("../utils/metrics");
const logger = (0, logger_1.createLogger)('pipeline');
/**
 * Main translation pipeline that orchestrates the detection, normalization,
 * tokenization, caching, and provider routing stages.
 */
class TranslationPipeline {
    cache;
    router;
    constructor(router, cache) {
        this.router = router;
        this.cache = cache;
    }
    /**
     * Executes the full translation pipeline.
     * @param context The pipeline context for the current translation task.
     * @returns A promise resolving to the fully updated pipeline context.
     */
    async execute(context) {
        try {
            metrics_1.metrics.recordTranslationRequested();
            this.preprocess(context);
            if (!context.shouldTranslate)
                return context;
            this.detect(context);
            this.validate(context);
            if (!context.shouldTranslate)
                return context;
            this.normalize(context);
            this.tokenize(context);
            if (this.checkCache(context)) {
                metrics_1.metrics.recordCacheHit();
                this.restore(context);
                this.postprocess(context);
                metrics_1.metrics.recordTranslationCompleted();
                return context;
            }
            metrics_1.metrics.recordCacheMiss();
            await this.executeTranslation(context);
            this.restore(context);
            this.postprocess(context);
            this.storeCache(context);
            metrics_1.metrics.recordTranslationCompleted();
            if (context.translation) {
                metrics_1.metrics.recordProviderLatency(context.translation.latencyMs);
            }
            return context;
        }
        catch (error) {
            metrics_1.metrics.recordTranslationFailed();
            logger.error({ error: error.message, text: context.originalText.slice(0, 30) }, 'Pipeline error');
            throw error;
        }
    }
    preprocess(context) {
        logger.debug('Stage: PREPROCESS');
        context.originalText = context.originalText.trim();
        if (!context.originalText) {
            context.shouldTranslate = false;
            context.skipReason = 'Empty text';
        }
        else if (context.originalText.length > config_1.config.translation.maxMessageLength) {
            context.shouldTranslate = false;
            context.skipReason = 'Message too long';
        }
    }
    detect(context) {
        logger.debug('Stage: DETECT');
        try {
            context.detection = (0, detection_1.detectLanguage)(context.originalText);
            if (context.detection) {
                metrics_1.metrics.recordSourceLanguage(context.detection.language);
                metrics_1.metrics.recordTargetLanguage(context.targetLanguage);
            }
        }
        catch (err) {
            logger.warn({ error: err.message }, 'Language detection failed');
        }
    }
    validate(context) {
        logger.debug('Stage: VALIDATE');
        if (context.detection && !(0, detection_1.shouldTranslate)(context.detection, context.targetLanguage)) {
            context.shouldTranslate = false;
            context.skipReason = 'Translation not required (source matches target or unsupported)';
        }
    }
    normalize(context) {
        logger.debug('Stage: NORMALIZE');
        try {
            if (context.detection?.language === types_1.DetectedLanguage.ROMAN_HINDI ||
                context.detection?.language === types_1.DetectedLanguage.HINGLISH_MIXED) {
                context.normalization = (0, normalizer_1.normalizeHinglish)(context.originalText);
            }
        }
        catch (err) {
            logger.warn({ error: err.message }, 'Normalization failed, continuing without it');
        }
    }
    tokenize(context) {
        logger.debug('Stage: TOKENIZE');
        try {
            const textToTokenize = context.normalization?.normalizedText || context.originalText;
            context.tokenized = (0, tokenProtector_1.tokenizeMessage)(textToTokenize);
        }
        catch (err) {
            logger.warn({ error: err.message }, 'Tokenization failed, continuing with raw text');
            context.tokenized = {
                processedText: context.normalization?.normalizedText || context.originalText,
                tokens: [],
            };
        }
    }
    checkCache(context) {
        logger.debug('Stage: CACHE CHECK');
        if (!context.detection || !context.tokenized)
            return false;
        const key = this.cache.generateKey(context.tokenized.processedText, context.detection.language, context.targetLanguage);
        const cachedResult = this.cache.get(key);
        if (cachedResult) {
            logger.debug('Cache hit');
            context.translation = { ...cachedResult, cached: true };
            return true;
        }
        logger.debug('Cache miss');
        return false;
    }
    async executeTranslation(context) {
        logger.debug('Stage: TRANSLATE');
        if (!context.tokenized || !context.detection) {
            throw new Error('Missing tokenized text or detection result required for translation');
        }
        const request = {
            text: context.tokenized.processedText,
            sourceLanguage: context.detection.language,
            targetLanguage: context.targetLanguage,
            normalizedText: context.normalization?.normalizedText,
        };
        context.translation = await this.router.translate(request);
    }
    restore(context) {
        logger.debug('Stage: RESTORE');
        if (context.translation && context.tokenized) {
            try {
                context.translation.translatedText = (0, tokenProtector_1.restoreTokens)(context.translation.translatedText, context.tokenized.tokens);
            }
            catch (err) {
                logger.warn({ error: err.message }, 'Token restoration failed');
            }
        }
    }
    postprocess(context) {
        logger.debug('Stage: POSTPROCESS');
        if (context.translation) {
            context.translation.translatedText = context.translation.translatedText.trim();
        }
    }
    storeCache(context) {
        logger.debug('Stage: CACHE STORE');
        if (context.translation && context.detection && context.tokenized) {
            const key = this.cache.generateKey(context.tokenized.processedText, context.detection.language, context.targetLanguage);
            this.cache.set(key, context.translation);
        }
    }
}
exports.TranslationPipeline = TranslationPipeline;
//# sourceMappingURL=pipeline.js.map