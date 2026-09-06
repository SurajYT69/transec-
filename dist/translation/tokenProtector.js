"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenizeMessage = tokenizeMessage;
exports.restoreTokens = restoreTokens;
/**
 * Replaces Discord-specific tokens with safe placeholders to prevent translation engines from mangling them.
 * @param text The original text to tokenize.
 * @returns An object containing the processed text and the extracted tokens.
 */
function tokenizeMessage(text) {
    const tokens = [];
    let processedText = text;
    // Helper to replace and store
    const replaceAndStore = (regex, type) => {
        processedText = processedText.replace(regex, (match) => {
            const placeholder = `§${type.toUpperCase()}_${tokens.length}§`;
            tokens.push({
                placeholder,
                original: match,
                type,
            });
            return placeholder;
        });
    };
    // The order is important: code blocks first to avoid matching tokens inside them
    replaceAndStore(/```[\s\S]*?```/g, 'code_block');
    replaceAndStore(/`[^`]*`/g, 'inline_code');
    replaceAndStore(/<@!?\d+>/g, 'mention');
    replaceAndStore(/<#\d+>/g, 'channel');
    replaceAndStore(/<@&\d+>/g, 'mention'); // Role mentions use 'mention' type as well
    replaceAndStore(/<a?:\w+:\d+>/g, 'emoji');
    replaceAndStore(/<t:\d+(:[tTdDfFR])?>/g, 'timestamp');
    replaceAndStore(/https?:\/\/\S+/g, 'url');
    // For spoilers, protect the || markers
    processedText = processedText.replace(/\|\|/g, () => {
        const placeholder = `§SPOILER_MARKER_${tokens.length}§`;
        tokens.push({
            placeholder,
            original: '||',
            type: 'inline_code',
        });
        return placeholder;
    });
    return {
        processedText,
        tokens,
    };
}
/**
 * Restores original tokens from placeholders in translated text.
 * @param translatedText Text returned from translation API (might have mangled placeholders)
 * @param tokens The array of original tokens.
 * @returns Text with original formatting restored.
 */
function restoreTokens(translatedText, tokens) {
    let restored = translatedText;
    const missingTokens = [];
    for (const token of tokens) {
        // Some providers might add internal spaces or mangle casing: e.g. § MENTION _ 0 § or §mention_0§
        // Important: Do NOT greedily consume outside whitespace (\s*) so surrounding words stay separated.
        const innerName = token.placeholder.slice(1, -1); // e.g. 'MENTION_0'
        const flexiblePattern = '§\\s*' + innerName.replace(/_/g, '\\s*_\\s*') + '\\s*§';
        const flexibleRegex = new RegExp(flexiblePattern, 'i');
        if (flexibleRegex.test(restored)) {
            restored = restored.replace(flexibleRegex, token.original);
        }
        else {
            missingTokens.push(token);
        }
    }
    // If a provider completely removed the placeholder, append the original at the end
    if (missingTokens.length > 0) {
        restored += ' ' + missingTokens.map((t) => t.original).join(' ');
    }
    return restored.trim();
}
//# sourceMappingURL=tokenProtector.js.map