import { TargetLanguage } from '../types';
export declare class ReactionTracker {
    private reactions;
    private activeJobs;
    makeKey(sourceMessageId: string, targetLanguage: TargetLanguage): string;
    addReaction(sourceMessageId: string, targetLanguage: TargetLanguage, userId: string): {
        isFirstReaction: boolean;
        isDuplicate: boolean;
    };
    removeReaction(sourceMessageId: string, targetLanguage: TargetLanguage, userId: string): {
        shouldDeleteTranslation: boolean;
        remainingReactors: number;
    };
    setTranslationMessageId(sourceMessageId: string, targetLanguage: TargetLanguage, translationMessageId: string): void;
    getTranslationMessageId(sourceMessageId: string, targetLanguage: TargetLanguage): string | undefined;
    acquireJob(sourceMessageId: string, targetLanguage: TargetLanguage): boolean;
    releaseJob(sourceMessageId: string, targetLanguage: TargetLanguage): void;
    removeMessage(sourceMessageId: string): void;
    cleanup(): void;
}
//# sourceMappingURL=reactionTracker.d.ts.map