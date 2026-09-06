import { GoogleGenerativeAI } from '@google/generative-ai';
import { performance } from 'perf_hooks';
import { TranslationProvider, TranslationRequest, TranslationResult, DetectedLanguage, TargetLanguage } from '../../types';
import { config } from '../../config';
import { createLogger } from '../../utils/logger';

const logger = createLogger('gemini');

// Ultra-lean, zero-overhead instructions:
// Ultra-lean, zero-overhead instructions:
const HINDI_TO_ENGLISH_INSTRUCTION =
  'You are a translator. Translate the text directly to natural conversational English. Output ONLY the translated text, nothing else. Do not add quotes, notes, or explanations. Preserve emojis and protected §...§ markers exactly as they appear.';
const ENGLISH_TO_HINDI_INSTRUCTION =
  'You are a translator. Translate the text directly to natural Romanized Hindi (Latin script). Output ONLY the translated text, nothing else. Do not add quotes, notes, or Devanagari script. Preserve emojis and protected §...§ markers exactly as they appear.';

// Progressive token ceilings: 256 -> 512 -> 1024
const TOKEN_CEILING_TIERS = [256, 512, 1024] as const;

/**
 * Gemini translation provider (Primary provider).
 * Tuned for ultra-low latency, zero reasoning overhead, and minimal token usage.
 * Implements progressive bounded escalation: 256 -> 512 -> 1024 on MAX_TOKENS.
 */
export class GeminiProvider implements TranslationProvider {
  public readonly name = 'gemini';
  public readonly priority = 1;
  private ai: GoogleGenerativeAI | null = null;

  constructor() {
    if (config.providers.gemini.apiKey) {
      this.ai = new GoogleGenerativeAI(config.providers.gemini.apiKey);
    }
  }

  public isAvailable(): boolean {
    return this.ai !== null;
  }

  public async translate(request: TranslationRequest): Promise<TranslationResult> {
    if (!this.ai) {
      throw new Error('Gemini provider is not available (missing API key)');
    }

    const start = performance.now();
    const abortController = new AbortController();

    const timeout = setTimeout(() => {
      abortController.abort();
    }, config.translation.timeoutMs || 10000);

    try {
      const systemInstruction =
        request.targetLanguage === 'en'
          ? HINDI_TO_ENGLISH_INSTRUCTION
          : ENGLISH_TO_HINDI_INSTRUCTION;

      // Lean payload: exactly what's needed, no chat history or bloated metadata
      const textToTranslate = request.normalizedText || request.text;
      const prompt = `[${request.sourceLanguage} -> ${request.targetLanguage}]: ${textToTranslate}`;

      let lastResponse: any = null;
      let succeeded = false;

      // Progressive tiered escalation: 256 -> 512 -> 1024
      for (const ceiling of TOKEN_CEILING_TIERS) {
        lastResponse = await this.callGemini(
          systemInstruction,
          prompt,
          ceiling,
          abortController.signal
        );

        const candidate = lastResponse.response.candidates?.[0];
        const finishReason = candidate?.finishReason;

        if (finishReason === 'MAX_TOKENS') {
          logger.warn(
            { finishReason, currentCeiling: ceiling },
            `Truncation hit at ${ceiling} tokens. Escalating to next ceiling tier.`
          );
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
      const latencyMs = performance.now() - start;

      return {
        translatedText,
        sourceLanguage: request.sourceLanguage,
        targetLanguage: request.targetLanguage,
        provider: this.name,
        cached: false,
        latencyMs,
        confidence: 0.98,
      };
    } catch (error: any) {
      logger.error({ error: error.message, provider: this.name }, 'Gemini translation failed');
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  private async callGemini(
    systemInstruction: string,
    prompt: string,
    maxOutputTokens: number,
    signal: AbortSignal
  ) {
    const model = this.ai!.getGenerativeModel({
      model: config.providers.gemini.model,
      systemInstruction: { parts: [{ text: systemInstruction }], role: 'system' },
      generationConfig: {
        temperature: 0.1, // Deterministic, fast
        maxOutputTokens,
        thinkingConfig: {
          thinkingBudget: 0, // Disable internal reasoning tokens
        },
      } as any,
    });

    return model.generateContent(
      {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      },
      { signal }
    );
  }
}
