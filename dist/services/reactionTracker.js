"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReactionTracker = void 0;
const logger_1 = require("../utils/logger");
const logger = (0, logger_1.createLogger)('reactionTracker');
class ReactionTracker {
    reactions = new Map();
    activeJobs = new Set();
    makeKey(sourceMessageId, targetLanguage) {
        return `${sourceMessageId}:${targetLanguage}`;
    }
    addReaction(sourceMessageId, targetLanguage, userId) {
        const key = this.makeKey(sourceMessageId, targetLanguage);
        let state = this.reactions.get(key);
        if (!state) {
            state = {
                sourceMessageId,
                targetLanguage,
                reactorUserIds: new Set([userId])
            };
            this.reactions.set(key, state);
            return { isFirstReaction: true, isDuplicate: false };
        }
        if (state.reactorUserIds.has(userId)) {
            return { isFirstReaction: false, isDuplicate: true };
        }
        state.reactorUserIds.add(userId);
        return { isFirstReaction: false, isDuplicate: !!state.translationMessageId };
    }
    removeReaction(sourceMessageId, targetLanguage, userId) {
        const key = this.makeKey(sourceMessageId, targetLanguage);
        const state = this.reactions.get(key);
        if (!state) {
            return { shouldDeleteTranslation: false, remainingReactors: 0 };
        }
        state.reactorUserIds.delete(userId);
        const remainingReactors = state.reactorUserIds.size;
        const shouldDeleteTranslation = remainingReactors === 0;
        if (shouldDeleteTranslation) {
            this.reactions.delete(key);
        }
        return { shouldDeleteTranslation, remainingReactors };
    }
    setTranslationMessageId(sourceMessageId, targetLanguage, translationMessageId) {
        const key = this.makeKey(sourceMessageId, targetLanguage);
        const state = this.reactions.get(key);
        if (state) {
            state.translationMessageId = translationMessageId;
        }
    }
    getTranslationMessageId(sourceMessageId, targetLanguage) {
        const key = this.makeKey(sourceMessageId, targetLanguage);
        return this.reactions.get(key)?.translationMessageId;
    }
    acquireJob(sourceMessageId, targetLanguage) {
        const key = this.makeKey(sourceMessageId, targetLanguage);
        if (this.activeJobs.has(key)) {
            return false;
        }
        this.activeJobs.add(key);
        return true;
    }
    releaseJob(sourceMessageId, targetLanguage) {
        const key = this.makeKey(sourceMessageId, targetLanguage);
        this.activeJobs.delete(key);
    }
    removeMessage(sourceMessageId) {
        for (const [key, state] of this.reactions.entries()) {
            if (state.sourceMessageId === sourceMessageId) {
                this.reactions.delete(key);
            }
        }
    }
    cleanup() {
        logger.info('Running reaction tracker cleanup');
        this.activeJobs.clear();
    }
}
exports.ReactionTracker = ReactionTracker;
//# sourceMappingURL=reactionTracker.js.map