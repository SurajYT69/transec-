"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AzureProvider = void 0;
const axios_1 = __importDefault(require("axios"));
const crypto_1 = require("crypto");
const perf_hooks_1 = require("perf_hooks");
const types_1 = require("../../types");
const config_1 = require("../../config");
const logger_1 = require("../../utils/logger");
const logger = (0, logger_1.createLogger)('azure');
/**
 * Azure translation provider (Fallback provider).
 * Utilizes Azure Translator for direct translation and transliteration logic.
 */
class AzureProvider {
    name = 'azure';
    priority = 2;
    /**
     * Checks if the provider is available by verifying configuration keys.
     */
    isAvailable() {
        return Boolean(config_1.config.providers.azure.key && config_1.config.providers.azure.region && config_1.config.providers.azure.endpoint);
    }
    /**
     * Translates the requested text using Azure Translator.
     * Handles multi-step transliteration pipelines when applicable.
     * @param request The translation request configuration.
     * @returns A promise resolving to the translation result.
     */
    async translate(request) {
        if (!this.isAvailable()) {
            throw new Error('Azure provider is not available (missing configuration)');
        }
        const start = perf_hooks_1.performance.now();
        const abortController = new AbortController();
        const timeout = setTimeout(() => abortController.abort(), config_1.config.translation.timeoutMs || 10000);
        const textToTranslate = request.normalizedText || request.text;
        let translatedText = '';
        try {
            const headers = {
                'Ocp-Apim-Subscription-Key': config_1.config.providers.azure.key,
                'Ocp-Apim-Subscription-Region': config_1.config.providers.azure.region,
                'Content-Type': 'application/json',
                'X-ClientTraceId': (0, crypto_1.randomUUID)()
            };
            if (request.targetLanguage === 'en') {
                if (request.sourceLanguage === types_1.DetectedLanguage.ROMAN_HINDI || request.sourceLanguage === types_1.DetectedLanguage.HINGLISH_MIXED) {
                    // Step 1: Transliterate Latin -> Devanagari
                    const transUrl = `${config_1.config.providers.azure.endpoint}/transliterate?api-version=3.0&language=hi&fromScript=Latn&toScript=Deva`;
                    const transResponse = await axios_1.default.post(transUrl, [{ Text: textToTranslate }], { headers, signal: abortController.signal });
                    const devanagariText = transResponse.data[0].text;
                    // Step 2: Translate Devanagari -> English
                    const translateUrl = `${config_1.config.providers.azure.endpoint}/translate?api-version=3.0&from=hi&to=en`;
                    const translateResponse = await axios_1.default.post(translateUrl, [{ Text: devanagariText }], { headers, signal: abortController.signal });
                    translatedText = translateResponse.data[0].translations[0].text;
                }
                else {
                    // General Translation directly to English
                    const translateUrl = `${config_1.config.providers.azure.endpoint}/translate?api-version=3.0&from=hi&to=en`;
                    const translateResponse = await axios_1.default.post(translateUrl, [{ Text: textToTranslate }], { headers, signal: abortController.signal });
                    translatedText = translateResponse.data[0].translations[0].text;
                }
            }
            else {
                // Translate to Hindi and format script as Latin
                const translateUrl = `${config_1.config.providers.azure.endpoint}/translate?api-version=3.0&from=en&to=hi&toScript=Latn`;
                const translateResponse = await axios_1.default.post(translateUrl, [{ Text: textToTranslate }], { headers, signal: abortController.signal });
                const firstTranslation = translateResponse.data[0].translations[0];
                translatedText = firstTranslation.transliteration?.text || firstTranslation.text;
            }
            const latencyMs = perf_hooks_1.performance.now() - start;
            return {
                translatedText,
                sourceLanguage: request.sourceLanguage,
                targetLanguage: request.targetLanguage,
                provider: this.name,
                cached: false,
                latencyMs,
                confidence: 0.90
            };
        }
        catch (error) {
            logger.error({ error: error.message, provider: this.name }, 'Azure translation failed');
            throw error;
        }
        finally {
            clearTimeout(timeout);
        }
    }
}
exports.AzureProvider = AzureProvider;
//# sourceMappingURL=azure.js.map