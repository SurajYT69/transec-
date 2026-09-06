"use strict";
/**
 * SmartTranslate Provider Benchmark
 *
 * Benchmarks translation providers against a real Hinglish corpus.
 * Usage: npx tsx src/benchmark.ts
 *
 * Requires at least one provider API key configured in .env
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const gemini_1 = require("./translation/providers/gemini");
const azure_1 = require("./translation/providers/azure");
const detection_1 = require("./translation/detection");
const normalizer_1 = require("./translation/normalizer");
const HINGLISH_CORPUS = [
    { text: 'bhai yaar mere man nhi kar rha aaj jane ka bahar', expectedMeaning: "Bro, I don't feel like going out today" },
    { text: 'kya scene hai', expectedMeaning: "What's the scene / What's up" },
    { text: 'kal aa rha h?', expectedMeaning: 'Are you coming tomorrow?' },
    { text: 'mai abhi ghar pe hu', expectedMeaning: 'I am at home right now' },
    { text: 'tu kaha hai', expectedMeaning: 'Where are you?' },
    { text: 'bhai mujhe samajh nhi aa raha', expectedMeaning: "Bro, I don't understand" },
    { text: 'acha theek h', expectedMeaning: 'Okay, fine' },
    { text: 'ruk zara', expectedMeaning: 'Wait a moment' },
    { text: 'yaar aaj mood off hai', expectedMeaning: 'Dude, my mood is off today' },
    { text: 'mujhe nahi lagta main jaunga', expectedMeaning: "I don't think I'll go" },
    { text: 'bro tu serious hai kya', expectedMeaning: 'Bro, are you serious?' },
    { text: 'bhai today mera mann nahi hai', expectedMeaning: "Bro, I'm not in the mood today" },
    { text: 'kal office jana padega', expectedMeaning: 'I have to go to the office tomorrow' },
    { text: 'mereko ye samajh nahi aaya', expectedMeaning: "I didn't understand this" },
    { text: 'kya kar raha hai tu', expectedMeaning: 'What are you doing?' },
    { text: 'haan bhai aa raha hu', expectedMeaning: "Yes bro, I'm coming" },
    { text: 'nahi yaar rehne de', expectedMeaning: 'No dude, leave it / forget it' },
    { text: 'ab kya kare', expectedMeaning: 'What do we do now?' },
    { text: 'kitne baje aaega', expectedMeaning: 'What time will you come?' },
    { text: 'pata nahi yaar', expectedMeaning: "Don't know, dude" },
];
const ENGLISH_CORPUS = [
    { text: "I really don't feel like going out today, bro.", expectedMeaning: 'Bhai, aaj bahar jaane ka mann nahi hai' },
    { text: 'What time is the meeting tomorrow?', expectedMeaning: 'Kal meeting kitne baje hai?' },
    { text: 'Can you send me the report by tonight?', expectedMeaning: 'Kya tum aaj raat tak report bhej sakte ho?' },
    { text: "I'm running late, start without me.", expectedMeaning: 'Mujhe der ho rahi hai, mere bina shuru karo' },
    { text: "Let's grab lunch today.", expectedMeaning: 'Aaj lunch karte hain' },
];
async function benchmarkProvider(provider, corpus, targetLanguage) {
    const results = [];
    for (const item of corpus) {
        const detection = (0, detection_1.detectLanguage)(item.text);
        const normalization = (0, normalizer_1.normalizeHinglish)(item.text);
        const request = {
            text: item.text,
            sourceLanguage: detection.language,
            targetLanguage,
            normalizedText: normalization.normalizedText,
        };
        try {
            const result = await provider.translate(request);
            results.push({
                input: item.text,
                expectedMeaning: item.expectedMeaning,
                provider: provider.name,
                detectedLanguage: detection.language,
                output: result.translatedText,
                latencyMs: Math.round(result.latencyMs),
                success: true,
            });
        }
        catch (error) {
            results.push({
                input: item.text,
                expectedMeaning: item.expectedMeaning,
                provider: provider.name,
                detectedLanguage: detection.language,
                output: '',
                latencyMs: 0,
                success: false,
                error: error.message,
            });
        }
        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500));
    }
    return results;
}
function printResults(results, direction) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`  BENCHMARK: ${direction}`);
    console.log(`${'='.repeat(80)}`);
    let successCount = 0;
    let totalLatency = 0;
    for (const r of results) {
        const status = r.success ? '✅' : '❌';
        console.log(`\n${status} [${r.provider}] ${r.detectedLanguage} | ${r.latencyMs}ms`);
        console.log(`   Input:    ${r.input}`);
        console.log(`   Expected: ${r.expectedMeaning}`);
        console.log(`   Output:   ${r.output || r.error}`);
        if (r.success) {
            successCount++;
            totalLatency += r.latencyMs;
        }
    }
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`  Provider: ${results[0]?.provider || 'N/A'}`);
    console.log(`  Success: ${successCount}/${results.length} (${((successCount / results.length) * 100).toFixed(1)}%)`);
    if (successCount > 0) {
        console.log(`  Avg Latency: ${Math.round(totalLatency / successCount)}ms`);
    }
    console.log(`${'─'.repeat(80)}`);
}
async function main() {
    console.log('SmartTranslate Provider Benchmark');
    console.log(`Date: ${new Date().toISOString()}`);
    console.log('');
    const providers = [];
    const gemini = new gemini_1.GeminiProvider();
    if (gemini.isAvailable()) {
        providers.push(gemini);
        console.log('✅ Gemini provider available');
    }
    else {
        console.log('⚠️  Gemini provider not configured (set GEMINI_API_KEY)');
    }
    const azure = new azure_1.AzureProvider();
    if (azure.isAvailable()) {
        providers.push(azure);
        console.log('✅ Azure provider available');
    }
    else {
        console.log('⚠️  Azure provider not configured (set AZURE_TRANSLATOR_KEY)');
    }
    if (providers.length === 0) {
        console.error('\n❌ No providers configured. Set at least one API key in .env');
        process.exit(1);
    }
    for (const provider of providers) {
        // Hinglish → English
        console.log(`\nBenchmarking ${provider.name} for Hinglish → English...`);
        const hinglishResults = await benchmarkProvider(provider, HINGLISH_CORPUS, 'en');
        printResults(hinglishResults, `Hinglish → English (${provider.name})`);
        // English → Hindi
        console.log(`\nBenchmarking ${provider.name} for English → Hindi...`);
        const englishResults = await benchmarkProvider(provider, ENGLISH_CORPUS, 'hi');
        printResults(englishResults, `English → Hindi (${provider.name})`);
    }
    console.log('\n✅ Benchmark complete!');
}
main().catch((err) => {
    console.error('Benchmark failed:', err);
    process.exit(1);
});
//# sourceMappingURL=benchmark.js.map