import { ProviderHealth, TranslationProvider, TranslationRequest, TranslationResult } from '../../types';
/**
 * Orchestrates translation provider routing, employing priority sorting
 * and a circuit breaker pattern for resilience.
 */
export declare class ProviderRouter {
    private providers;
    private healthStatus;
    private readonly FAILURE_THRESHOLD;
    private readonly RECOVERY_TIMEOUT_MS;
    constructor(providers: TranslationProvider[]);
    /**
     * Attempts to translate using available providers. Iterates through providers by priority.
     * @param request The translation request.
     * @returns Promise resolving to translation result.
     */
    translate(request: TranslationRequest): Promise<TranslationResult>;
    /**
     * Returns current health statistics for all registered providers.
     */
    getProviderHealth(): ProviderHealth[];
    /** Alias for getProviderHealth() */
    getHealth(): ProviderHealth[];
}
//# sourceMappingURL=router.d.ts.map