import { ProviderHealth, TranslationProvider, TranslationRequest, TranslationResult } from '../../types';
import { createLogger } from '../../utils/logger';

const logger = createLogger('providerRouter');

/**
 * Orchestrates translation provider routing, employing priority sorting 
 * and a circuit breaker pattern for resilience.
 */
export class ProviderRouter {
  private providers: TranslationProvider[];
  private healthStatus: Map<string, ProviderHealth>;
  
  private readonly FAILURE_THRESHOLD = 3;
  private readonly RECOVERY_TIMEOUT_MS = 60000;

  constructor(providers: TranslationProvider[]) {
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
  public async translate(request: TranslationRequest): Promise<TranslationResult> {
    let lastError: Error | null = null;

    for (const provider of this.providers) {
      const health = this.healthStatus.get(provider.name)!;

      health.available = provider.isAvailable();
      
      // Skip unavailable providers
      if (!health.available) continue;

      // Circuit Breaker logic
      if (health.circuitOpen) {
        if (health.lastFailure && (Date.now() - health.lastFailure.getTime() > this.RECOVERY_TIMEOUT_MS)) {
          logger.info({ provider: provider.name }, 'Circuit half-open, sending probe request');
        } else {
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
      } catch (error: any) {
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
  public getProviderHealth(): ProviderHealth[] {
    return Array.from(this.healthStatus.values());
  }

  /** Alias for getProviderHealth() */
  public getHealth(): ProviderHealth[] {
    return this.getProviderHealth();
  }
}
