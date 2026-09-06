"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderRouter = void 0;
const logger_1 = require("../../utils/logger");
const logger = (0, logger_1.createLogger)('providerRouter');
/**
 * Orchestrates translation provider routing, employing priority sorting
 * and a circuit breaker pattern for resilience.
 */
class ProviderRouter {
    providers;
    healthStatus;
    FAILURE_THRESHOLD = 3;
    RECOVERY_TIMEOUT_MS = 60000;
    constructor(providers) {
        // Sort providers by priority (lower number = higher priority)
        this.providers = [...providers].sort((a, b) => a.priority - b.priority);
        this.healthStatus = new Map();
        for (const provider of this.providers) {
            this.healthStatus.set(provider.name, {
                name: provider.name,
                available: provider.isAvailable(),
                consecutiveFailures: 0,
                circuitOpen: false
            });
        }
    }
    /**
     * Attempts to translate using available providers. Iterates through providers by priority.
     * @param request The translation request.
     * @returns Promise resolving to translation result.
     */
    async translate(request) {
        let lastError = null;
        for (const provider of this.providers) {
            const health = this.healthStatus.get(provider.name);
            health.available = provider.isAvailable();
            // Skip unavailable providers
            if (!health.available)
                continue;
            // Circuit Breaker logic
            if (health.circuitOpen) {
                if (health.lastFailure && (Date.now() - health.lastFailure.getTime() > this.RECOVERY_TIMEOUT_MS)) {
                    logger.info({ provider: provider.name }, 'Circuit half-open, sending probe request');
                }
                else {
                    continue; // Circuit is still fully open, skip this provider
                }
            }
            try {
                const result = await provider.translate(request);
                // On success: close circuit, reset failures
                health.consecutiveFailures = 0;
                health.circuitOpen = false;
                health.lastSuccess = new Date();
                return result;
            }
            catch (error) {
                lastError = error;
                health.consecutiveFailures += 1;
                health.lastFailure = new Date();
                logger.warn({ provider: provider.name, failures: health.consecutiveFailures }, 'Provider experienced a failure');
                if (health.consecutiveFailures >= this.FAILURE_THRESHOLD) {
                    health.circuitOpen = true;
                    logger.error({ provider: provider.name }, 'Circuit broken due to consecutive failures');
                }
            }
        }
        logger.error('All translation providers failed or are unavailable');
        throw new Error(`Translation failed: ${lastError?.message || 'No available providers'}`);
    }
    /**
     * Returns current health statistics for all registered providers.
     */
    getProviderHealth() {
        return Array.from(this.healthStatus.values());
    }
    /** Alias for getProviderHealth() */
    getHealth() {
        return this.getProviderHealth();
    }
}
exports.ProviderRouter = ProviderRouter;
//# sourceMappingURL=router.js.map