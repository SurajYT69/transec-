"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectLanguage = detectLanguage;
exports.shouldTranslate = shouldTranslate;
const types_1 = require("../types");
// ─── Hindi Lexicon (Strong signals) ──────────────────
// Words that are distinctively Hindi/Hinglish in Latin script.
// These almost never appear in normal English text.
const HINDI_LEXICON_STRONG = new Set([
    'bhai', 'yaar', 'kya', 'kaise', 'kaisa', 'kahan', 'kidhar',
    'nahi', 'nhi', 'nahin', 'hain', 'tha', 'thi',
    'mein', 'mujhe', 'mereko', 'merko', 'mere', 'mera', 'meri',
    'tera', 'tere', 'teri', 'tumhara', 'tumhari', 'tumhare',
    'uska', 'uski', 'uske', 'unka', 'unki', 'unke',
    'karo', 'karna', 'karke', 'karte', 'karti', 'karta',
    'raha', 'rahi', 'rahe', 'rha', 'rhi',
    'hoga', 'hogi', 'honge',
    'acha', 'accha', 'achha', 'theek', 'thik',
    'abhi', 'phir', 'fir', 'lekin', 'magar', 'isliye', 'kyunki', 'kyuki',
    'jaana', 'jana', 'aana', 'aata', 'aati', 'jaata', 'jaati',
    'dekh', 'dekho', 'dekhna', 'suno', 'sunna', 'batao', 'batana',
    'chalo', 'chalte', 'chal', 'ruk', 'ruko', 'rukna',
    'samajh', 'samjha', 'samjho', 'pata', 'maloom',
    'bahut', 'bohot', 'zyada', 'thoda', 'thodi',
    'ghar', 'bahar', 'andar', 'upar', 'niche', 'neeche',
    'aaj', 'kal', 'parso', 'baad',
    'bilkul', 'ekdum', 'pakka',
    'mann', 'dil',
    'paisa', 'paise', 'kaam',
    'baat', 'baatein', 'cheez', 'banda', 'ladka', 'ladki',
    'sahi', 'galat', 'alag', 'saath',
    'wala', 'wali', 'wale', 'waala', 'waali', 'waale',
    'lagta', 'lagti', 'lagte',
    'padega', 'padegi', 'padenge',
    'milte', 'milna', 'milenge',
    'rehne', 'rehna', 'rehta',
    'dena', 'lena', 'lete', 'dete',
    'kitne', 'kitna', 'kitni', 'kab', 'kiske',
    'tujhe', 'tumhe', 'humko', 'humein', 'hume',
    'jaunga', 'jaungi', 'jayega', 'jayegi',
    'karunga', 'karungi', 'karega', 'karegi',
    'dungi', 'dunga', 'dega', 'degi',
    'bc', 'mc', 'bsdk',
    'zara',
    'hu', 'hun', 'hoon',
    'pe', 'par', 'ko', 'ka', 'ki', 'ke', 'se', 'ne', 'jo', 'wo', 'ye',
    'tu', 'tum', 'aap', 'hum', 'mai',
    'ek', 'teen', 'char', 'panch',
    'haan', 'han', 'ji', 'arre', 'oye',
]);
// Words that are weakly Hindi — they can appear in English too.
// Score them at half-weight.
const HINDI_LEXICON_WEAK = new Set([
    'ok', 'bro', 'man', 'hi', 'no', 'so', 'do', 'main',
    'hai', 'the', 'scene', 'mood', 'log', 'are',
]);
// ─── English Lexicon (Strong signals) ────────────────
// Function words and structures that are distinctively English.
const ENGLISH_INDICATORS = new Set([
    'the', 'is', 'are', 'was', 'were', 'been', 'being',
    'have', 'has', 'had', 'having',
    'does', 'did', 'doing',
    'will', 'would', 'shall', 'should',
    'can', 'could', 'may', 'might', 'must',
    'that', 'which', 'who', 'whom', 'whose',
    'this', 'these', 'those',
    'there', 'here', 'where', 'when', 'how', 'why', 'what',
    'not', 'very', 'really', 'just', 'also', 'too',
    'about', 'after', 'before', 'between', 'through',
    'because', 'although', 'however', 'therefore',
    'with', 'without', 'from', 'into', 'onto', 'upon',
    'their', 'they', 'them', 'your', 'you', 'our', 'its',
    'and', 'but', 'or', 'nor', 'for', 'yet',
    "don't", "doesn't", "didn't", "won't", "wouldn't",
    "can't", "couldn't", "shouldn't", "isn't", "aren't",
    "i'm", "i've", "i'll", "i'd", "he's", "she's", "it's",
    "we're", "they're", "you're", "we've", "they've",
    'beautiful', 'weather', 'please', 'send', 'report',
    'meeting', 'tomorrow', 'today', 'going', 'feel', 'like',
    'time', 'help', 'ready', 'store', 'outside',
]);
/**
 * Strips Discord tokens (mentions, URLs, emoji, code) before analysis.
 */
