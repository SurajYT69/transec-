import { describe, it, expect } from 'vitest';
import { detectLanguage, shouldTranslate } from '../translation/detection';
import { DetectedLanguage } from '../types';

describe('detectLanguage', () => {
  describe('English detection', () => {
    it('detects english sentences with multiple English indicators', () => {
      const res = detectLanguage("I really don't feel like going out today");
      expect(res.language).toBe(DetectedLanguage.ENGLISH);
      expect(res.confidence).toBeGreaterThan(0.3);
    });

    it('detects simple english sentences', () => {
      expect(detectLanguage("The weather is beautiful today").language).toBe(DetectedLanguage.ENGLISH);
      expect(detectLanguage("Can you please send me the report?").language).toBe(DetectedLanguage.ENGLISH);
      expect(detectLanguage("What time is the meeting tomorrow?").language).toBe(DetectedLanguage.ENGLISH);
    });

    it('detects longer english paragraphs', () => {
      const res = detectLanguage("I'm going to the store to buy some groceries for dinner tonight");
      expect(res.language).toBe(DetectedLanguage.ENGLISH);
    });
  });

  describe('Hindi Devanagari detection', () => {
    it('detects devanagari with high confidence', () => {
      const res = detectLanguage("नमस्ते कैसे हो");
      expect(res.language).toBe(DetectedLanguage.HINDI_DEVANAGARI);
      expect(res.confidence).toBeGreaterThan(0.8);
      expect(res.script).toBe('devanagari');
    });

    it('detects simple devanagari sentences', () => {
      expect(detectLanguage("आज मौसम बहुत अच्छा है").language).toBe(DetectedLanguage.HINDI_DEVANAGARI);
      expect(detectLanguage("मुझे बाहर जाना नहीं है").language).toBe(DetectedLanguage.HINDI_DEVANAGARI);
    });
  });

  describe('Romanized Hindi detection', () => {
    it('detects strong roman hindi sentences', () => {
      const res = detectLanguage("bhai yaar mere man nhi kar rha aaj jane ka bahar");
      expect([DetectedLanguage.ROMAN_HINDI, DetectedLanguage.HINGLISH_MIXED]).toContain(res.language);
      expect(res.confidence).toBeGreaterThan(0.3);
    });

    it('detects common Hindi phrases', () => {
      const phrases = [
        "kya kar rha hai",
        "mai abhi ghar pe hu",
        "mujhe jaana nahi hai",
        "haan bhai aa raha hu",
        "nahi yaar rehne de",
        "ruk zara",
        "acha theek h",
      ];
      for (const phrase of phrases) {
        const res = detectLanguage(phrase);
        expect(res.hindiSignals).toBeGreaterThan(0);
        expect([DetectedLanguage.ROMAN_HINDI, DetectedLanguage.HINGLISH_MIXED]).toContain(res.language);
      }
    });

    it('correctly identifies Hindi signals in mixed contexts', () => {
      const phrases = [
        "kal milte h bro",
        "aaj bahar jane ka mood nhi hai",
        "kya scene hai",
        "tu kaha hai",
      ];
      for (const phrase of phrases) {
        const res = detectLanguage(phrase);
        expect(res.hindiSignals).toBeGreaterThan(0);
        // These should be classified as Hindi-related (either ROMAN_HINDI or HINGLISH_MIXED)
        expect([DetectedLanguage.ROMAN_HINDI, DetectedLanguage.HINGLISH_MIXED]).toContain(res.language);
      }
    });
  });

  describe('Hinglish mixed detection', () => {
    it('detects code-mixed phrases with both Hindi and English signals', () => {
      // These contain a mix of Hindi and English words
      const phrases = [
        "bhai today mera bilkul mood nahi hai bahar jane ka",
        "bro tu serious hai kya",
        "kal office jana padega",
      ];
      for (const phrase of phrases) {
        const res = detectLanguage(phrase);
        // Should be classified as either HINGLISH_MIXED or ROMAN_HINDI (both are acceptable for translation)
        expect([DetectedLanguage.ROMAN_HINDI, DetectedLanguage.HINGLISH_MIXED]).toContain(res.language);
        expect(res.hindiSignals).toBeGreaterThan(0);
      }
    });
  });

  describe('Ambiguous / short messages', () => {
    it('handles short messages conservatively', () => {
      const resOk = detectLanguage("ok");
      // "ok" alone should have low confidence or be UNSUPPORTED
      expect(resOk.confidence).toBeLessThanOrEqual(0.6);

      // Single ambiguous words should not confidently be ROMAN_HINDI
      const resBro = detectLanguage("bro");
      expect(resBro.confidence).toBeLessThan(0.5);
    });
  });

  describe('Non-textual / empty', () => {
    it('detects non-textual messages', () => {
      expect(detectLanguage("").language).toBe(DetectedLanguage.NON_TEXTUAL);
      expect(detectLanguage("   ").language).toBe(DetectedLanguage.NON_TEXTUAL);
      expect(detectLanguage("<@123456789>").language).toBe(DetectedLanguage.NON_TEXTUAL);
    });
  });
});

describe('shouldTranslate', () => {
  it('returns false for English to English (no-op)', () => {
    expect(shouldTranslate({ language: DetectedLanguage.ENGLISH, confidence: 0.9, script: 'latin', hindiSignals: 0, englishSignals: 1 }, 'en')).toBe(false);
  });

  it('returns true for English to Hindi', () => {
    expect(shouldTranslate({ language: DetectedLanguage.ENGLISH, confidence: 0.9, script: 'latin', hindiSignals: 0, englishSignals: 1 }, 'hi')).toBe(true);
  });

  it('returns true for Roman Hindi to English', () => {
    expect(shouldTranslate({ language: DetectedLanguage.ROMAN_HINDI, confidence: 0.9, script: 'latin', hindiSignals: 1, englishSignals: 0 }, 'en')).toBe(true);
  });

  it('returns false for Devanagari Hindi to Hindi (no-op)', () => {
    expect(shouldTranslate({ language: DetectedLanguage.HINDI_DEVANAGARI, confidence: 0.9, script: 'devanagari', hindiSignals: 1, englishSignals: 0 }, 'hi')).toBe(false);
  });

  it('returns true for Devanagari Hindi to English', () => {
    expect(shouldTranslate({ language: DetectedLanguage.HINDI_DEVANAGARI, confidence: 0.9, script: 'devanagari', hindiSignals: 1, englishSignals: 0 }, 'en')).toBe(true);
  });

  it('returns false for unsupported language', () => {
    expect(shouldTranslate({ language: DetectedLanguage.UNSUPPORTED, confidence: 0.1, script: 'other', hindiSignals: 0, englishSignals: 0 }, 'en')).toBe(false);
  });

  it('returns false for non-textual', () => {
    expect(shouldTranslate({ language: DetectedLanguage.NON_TEXTUAL, confidence: 1.0, script: 'other', hindiSignals: 0, englishSignals: 0 }, 'en')).toBe(false);
  });

  it('returns true for Hinglish mixed to English', () => {
    expect(shouldTranslate({ language: DetectedLanguage.HINGLISH_MIXED, confidence: 0.7, script: 'latin', hindiSignals: 3, englishSignals: 2 }, 'en')).toBe(true);
  });
});
