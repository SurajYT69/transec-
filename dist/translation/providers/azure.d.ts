import { TranslationProvider, TranslationRequest, TranslationResult } from '../../types';
/**
 * Azure translation provider (Fallback provider).
 * Utilizes Azure Translator for direct translation and transliteration logic.
 */
export declare class AzureProvider implements TranslationProvider {
    readonly name = "azure";
    readonly priority = 2;
    /**
     * Checks if the provider is available by verifying configuration keys.
     */
    isAvailable(): boolean;
    /**
     * Translates the requested text using Azure Translator.
     * Handles multi-step transliteration pipelines when applicable.
     * @param request The translation request configuration.
     * @returns A promise resolving to the translation result.
     */
    translate(request: TranslationRequest): Promise<TranslationResult>;
}
//# sourceMappingURL=azure.d.ts.map