import { PipelineContext } from '../types';
import { TranslationCache } from './cache';
import { ProviderRouter } from './providers/router';
/**
 * Main translation pipeline that orchestrates the detection, normalization,
 * tokenization, caching, and provider routing stages.
 */
export declare class TranslationPipeline {
    private cache;
    private router;
    constructor(router: ProviderRouter, cache: TranslationCache);
    /**
     * Executes the full translation pipeline.
     * @param context The pipeline context for the current translation task.
     * @returns A promise resolving to the fully updated pipeline context.
     */
    execute(context: PipelineContext): Promise<PipelineContext>;
    private preprocess;
    private detect;
    private validate;
    private normalize;
    private tokenize;
    private checkCache;
    private executeTranslation;
    private restore;
    private postprocess;
    private storeCache;
}
//# sourceMappingURL=pipeline.d.ts.map