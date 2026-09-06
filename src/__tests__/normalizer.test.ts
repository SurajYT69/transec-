import { describe, it, expect } from 'vitest';
import { normalizeHinglish } from '../translation/normalizer';

describe('normalizeHinglish', () => {
  it('normalizes specific exact match words', () => {
    const res = normalizeHinglish("nhi kr rha hai");
    expect(res.normalizedText).toContain("nahi");
    expect(res.normalizedText).toContain("kar");
    expect(res.normalizedText).toContain("raha");
  });

  it('normalizes other common words', () => {
    expect(normalizeHinglish("hu").normalizedText).toContain("hoon");
    expect(normalizeHinglish("kro").normalizedText).toContain("karo");
    expect(normalizeHinglish("gya").normalizedText).toContain("gaya");
  });

  it('reduces repeated characters', () => {
    const res = normalizeHinglish("kyaaa kar rha haii");
    expect(res.normalizedText).toContain("kyaa");
    expect(res.normalizedText).toContain("haii"); 
    expect(res.appliedRules).toContain('reduced_repeated_chars');
  });

  it('does not change already normalized text much', () => {
    const text = "kya kar raha hai";
    const res = normalizeHinglish(text);
    expect(res.normalizedText).toBe(text);
    expect(res.appliedRules.length).toBe(0);
    expect(res.confidence).toBe(1.0);
  });

  it('does not modify english text', () => {
    const text = "what are you doing";
    const res = normalizeHinglish(text);
    expect(res.normalizedText).toBe(text);
  });

  it('only normalizes hindi abbreviations in mixed text', () => {
    const res = normalizeHinglish("today mera mood nhi hai");
    expect(res.normalizedText).toContain("nahi");
    expect(res.normalizedText).toContain("today");
  });

  it('tracks applied rules and decreases confidence', () => {
    const res = normalizeHinglish("nhi rha");
    expect(res.appliedRules).toContain('replace_nhi_with_nahi');
    expect(res.appliedRules).toContain('replace_rha_with_raha');
    expect(res.confidence).toBeLessThan(1.0);
  });
});
