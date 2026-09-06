import { ReactionState, TargetLanguage } from '../types';
import { createLogger } from '../utils/logger';

const logger = createLogger('reactionTracker');

export class ReactionTracker {
  private reactions: Map<string, ReactionState> = new Map();
  private activeJobs: Set<string> = new Set();

  public makeKey(sourceMessageId: string, targetLanguage: TargetLanguage): string {
    return `${sourceMessageId}:${targetLanguage}`;
  }

  public addReaction(sourceMessageId: string, targetLanguage: TargetLanguage, userId: string): { isFirstReaction: boolean; isDuplicate: boolean; } {
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

  public removeReaction(sourceMessageId: string, targetLanguage: TargetLanguage, userId: string): { shouldDeleteTranslation: boolean; remainingReactors: number; } {
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

  public setTranslationMessageId(sourceMessageId: string, targetLanguage: TargetLanguage, translationMessageId: string): void {
    const key = this.makeKey(sourceMessageId, targetLanguage);
    const state = this.reactions.get(key);
    if (state) {
      state.translationMessageId = translationMessageId;
    }
  }

  public getTranslationMessageId(sourceMessageId: string, targetLanguage: TargetLanguage): string | undefined {
    const key = this.makeKey(sourceMessageId, targetLanguage);
    return this.reactions.get(key)?.translationMessageId;
  }

  public acquireJob(sourceMessageId: string, targetLanguage: TargetLanguage): boolean {
    const key = this.makeKey(sourceMessageId, targetLanguage);
    if (this.activeJobs.has(key)) {
      return false;
    }
    this.activeJobs.add(key);
    return true;
  }

  public releaseJob(sourceMessageId: string, targetLanguage: TargetLanguage): void {
    const key = this.makeKey(sourceMessageId, targetLanguage);
    this.activeJobs.delete(key);
  }

  public removeMessage(sourceMessageId: string): void {
    for (const [key, state] of this.reactions.entries()) {
      if (state.sourceMessageId === sourceMessageId) {
        this.reactions.delete(key);
      }
    }
  }

  public cleanup(): void {
    logger.info('Running reaction tracker cleanup');
    this.activeJobs.clear();
  }
}
