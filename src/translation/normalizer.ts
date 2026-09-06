import { NormalizationResult } from '../types';

const EXACT_MATCH_RULES: Record<string, string> = {
  'nhi': 'nahi',
  'nai': 'nahi',
  'kr': 'kar',
  'krna': 'karna',
  'kro': 'karo',
  'rha': 'raha',
  'rhi': 'rahi',
  'rhe': 'rahe',
  'gya': 'gaya',
  'gyi': 'gayi',
  'h': 'hai',
  'hn': 'hain',
  'hu': 'hoon',
  'hun': 'hoon',
  'm': 'main',
  'mt': 'mat',
  'bs': 'bas',
  'sb': 'sab',
  'kch': 'kuch',
  'smjh': 'samajh',
  'smjho': 'samjho',
  'btao': 'batao',
  'btana': 'batana',
  'skta': 'sakta',
  'skti': 'sakti',
  'skte': 'sakte',
  'chl': 'chal',
  'wrna': 'warna',
  'accha': 'acha',
  'achha': 'acha',
  'thik': 'theek',
};

const ENGLISH_EXCLUSIONS = new Set([
  'm', 'h', 'hi', 'no', 'so', 'do', 'ok',
]);

/**
 * Normalizes Hinglish/Roman Hindi text by standardizing spelling and expanding abbreviations.
 * @param text The original message text.
 * @returns NormalizationResult with the normalized text and applied rules.
 */
export function normalizeHinglish(text: string): NormalizationResult {
  let normalizedText = text;
  const appliedRules: string[] = [];
  let confidence = 1.0;

  // 1. Repeated letters normalization
  // Reduce 3+ consecutive same characters to 2
  const repeatedRegex = /(.)\1{2,}/gi;
  if (repeatedRegex.test(normalizedText)) {
    normalizedText = normalizedText.replace(repeatedRegex, '$1$1');
    appliedRules.push('reduced_repeated_chars');
    confidence *= 0.95; // Slight confidence drop
  }

  // 2. Exact word boundary replacements
  // Split into words while keeping punctuation
  const words = normalizedText.split(/(\b\w+\b)/);
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    // Skip if not a word (like spaces/punctuation)
    if (!/^\w+$/.test(word)) continue;
    
    const lowerWord = word.toLowerCase();
    
    if (EXACT_MATCH_RULES[lowerWord]) {
      // Check for standalone letter exceptions (like 'm' or 'h')
      if (ENGLISH_EXCLUSIONS.has(lowerWord)) {
        // Simple heuristic: if it's the very first word or after punctuation, it's more likely Hindi 'main' or 'hai'
        const isStart = i === 1; // words[0] might be empty string before boundary
        const prev = i > 1 ? words[i - 1] : '';
        const isAfterPunct = /[.!?]\s*$/.test(prev);
        
        if (lowerWord === 'm' && !isStart && !isAfterPunct) {
          continue; // Don't normalize 'm' in middle of sentence as 'main' unless strong context (too risky)
        }
      }

      const replacement = EXACT_MATCH_RULES[lowerWord];
      
      // Preserve original case roughly
      if (word === word.toUpperCase() && word.length > 1) {
        words[i] = replacement.toUpperCase();
      } else if (word[0] === word[0].toUpperCase()) {
        words[i] = replacement.charAt(0).toUpperCase() + replacement.slice(1);
      } else {
        words[i] = replacement;
      }

      appliedRules.push(`replace_${lowerWord}_with_${replacement}`);
      confidence *= 0.98;
    }
  }

  normalizedText = words.join('');

  return {
    originalText: text,
    normalizedText,
    appliedRules,
    confidence: Math.max(0, confidence)
  };
}
