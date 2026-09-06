import { TranslationProvider, TranslationRequest, TranslationResult } from '../../types';
/**
 * Gemini translation provider (Primary provider).
 * Tuned for ultra-low latency, zero reasoning overhead, and minimal token usage.
 * Implements progressive bounded escalation: 256 -> 512 -> 1024 on MAX_TOKENS.
 */
export declare class GeminiProvider implements TranslationProvider {
    readonly name = "gemini";
    readonly priority = 1;
    private ai;
    constructor();
    isAvailable(): boolean;
    translate(request: TranslationRequest): Promise<TranslationResult>;
    private callGemini;
}
//# sourceMappingURL=gemini.d.ts.map