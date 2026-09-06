"use strict";
// ─── Language Detection ──────────────────────────────
Object.defineProperty(exports, "__esModule", { value: true });
exports.TARGET_LANGUAGE_FLAGS = exports.TARGET_LANGUAGE_LABELS = exports.REACTION_FLAGS = exports.DetectedLanguage = void 0;
var DetectedLanguage;
(function (DetectedLanguage) {
    DetectedLanguage["ENGLISH"] = "english";
    DetectedLanguage["HINDI_DEVANAGARI"] = "hindi_devanagari";
    DetectedLanguage["ROMAN_HINDI"] = "roman_hindi";
    DetectedLanguage["HINGLISH_MIXED"] = "hinglish_mixed";
    DetectedLanguage["UNSUPPORTED"] = "unsupported";
    DetectedLanguage["NON_TEXTUAL"] = "non_textual";
})(DetectedLanguage || (exports.DetectedLanguage = DetectedLanguage = {}));
// ─── Reaction Flags ──────────────────────────────────
exports.REACTION_FLAGS = {
    '🇺🇸': 'en',
    '🇮🇳': 'hi',
};
exports.TARGET_LANGUAGE_LABELS = {
    en: 'English',
    hi: 'Hindi',
};
exports.TARGET_LANGUAGE_FLAGS = {
    en: '🇺🇸',
    hi: '🇮🇳',
};
//# sourceMappingURL=types.js.map