function stripTokens(text) {
    return text
        .replace(/```[\s\S]*?```/g, '')
        .replace(/`[^`]*`/g, '')
        .replace(/<@!?\d+>/g, '')
        .replace(/<#\d+>/g, '')
        .replace(/<@&\d+>/g, '')
        .replace(/<a?:\w+:\d+>/g, '')
        .replace(/<t:\d+(:[tTdDfFR])?>/g, '')
        .replace(/https?:\/\/\S+/g, '')
        .replace(/\|\|.*?\|\|/g, '');
}
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
function detectLanguage(text) {
    const cleanText = stripTokens(text).trim();
    // Empty/non-textual
    if (!cleanText) {
        return {
            language: types_1.DetectedLanguage.NON_TEXTUAL,
            confidence: 1.0,
            script: 'other',
            hindiSignals: 0,
            englishSignals: 0,
        };
    }
    // ── Layer 1: Script Analysis ───────────────────────
    let devanagariCount = 0;
    let latinCount = 0;
    for (const char of cleanText) {
        const code = char.codePointAt(0) || 0;
        if ((code >= 0x0900 && code <= 0x097f) || (code >= 0xa8e0 && code <= 0xa8ff)) {
            devanagariCount++;
        }
        else if ((code >= 0x0041 && code <= 0x005a) || (code >= 0x0061 && code <= 0x007a)) {
            latinCount++;
        }
    }
    const totalScriptChars = devanagariCount + latinCount;
    if (totalScriptChars > 0 && devanagariCount / totalScriptChars > 0.3) {
        return {
            language: types_1.DetectedLanguage.HINDI_DEVANAGARI,
            confidence: Math.min(1.0, 0.5 + devanagariCount / totalScriptChars),
            script: 'devanagari',
            hindiSignals: devanagariCount,
            englishSignals: 0,
        };
    }
    // ── Layer 2-4: Lexical Analysis ────────────────────
    const words = cleanText.toLowerCase().match(/\b[\w']+\b/g) || [];
    if (words.length === 0) {
        return {
            language: types_1.DetectedLanguage.UNSUPPORTED,
            confidence: 0,
            script: 'other',
            hindiSignals: 0,
            englishSignals: 0,
        };
    }
    let strongHindiCount = 0;
    let weakHindiCount = 0;
    let englishCount = 0;
    const classifiedWords = new Set();
    for (const word of words) {
        if (HINDI_LEXICON_STRONG.has(word)) {
            strongHindiCount++;
            classifiedWords.add(word);
        }
        else if (ENGLISH_INDICATORS.has(word)) {
            englishCount++;
            classifiedWords.add(word);
            // Also check if this word is in weak Hindi set (dual membership)
            if (HINDI_LEXICON_WEAK.has(word)) {
                weakHindiCount++;
            }
        }
        else if (HINDI_LEXICON_WEAK.has(word)) {
            weakHindiCount++;
            classifiedWords.add(word);
        }
    }
    // Effective Hindi score: strong signals count fully, weak count at 0.3
    const hindiScore = strongHindiCount + weakHindiCount * 0.3;
    // English score: full weight
    const englishScore = englishCount;
    const totalScore = hindiScore + englishScore;
    let language = types_1.DetectedLanguage.UNSUPPORTED;
    const script = 'latin';
    let confidence = 0.0;
    // Short message penalty
    const lengthFactor = words.length <= 2 ? 0.5 : words.length <= 4 ? 0.75 : 1.0;
    if (totalScore === 0) {
        // No recognizable signals at all
        language = types_1.DetectedLanguage.UNSUPPORTED;
        confidence = 0.1 * lengthFactor;
    }
    else {
        const hindiRatio = hindiScore / totalScore;
        // Classification coverage: what fraction of words were classified
        const coverage = classifiedWords.size / words.length;
        const baseConfidence = Math.min(1.0, coverage * 0.6 + 0.3);
        if (strongHindiCount >= 2 && englishCount <= 1) {
            // Strong Hindi dominance
            language = types_1.DetectedLanguage.ROMAN_HINDI;
            confidence = baseConfidence * lengthFactor;
        }
        else if (strongHindiCount >= 1 && englishCount >= 2) {
            // Clear code-mixing
            language = types_1.DetectedLanguage.HINGLISH_MIXED;
            confidence = baseConfidence * lengthFactor;
        }
        else if (hindiRatio > 0.6) {
            language = types_1.DetectedLanguage.ROMAN_HINDI;
            confidence = baseConfidence * lengthFactor;
        }
        else if (hindiRatio >= 0.25 && hindiRatio <= 0.6 && strongHindiCount >= 1) {
            language = types_1.DetectedLanguage.HINGLISH_MIXED;
            confidence = baseConfidence * lengthFactor;
        }
        else if (englishCount >= 2 && strongHindiCount === 0) {
            // Predominantly English with no strong Hindi markers
            language = types_1.DetectedLanguage.ENGLISH;
            confidence = baseConfidence * lengthFactor;
        }
        else if (englishCount >= 1 && strongHindiCount === 0 && weakHindiCount === 0) {
            language = types_1.DetectedLanguage.ENGLISH;
            confidence = baseConfidence * lengthFactor * 0.8;
        }
        else if (strongHindiCount >= 1) {
            // At least one strong Hindi signal
            language = types_1.DetectedLanguage.ROMAN_HINDI;
            confidence = baseConfidence * lengthFactor;
        }
        else {
            // Only weak signals
            language = types_1.DetectedLanguage.UNSUPPORTED;
            confidence = 0.15 * lengthFactor;
        }
    }
    // ── Layer 5: Confidence Floor ──────────────────────
    if (confidence < 0.2) {
        language = types_1.DetectedLanguage.UNSUPPORTED;
    }
    return {
        language,
        confidence: Math.min(1.0, Math.max(0, confidence)),
        script,
        hindiSignals: strongHindiCount + weakHindiCount,
        englishSignals: englishCount,
    };
}
/**
 * Determines whether translation should proceed based on detection and target.
 * @param detection The language detection result.
 * @param targetLanguage The requested target language.
 * @returns True if translation should proceed, false otherwise.
 */
function shouldTranslate(detection, targetLanguage) {
    if (detection.language === types_1.DetectedLanguage.NON_TEXTUAL || detection.language === types_1.DetectedLanguage.UNSUPPORTED) {
        return false;
    }
    if (detection.confidence < 0.2) {
        return false;
    }
    // No-ops: source matches target
    if (targetLanguage === 'en' && detection.language === types_1.DetectedLanguage.ENGLISH) {
        return false;
    }
    if (targetLanguage === 'hi' && detection.language === types_1.DetectedLanguage.HINDI_DEVANAGARI) {
        return false;
    }
    return true;
}
//# sourceMappingURL=detection.js.map