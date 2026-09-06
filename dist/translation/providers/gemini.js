"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiProvider = void 0;
const generative_ai_1 = require("@google/generative-ai");
const perf_hooks_1 = require("perf_hooks");
const config_1 = require("../../config");
const logger_1 = require("../../utils/logger");
const logger = (0, logger_1.createLogger)('gemini');
// Ultra-lean, zero-overhead instructions:
// Ultra-lean, zero-overhead instructions:
const HINDI_TO_ENGLISH_INSTRUCTION = 'You are a translator. Translate the text directly to natural conversational English. Output ONLY the translated text, nothing else. Do not add quotes, notes, or explanations. Preserve emojis and protected §...§ markers exactly as they appear.';
const ENGLISH_TO_HINDI_INSTRUCTION = 'You are a translator. Translate the text directly to natural Romanized Hindi (Latin script). Output ONLY the translated text, nothing else. Do not add quotes, notes, or Devanagari script. Preserve emojis and protected §...§ markers exactly as they appear.';
// Progressive token ceilings: 256 -> 512 -> 1024
const TOKEN_CEILING_TIERS = [256, 512, 1024];
/**
 * Gemini translation provider (Primary provider).
 * Tuned for ultra-low latency, zero reasoning overhead, and minimal token usage.
 * Implements progressive bounded escalation: 256 -> 512 -> 1024 on MAX_TOKENS.
 */
class GeminiProvider {
    name = 'gemini';
    priority = 1;
    ai = null;
    constructor() {
        if (config_1.config.providers.gemini.apiKey) {
            this.ai = new generative_ai_1.GoogleGenerativeAI(config_1.config.providers.gemini.apiKey);
        }
    }
    isAvailable() {
        return this.ai !== null;
    }
    async translate(request) {
        if (!this.ai) {
            throw new Error('Gemini provider is not available (missing API key)');
        }
        const start = perf_hooks_1.performance.now();
        const abortController = new AbortController();
        const timeout = setTimeout(() => {
            abortController.abort();
        }, config_1.config.translation.timeoutMs || 10000);
        try {
            const systemInstruction = request.targetLanguage === 'en'
                ? HINDI_TO_ENGLISH_INSTRUCTION
                : ENGLISH_TO_HINDI_INSTRUCTION;
            // Lean payload: exactly what's needed, no chat history or bloated metadata
            const textToTranslate = request.normalizedText || request.text;
            const prompt = `[${request.sourceLanguage} -> ${request.targetLanguage}]: ${textToTranslate}`;
            let lastResponse = null;
            let succeeded = false;
            // Progressive tiered escalation: 256 -> 512 -> 1024
            for (const ceiling of TOKEN_CEILING_TIERS) {
                lastResponse = await this.callGemini(systemInstruction, prompt, ceiling, abortController.signal);
                const candidate = lastResponse.response.candidates?.[0];
                const finishReason = candidate?.finishReason;
                if (finishReason === 'MAX_TOKENS') {
                    logger.warn({ finishReason, currentCeiling: ceiling }, `Truncation hit at ${ceiling} tokens. Escalating to next ceiling tier.`);
                    continue; // Try next higher ceiling
                }
                succeeded = true;
                break; // Finished completely with STOP or normal termination
            }
            if (!succeeded) {
                // Exceeded even 1024 tokens -> throw so ProviderRouter can invoke fallback
                throw new Error('Gemini output exceeded all progressive ceiling tiers (up to 1024 tokens)');
            }
            const translatedText = lastResponse.response.text().trim();
            const latencyMs = perf_hooks_1.performance.now() - start;
            return {
                translatedText,
                sourceLanguage: request.sourceLanguage,
                targetLanguage: request.targetLanguage,
                provider: this.name,
                cached: false,
                latencyMs,
                confidence: 0.98,
            };
        }
        catch (error) {
            logger.error({ error: error.message, provider: this.name }, 'Gemini translation failed');
            throw error;
        }
        finally {
            clearTimeout(timeout);
        }
    }
    async callGemini(systemInstruction, prompt, maxOutputTokens, signal) {
        const model = this.ai.getGenerativeModel({
            model: config_1.config.providers.gemini.model,
            systemInstruction: { parts: [{ text: systemInstruction }], role: 'system' },
            generationConfig: {
                temperature: 0.1, // Deterministic, fast
                maxOutputTokens,
                thinkingConfig: {
                    thinkingBudget: 0, // Disable internal reasoning tokens
                },
            },
        });
        return model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
        }, { signal });
    }
}
exports.GeminiProvider = GeminiProvider;
//# sourceMappingURL=gemini.js.map