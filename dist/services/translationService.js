"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TranslationService = void 0;
const pipeline_1 = require("../translation/pipeline");
const cache_1 = require("../translation/cache");
const router_1 = require("../translation/providers/router");
const gemini_1 = require("../translation/providers/gemini");
const azure_1 = require("../translation/providers/azure");
const reactionTracker_1 = require("./reactionTracker");
const rateLimiter_1 = require("./rateLimiter");
const guildSettings_1 = require("../database/guildSettings");
const channelSettings_1 = require("../database/channelSettings");
const translationMapping_1 = require("../database/translationMapping");
const types_1 = require("../types");
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
const metrics_1 = require("../utils/metrics");
const logger = (0, logger_1.createLogger)('translationService');
class TranslationService {
    pipeline;
    reactionTracker;
    userRateLimiter;
    guildRateLimiter;
    router;
    cache;
    constructor() {
        this.reactionTracker = new reactionTracker_1.ReactionTracker();
        this.userRateLimiter = new rateLimiter_1.RateLimiter(config_1.config.rateLimits.perUser);
        this.guildRateLimiter = new rateLimiter_1.RateLimiter(config_1.config.rateLimits.perGuild);
        const providers = [];
        if (config_1.config.providers.gemini.apiKey) {
            providers.push(new gemini_1.GeminiProvider());
            logger.info('Gemini provider registered');
        }
        if (config_1.config.providers.azure.key) {
            providers.push(new azure_1.AzureProvider());
            logger.info('Azure provider registered');
        }
        if (providers.length === 0) {
            logger.warn('No translation providers configured! Set GEMINI_API_KEY or AZURE_TRANSLATOR_KEY.');
        }
        this.router = new router_1.ProviderRouter(providers);
        this.cache = new cache_1.TranslationCache(config_1.config.cache.maxSize, config_1.config.cache.ttlMs);
        this.pipeline = new pipeline_1.TranslationPipeline(this.router, this.cache);
    }
    async handleReactionAdd(messageId, channelId, guildId, userId, targetLanguage, fetchMessage, sendReply) {
        const logCtx = { messageId, channelId, guildId, userId, targetLanguage };
        try {
            // 1. Check guild settings
            const guildSettings = (0, guildSettings_1.getOrCreateGuildSettings)(guildId);
            if (!guildSettings.enabled || !guildSettings.reactionTranslationEnabled) {
                logger.debug(logCtx, 'Translation disabled for guild');
                return;
            }
            // 2. Check channel settings
            if (!(0, channelSettings_1.isChannelEnabled)(channelId, guildId)) {
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
                metrics_1.metrics.recordDuplicatePrevented();
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
                (0, translationMapping_1.createMapping)({
                    sourceMessageId: messageId,
                    sourceChannelId: channelId,
                    guildId,
                    targetLanguage,
                    translationMessageId: replyId,
                    requestingUserId: userId,
                    createdAt: Date.now(),
                });
                logger.info({ ...logCtx, translationId: replyId }, 'Translation sent');
            }
            finally {
                this.reactionTracker.releaseJob(messageId, targetLanguage);
            }
        }
        catch (error) {
            logger.error({ ...logCtx, error }, 'Error in handleReactionAdd');
        }
    }
    async handleReactionRemove(messageId, targetLanguage, userId, guildId, deleteMessage) {
        try {
            const guildSettings = (0, guildSettings_1.getOrCreateGuildSettings)(guildId);
            if (!guildSettings.deleteOnReactionRemove)
                return;
            const { shouldDeleteTranslation } = this.reactionTracker.removeReaction(messageId, targetLanguage, userId);
            if (shouldDeleteTranslation) {
                const mapping = (0, translationMapping_1.findMapping)(messageId, targetLanguage);
                if (mapping) {
                    await deleteMessage(mapping.sourceChannelId, mapping.translationMessageId);
                    (0, translationMapping_1.deleteMapping)(messageId, targetLanguage);
                    logger.info({ messageId, targetLanguage }, 'Translation message deleted');
                }
            }
        }
        catch (error) {
            logger.error({ messageId, targetLanguage, userId, error }, 'Error in handleReactionRemove');
        }
    }
    async handleContextMenuTranslation(messageContent, targetLanguage, guildId, channelId, userId) {
        try {
            const result = await this.pipeline.execute({
                originalText: messageContent,
                guildId,
                channelId,
                userId,
                targetLanguage,
                shouldTranslate: true,
            });
            if (!result.shouldTranslate || !result.translation)
                return null;
            return this.formatTranslation(targetLanguage, result.translation.translatedText);
        }
        catch (error) {
            logger.error({ error }, 'Error in context menu translation');
            return null;
        }
    }
    formatTranslation(targetLanguage, translatedText) {
        const flag = types_1.TARGET_LANGUAGE_FLAGS[targetLanguage];
        const name = types_1.TARGET_LANGUAGE_LABELS[targetLanguage];
        return `${flag} **${name}**\n${translatedText}`;
    }
    getStatus() {
        return {
            providers: this.router.getHealth(),
            cacheSize: this.cache.getSize(),
            metrics: metrics_1.metrics.getSnapshot(),
        };
    }
}
exports.TranslationService = TranslationService;
//# sourceMappingURL=translationService.js.map