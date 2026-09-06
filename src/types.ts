// ─── Language Detection ──────────────────────────────

export enum DetectedLanguage {
  ENGLISH = 'english',
  HINDI_DEVANAGARI = 'hindi_devanagari',
  ROMAN_HINDI = 'roman_hindi',
  HINGLISH_MIXED = 'hinglish_mixed',
  UNSUPPORTED = 'unsupported',
  NON_TEXTUAL = 'non_textual',
}

export interface DetectionResult {
  language: DetectedLanguage;
  confidence: number; // 0.0 - 1.0
  script: 'latin' | 'devanagari' | 'mixed' | 'other';
  hindiSignals: number;
  englishSignals: number;
  details?: string;
}

// ─── Translation ─────────────────────────────────────

export type TargetLanguage = 'en' | 'hi';

export interface TranslationRequest {
  text: string;
  sourceLanguage: DetectedLanguage;
  targetLanguage: TargetLanguage;
  normalizedText?: string;
  context?: string;
}

export interface TranslationResult {
  translatedText: string;
  sourceLanguage: DetectedLanguage;
  targetLanguage: TargetLanguage;
  provider: string;
  cached: boolean;
  latencyMs: number;
  confidence: number;
}

// ─── Normalization ───────────────────────────────────

export interface NormalizationResult {
  originalText: string;
  normalizedText: string;
  appliedRules: string[];
  confidence: number;
}

// ─── Provider ────────────────────────────────────────

export interface TranslationProvider {
  readonly name: string;
  readonly priority: number;

  translate(request: TranslationRequest): Promise<TranslationResult>;
  detectLanguage?(text: string): Promise<DetectionResult>;
  isAvailable(): boolean;
}

export interface ProviderHealth {
  name: string;
  available: boolean;
  consecutiveFailures: number;
  lastFailure?: Date;
  lastSuccess?: Date;
  circuitOpen: boolean;
}

// ─── Reaction Mapping ────────────────────────────────

export interface TranslationMapping {
  id?: number;
  sourceMessageId: string;
  sourceChannelId: string;
  guildId: string;
  targetLanguage: TargetLanguage;
  translationMessageId: string;
  requestingUserId: string;
  createdAt: number;
}

export interface ReactionState {
  sourceMessageId: string;
  targetLanguage: TargetLanguage;
  reactorUserIds: Set<string>;
  translationMessageId?: string;
}

// ─── Guild & Channel Settings ────────────────────────

export interface GuildSettings {
  guildId: string;
  enabled: boolean;
  reactionTranslationEnabled: boolean;
  allowHindi: boolean;
  allowEnglish: boolean;
  deleteOnReactionRemove: boolean;
  maxMessageLength: number;
  createdAt: number;
  updatedAt: number;
}

export interface ChannelSettings {
  channelId: string;
  guildId: string;
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}

// ─── Token Protection ────────────────────────────────

export interface ProtectedToken {
  placeholder: string;
  original: string;
  type: 'mention' | 'channel' | 'emoji' | 'url' | 'code_block' | 'inline_code' | 'timestamp';
}

export interface TokenizedMessage {
  processedText: string;
  tokens: ProtectedToken[];
}

// ─── Cache ───────────────────────────────────────────

export interface CacheEntry<T> {
  value: T;
  createdAt: number;
  ttl: number;
}

// ─── Rate Limiting ───────────────────────────────────

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetMs: number;
}

// ─── Metrics ─────────────────────────────────────────

export interface TranslationMetrics {
  translationsRequested: number;
  translationsCompleted: number;
  translationsFailed: number;
  cacheHits: number;
  cacheMisses: number;
  providerLatencyMs: number[];
  providerFailures: Map<string, number>;
  sourceLanguageDistribution: Map<DetectedLanguage, number>;
  targetLanguageDistribution: Map<TargetLanguage, number>;
  duplicatesPrevented: number;
}

// ─── Pipeline ────────────────────────────────────────

export interface PipelineContext {
  originalText: string;
  guildId: string;
  channelId: string;
  userId: string;
  targetLanguage: TargetLanguage;
  detection?: DetectionResult;
  normalization?: NormalizationResult;
  tokenized?: TokenizedMessage;
  translation?: TranslationResult;
  shouldTranslate: boolean;
  skipReason?: string;
}

// ─── Reaction Flags ──────────────────────────────────

export const REACTION_FLAGS: Record<string, TargetLanguage> = {
  '🇺🇸': 'en',
  '🇮🇳': 'hi',
};

export const TARGET_LANGUAGE_LABELS: Record<TargetLanguage, string> = {
  en: 'English',
  hi: 'Hindi',
};

export const TARGET_LANGUAGE_FLAGS: Record<TargetLanguage, string> = {
  en: '🇺🇸',
  hi: '🇮🇳',
};
