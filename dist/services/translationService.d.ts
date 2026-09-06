import { TargetLanguage, ProviderHealth } from '../types';
export declare class TranslationService {
    private pipeline;
    private reactionTracker;
    private userRateLimiter;
    private guildRateLimiter;
    private router;
    private cache;
    constructor();
    handleReactionAdd(messageId: string, channelId: string, guildId: string, userId: string, targetLanguage: TargetLanguage, fetchMessage: () => Promise<{
        content: string;
        authorId: string;
        botAuthor: boolean;
    }>, sendReply: (content: string, messageRef: string) => Promise<string>): Promise<void>;
    handleReactionRemove(messageId: string, targetLanguage: TargetLanguage, userId: string, guildId: string, deleteMessage: (channelId: string, messageId: string) => Promise<void>): Promise<void>;
    handleContextMenuTranslation(messageContent: string, targetLanguage: TargetLanguage, guildId: string, channelId: string, userId: string): Promise<string | null>;
    formatTranslation(targetLanguage: TargetLanguage, translatedText: string): string;
    getStatus(): {
        providers: ProviderHealth[];
        cacheSize: number;
        metrics: any;
    };
}
//# sourceMappingURL=translationService.d.ts.map