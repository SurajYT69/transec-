export declare const config: {
    readonly discord: {
        readonly token: string;
        readonly clientId: string;
    };
    readonly providers: {
        readonly gemini: {
            readonly apiKey: string;
            readonly model: string;
        };
        readonly azure: {
            readonly key: string;
            readonly region: string;
            readonly endpoint: string;
        };
    };
    readonly database: {
        readonly path: string;
    };
    readonly logging: {
        readonly level: string;
    };
    readonly rateLimits: {
        readonly perUser: {
            readonly maxRequests: number;
            readonly windowMs: number;
        };
        readonly perGuild: {
            readonly maxRequests: number;
            readonly windowMs: number;
        };
    };
    readonly cache: {
        readonly maxSize: number;
        readonly ttlMs: number;
    };
    readonly translation: {
        readonly maxMessageLength: number;
        readonly timeoutMs: number;
        readonly maxRetries: 2;
    };
};
export type Config = typeof config;
//# sourceMappingURL=config.d.ts.map