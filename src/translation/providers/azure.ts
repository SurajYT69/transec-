import axios from 'axios';
import { randomUUID } from 'crypto';
import { performance } from 'perf_hooks';
import { TranslationProvider, TranslationRequest, TranslationResult, DetectedLanguage } from '../../types';
import { config } from '../../config';
import { createLogger } from '../../utils/logger';

const logger = createLogger('azure');

/**
 * Azure translation provider (Fallback provider).
 * Utilizes Azure Translator for direct translation and transliteration logic.
 */
export class AzureProvider implements TranslationProvider {
  public readonly name = 'azure';
  public readonly priority = 2;

  /**
   * Checks if the provider is available by verifying configuration keys.
   */
  public isAvailable(): boolean {
    return Boolean(config.providers.azure.key && config.providers.azure.region && config.providers.azure.endpoint);
  }

  /**
   * Translates the requested text using Azure Translator.
   * Handles multi-step transliteration pipelines when applicable.
   * @param request The translation request configuration.
   * @returns A promise resolving to the translation result.
   */
  public async translate(request: TranslationRequest): Promise<TranslationResult> {
    if (!this.isAvailable()) {
      throw new Error('Azure provider is not available (missing configuration)');
    }

    const start = performance.now();
    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), config.translation.timeoutMs || 10000);

    const textToTranslate = request.normalizedText || request.text;
    let translatedText = '';

    try {
      const headers = {
        'Ocp-Apim-Subscription-Key': config.providers.azure.key,
        'Ocp-Apim-Subscription-Region': config.providers.azure.region,
        'Content-Type': 'application/json',
        'X-ClientTraceId': randomUUID()
      };

      if (request.targetLanguage === 'en') {
        if (request.sourceLanguage === DetectedLanguage.ROMAN_HINDI || request.sourceLanguage === DetectedLanguage.HINGLISH_MIXED) {
          // Step 1: Transliterate Latin -> Devanagari
          const transUrl = `${config.providers.azure.endpoint}/transliterate?api-version=3.0&language=hi&fromScript=Latn&toScript=Deva`;
          const transResponse = await axios.post(transUrl, [{ Text: textToTranslate }], { headers, signal: abortController.signal });
          const devanagariText = transResponse.data[0].text;

          // Step 2: Translate Devanagari -> English
          const translateUrl = `${config.providers.azure.endpoint}/translate?api-version=3.0&from=hi&to=en`;
          const translateResponse = await axios.post(translateUrl, [{ Text: devanagariText }], { headers, signal: abortController.signal });
          translatedText = translateResponse.data[0].translations[0].text;
        } else {
          // General Translation directly to English
          const translateUrl = `${config.providers.azure.endpoint}/translate?api-version=3.0&from=hi&to=en`;
          const translateResponse = await axios.post(translateUrl, [{ Text: textToTranslate }], { headers, signal: abortController.signal });
          translatedText = translateResponse.data[0].translations[0].text;
        }
      } else {
        // Translate to Hindi and format script as Latin
        const translateUrl = `${config.providers.azure.endpoint}/translate?api-version=3.0&from=en&to=hi&toScript=Latn`;
        const translateResponse = await axios.post(translateUrl, [{ Text: textToTranslate }], { headers, signal: abortController.signal });
        
        const firstTranslation = translateResponse.data[0].translations[0];
        translatedText = firstTranslation.transliteration?.text || firstTranslation.text;
      }

      const latencyMs = performance.now() - start;

      return {
        translatedText,
        sourceLanguage: request.sourceLanguage,
        targetLanguage: request.targetLanguage,
        provider: this.name,
        cached: false,
        latencyMs,
        confidence: 0.90
      };
    } catch (error: any) {
      logger.error({ error: error.message, provider: this.name }, 'Azure translation failed');
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}
