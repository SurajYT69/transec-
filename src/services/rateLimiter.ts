import { RateLimitConfig, RateLimitResult } from '../types';

export class RateLimiter {
  private windows: Map<string, number[]> = new Map();

  constructor(private config: RateLimitConfig) {}

  private cleanWindow(key: string, now: number): number[] {
    const window = this.windows.get(key) || [];
    const validWindow = window.filter(timestamp => now - timestamp < this.config.windowMs);
    if (validWindow.length > 0) {
      this.windows.set(key, validWindow);
    } else {
      this.windows.delete(key);
    }
    return validWindow;
  }

  public check(key: string): RateLimitResult {
    const now = Date.now();
    const window = this.cleanWindow(key, now);
    
    const allowed = window.length < this.config.maxRequests;
    const remaining = Math.max(0, this.config.maxRequests - window.length);
    const resetMs = window.length > 0 ? this.config.windowMs - (now - window[0]) : 0;

    return { allowed, remaining, resetMs };
  }

  public consume(key: string): RateLimitResult {
    const now = Date.now();
    const window = this.cleanWindow(key, now);
    
    const allowed = window.length < this.config.maxRequests;
    const remaining = Math.max(0, this.config.maxRequests - (allowed ? window.length + 1 : window.length));
    const resetMs = window.length > 0 ? this.config.windowMs - (now - window[0]) : 0;

    if (allowed) {
      window.push(now);
      this.windows.set(key, window);
    }

    return { allowed, remaining, resetMs };
  }

  public reset(key: string): void {
    this.windows.delete(key);
  }

  public resetAll(): void {
    this.windows.clear();
  }
}
