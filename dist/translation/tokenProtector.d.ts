import { ProtectedToken, TokenizedMessage } from '../types';
/**
 * Replaces Discord-specific tokens with safe placeholders to prevent translation engines from mangling them.
 * @param text The original text to tokenize.
 * @returns An object containing the processed text and the extracted tokens.
 */
export declare function tokenizeMessage(text: string): TokenizedMessage;
/**
 * Restores original tokens from placeholders in translated text.
 * @param translatedText Text returned from translation API (might have mangled placeholders)
 * @param tokens The array of original tokens.
 * @returns Text with original formatting restored.
 */
export declare function restoreTokens(translatedText: string, tokens: ProtectedToken[]): string;
//# sourceMappingURL=tokenProtector.d.ts.map