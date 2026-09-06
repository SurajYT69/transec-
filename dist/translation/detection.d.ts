import { DetectionResult, TargetLanguage } from '../types';
/**
 * Detects the language of the provided text using a multi-layered strategy.
 *
 * Layers:
 * 1. Script Analysis (Devanagari vs Latin)
 * 2. Hindi Lexical Signals (strong + weak)
 * 3. English Lexical Signals
 * 4. Code-Mixing Heuristics
 * 5. Confidence Scoring
 *
 * @param text The text to analyze.
 * @returns DetectionResult with language, confidence, script, and signal counts.
 */
export declare function detectLanguage(text: string): DetectionResult;
/**
 * Determines whether translation should proceed based on detection and target.
 * @param detection The language detection result.
 * @param targetLanguage The requested target language.
 * @returns True if translation should proceed, false otherwise.
 */
export declare function shouldTranslate(detection: DetectionResult, targetLanguage: TargetLanguage): boolean;
//# sourceMappingURL=detection.d.ts.map