import { PipelineContext, DetectedLanguage } from '../types';
import { config } from '../config';
import { detectLanguage, shouldTranslate } from './detection';
import { normalizeHinglish } from './normalizer';
import { tokenizeMessage, restoreTokens } from './tokenProtector';
import { TranslationCache } from './cache';
import { ProviderRouter } from './providers/router';
import { createLogger } from '../utils/logger';
import { metrics } from '../utils/metrics';

const logger = createLogger('pipeline');

/**
 * Main translation pipeline that orchestrates the detection, normalization,
 * tokenization, caching, and provider routing stages.
 */
export class TranslationPipeline {
  private cache: TranslationCache;
  private router: ProviderRouter;

  constructor(router: ProviderRouter, cache: TranslationCache) {
    this.router = router;
    this.cache = cache;
  }

  /**
   * Executes the full translation pipeline.
   * @param context The pipeline context for the current translation task.
   * @returns A promise resolving to the fully updated pipeline context.
   */
  public async execute(context: PipelineContext): Promise<PipelineContext> {
    try {
      metrics.recordTranslationRequested();

      this.preprocess(context);
      if (!context.shouldTranslate) return context;

      this.detect(context);
      this.validate(context);
      if (!context.shouldTranslate) return context;

      this.normalize(context);
      this.tokenize(context);

      if (this.checkCache(context)) {
        metrics.recordCacheHit();
        this.restore(context);
        this.postprocess(context);
        metrics.recordTranslationCompleted();
        return context;
      }
      metrics.recordCacheMiss();

      await this.executeTranslation(context);

      this.restore(context);
      this.postprocess(context);
      this.storeCache(context);
      metrics.recordTranslationCompleted();

      if (context.translation) {
        metrics.recordProviderLatency(context.translation.latencyMs);
      }

      return context;
    } catch (error: any) {
      metrics.recordTranslationFailed();
      logger.error({ error: error.message, text: context.originalText.slice(0, 30) }, 'Pipeline error');
      throw error;
    }
  }

  private preprocess(context: PipelineContext): void {
    logger.debug('Stage: PREPROCESS');
    context.originalText = context.originalText.trim();
    if (!context.originalText) {
      context.shouldTranslate = false;
      context.skipReason = 'Empty text';
    } else if (context.originalText.length > config.translation.maxMessageLength) {
      context.shouldTranslate = false;
      context.skipReason = 'Message too long';
    }
  }

  private detect(context: PipelineContext): void {
    logger.debug('Stage: DETECT');
    try {
      context.detection = detectLanguage(context.originalText);
      if (context.detection) {
        metrics.recordSourceLanguage(context.detection.language);
        metrics.recordTargetLanguage(context.targetLanguage);
      }
    } catch (err: any) {
      logger.warn({ error: err.message }, 'Language detection failed');
    }
  }

  private validate(context: PipelineContext): void {
    logger.debug('Stage: VALIDATE');
    if (context.detection && !shouldTranslate(context.detection, context.targetLanguage)) {
      context.shouldTranslate = false;
      context.skipReason = 'Translation not required (source matches target or unsupported)';
    }
  }

  private normalize(context: PipelineContext): void {
    logger.debug('Stage: NORMALIZE');
    try {
      if (
        context.detection?.language === DetectedLanguage.ROMAN_HINDI ||
        context.detection?.language === DetectedLanguage.HINGLISH_MIXED
      ) {
        context.normalization = normalizeHinglish(context.originalText);
      }
    } catch (err: any) {
      logger.warn({ error: err.message }, 'Normalization failed, continuing without it');
    }
  }

  private tokenize(context: PipelineContext): void {
    logger.debug('Stage: TOKENIZE');
    try {
      const textToTokenize = context.normalization?.normalizedText || context.originalText;
      context.tokenized = tokenizeMessage(textToTokenize);
    } catch (err: any) {
      logger.warn({ error: err.message }, 'Tokenization failed, continuing with raw text');
      context.tokenized = {
        processedText: context.normalization?.normalizedText || context.originalText,
        tokens: [],
      };
    }
  }

  private checkCache(context: PipelineContext): boolean {
    logger.debug('Stage: CACHE CHECK');
    if (!context.detection || !context.tokenized) return false;

    const key = this.cache.generateKey(
      context.tokenized.processedText,
      context.detection.language,
      context.targetLanguage
    );

    const cachedResult = this.cache.get(key);
    if (cachedResult) {
      logger.debug('Cache hit');
      context.translation = { ...cachedResult, cached: true };
      return true;
    }

    logger.debug('Cache miss');
    return false;
  }

  private async executeTranslation(context: PipelineContext): Promise<void> {
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

  private restore(context: PipelineContext): void {
    logger.debug('Stage: RESTORE');
    if (context.translation && context.tokenized) {
      try {
        context.translation.translatedText = restoreTokens(
          context.translation.translatedText,
          context.tokenized.tokens
        );
      } catch (err: any) {
        logger.warn({ error: err.message }, 'Token restoration failed');
      }
    }
  }

  private postprocess(context: PipelineContext): void {
    logger.debug('Stage: POSTPROCESS');
    if (context.translation) {
      context.translation.translatedText = context.translation.translatedText.trim();
    }
  }

  private storeCache(context: PipelineContext): void {
    logger.debug('Stage: CACHE STORE');
    if (context.translation && context.detection && context.tokenized) {
      const key = this.cache.generateKey(
        context.tokenized.processedText,
        context.detection.language,
        context.targetLanguage
      );
      this.cache.set(key, context.translation);
    }
  }
}
