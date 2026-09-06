"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimiter = void 0;
class RateLimiter {
    config;
    windows = new Map();
    constructor(config) {
        this.config = config;
    }
    cleanWindow(key, now) {
        const window = this.windows.get(key) || [];
        const validWindow = window.filter(timestamp => now - timestamp < this.config.windowMs);
        if (validWindow.length > 0) {
            this.windows.set(key, validWindow);
        }
        else {
            this.windows.delete(key);
        }
        return validWindow;
    }
    check(key) {
        const now = Date.now();
        const window = this.cleanWindow(key, now);
        const allowed = window.length < this.config.maxRequests;
        const remaining = Math.max(0, this.config.maxRequests - window.length);
        const resetMs = window.length > 0 ? this.config.windowMs - (now - window[0]) : 0;
        return { allowed, remaining, resetMs };
    }
    consume(key) {
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
    reset(key) {
        this.windows.delete(key);
    }
    resetAll() {
        this.windows.clear();
    }
}
exports.RateLimiter = RateLimiter;
//# sourceMappingURL=rateLimiter.js.map