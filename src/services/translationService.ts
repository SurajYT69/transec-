import { TranslationPipeline } from '../translation/pipeline';
import { TranslationCache } from '../translation/cache';
import { ProviderRouter } from '../translation/providers/router';
import { GeminiProvider } from '../translation/providers/gemini';
import { AzureProvider } from '../translation/providers/azure';
import { ReactionTracker } from './reactionTracker';
import { RateLimiter } from './rateLimiter';
import { getOrCreateGuildSettings, getGuildSettings } from '../database/guildSettings';
import { getChannelSettings, isChannelEnabled } from '../database/channelSettings';
import { createMapping, findMapping, deleteMapping } from '../database/translationMapping';
import { TargetLanguage, ProviderHealth, TARGET_LANGUAGE_LABELS, TARGET_LANGUAGE_FLAGS } from '../types';
import { config } from '../config';
import { createLogger } from '../utils/logger';
import { metrics } from '../utils/metrics';

const logger = createLogger('translationService');

export class TranslationService {
  private pipeline: TranslationPipeline;
  private reactionTracker: ReactionTracker;
  private userRateLimiter: RateLimiter;
  private guildRateLimiter: RateLimiter;
  private router: ProviderRouter;
  private cache: TranslationCache;

  constructor() {
    this.reactionTracker = new ReactionTracker();
    this.userRateLimiter = new RateLimiter(config.rateLimits.perUser);
    this.guildRateLimiter = new RateLimiter(config.rateLimits.perGuild);

    const providers = [];
    if (config.providers.gemini.apiKey) {
      providers.push(new GeminiProvider());
      logger.info('Gemini provider registered');
    }
    if (config.providers.azure.key) {
      providers.push(new AzureProvider());
      logger.info('Azure provider registered');
    }

    if (providers.length === 0) {
      logger.warn('No translation providers configured! Set GEMINI_API_KEY or AZURE_TRANSLATOR_KEY.');
    }

    this.router = new ProviderRouter(providers);
    this.cache = new TranslationCache(config.cache.maxSize, config.cache.ttlMs);
    this.pipeline = new TranslationPipeline(this.router, this.cache);
  }

  public async handleReactionAdd(
    messageId: string,
    channelId: string,
    guildId: string,
    userId: string,
    targetLanguage: TargetLanguage,
    fetchMessage: () => Promise<{ content: string; authorId: string; botAuthor: boolean }>,
    sendReply: (content: string, messageRef: string) => Promise<string>
  ): Promise<void> {
    const logCtx = { messageId, channelId, guildId, userId, targetLanguage };

    try {
      // 1. Check guild settings
      const guildSettings = getOrCreateGuildSettings(guildId);
      if (!guildSettings.enabled || !guildSettings.reactionTranslationEnabled) {
        logger.debug(logCtx, 'Translation disabled for guild');
        return;
      }

      // 2. Check channel settings
      if (!isChannelEnabled(channelId, guildId)) {
        logger.debug(logCtx, 'Translation disabled for channel');
        return;
      }

      // 3. Check rate limits
      const userRate = this.userRateLimiter.consume(userId);
      const guildRate = this.guildRateLimiter.consume(guildId);
      if (!userRate.allowed || !guildRate.allowed) {
        logger.warn(logCtx, 'Rate limit exceeded');
        return;
      }

      // 4. Check reaction tracker for deduplication
      const { isDuplicate } = this.reactionTracker.addReaction(messageId, targetLanguage, userId);
      if (isDuplicate) {
        metrics.recordDuplicatePrevented();
        logger.debug(logCtx, 'Duplicate reaction, translation already exists');
        return;
      }

      // 5. Acquire job lock
      if (!this.reactionTracker.acquireJob(messageId, targetLanguage)) {
        logger.debug(logCtx, 'Translation job already in progress');
        return;
      }

      try {
        // 6. Fetch message content
        const { content, botAuthor } = await fetchMessage();

        // 7. Skip bot messages
        if (botAuthor) {
          logger.debug(logCtx, 'Skipping bot message');
          return;
        }

        // 8. Skip empty messages
        if (!content.trim()) {
          logger.debug(logCtx, 'Skipping empty message');
          return;
        }

        // 9. Run translation pipeline
        const result = await this.pipeline.execute({
          originalText: content,
          guildId,
          channelId,
          userId,
          targetLanguage,
          shouldTranslate: true,
        });

        if (!result.shouldTranslate || !result.translation) {
          logger.debug({ ...logCtx, skipReason: result.skipReason }, 'Translation skipped');
          return;
        }

        // 10. Format and send translation
        const formatted = this.formatTranslation(targetLanguage, result.translation.translatedText);
        const replyId = await sendReply(formatted, messageId);

        // 11. Track and persist
        this.reactionTracker.setTranslationMessageId(messageId, targetLanguage, replyId);

        createMapping({
          sourceMessageId: messageId,
          sourceChannelId: channelId,
          guildId,
          targetLanguage,
          translationMessageId: replyId,
          requestingUserId: userId,
          createdAt: Date.now(),
        });

        logger.info({ ...logCtx, translationId: replyId }, 'Translation sent');
      } finally {
        this.reactionTracker.releaseJob(messageId, targetLanguage);
      }
    } catch (error) {
      logger.error({ ...logCtx, error }, 'Error in handleReactionAdd');
    }
  }

  public async handleReactionRemove(
    messageId: string,
    targetLanguage: TargetLanguage,
    userId: string,
    guildId: string,
    deleteMessage: (channelId: string, messageId: string) => Promise<void>
  ): Promise<void> {
    try {
      const guildSettings = getOrCreateGuildSettings(guildId);
      if (!guildSettings.deleteOnReactionRemove) return;

      const { shouldDeleteTranslation } = this.reactionTracker.removeReaction(messageId, targetLanguage, userId);

      if (shouldDeleteTranslation) {
        const mapping = findMapping(messageId, targetLanguage);
        if (mapping) {
          await deleteMessage(mapping.sourceChannelId, mapping.translationMessageId);
          deleteMapping(messageId, targetLanguage);
          logger.info({ messageId, targetLanguage }, 'Translation message deleted');
        }
      }
    } catch (error) {
      logger.error({ messageId, targetLanguage, userId, error }, 'Error in handleReactionRemove');
    }
  }

  public async handleContextMenuTranslation(
    messageContent: string,
    targetLanguage: TargetLanguage,
    guildId: string,
    channelId: string,
    userId: string
  ): Promise<string | null> {
    try {
      const result = await this.pipeline.execute({
        originalText: messageContent,
        guildId,
        channelId,
        userId,
        targetLanguage,
        shouldTranslate: true,
      });

      if (!result.shouldTranslate || !result.translation) return null;
      return this.formatTranslation(targetLanguage, result.translation.translatedText);
    } catch (error) {
      logger.error({ error }, 'Error in context menu translation');
      return null;
    }
  }

  public formatTranslation(targetLanguage: TargetLanguage, translatedText: string): string {
    const flag = TARGET_LANGUAGE_FLAGS[targetLanguage];
    const name = TARGET_LANGUAGE_LABELS[targetLanguage];
    return `${flag} **${name}**\n${translatedText}`;
  }

  public getStatus(): { providers: ProviderHealth[]; cacheSize: number; metrics: any } {
    return {
      providers: this.router.getHealth(),
      cacheSize: this.cache.getSize(),
      metrics: metrics.getSnapshot(),
    };
  }
}
