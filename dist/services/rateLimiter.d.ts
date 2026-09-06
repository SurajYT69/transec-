import { RateLimitConfig, RateLimitResult } from '../types';
export declare class RateLimiter {
    private config;
    private windows;
    constructor(config: RateLimitConfig);
    private cleanWindow;
    check(key: string): RateLimitResult;
    consume(key: string): RateLimitResult;
    reset(key: string): void;
    resetAll(): void;
}
//# sourceMappingURL=rateLimiter.d.ts.map