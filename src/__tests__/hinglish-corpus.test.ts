import { describe, it, expect } from 'vitest';
import { detectLanguage } from '../translation/detection';
import { DetectedLanguage } from '../types';

describe('Hinglish Corpus Evaluation', () => {
  const corpus = [
    { text: "bhai yaar mere man nhi kar rha aaj jane ka bahar", meaning: "brother, I don't feel like going out today" },
    { text: "kya scene hai", meaning: "what is the plan / scene" },
    { text: "kal aa rha h?", meaning: "are you coming tomorrow?" },
    { text: "mai abhi ghar pe hu", meaning: "I am at home right now" },
    { text: "tu kaha hai", meaning: "where are you" },
    { text: "bhai mujhe samajh nhi aa raha", meaning: "brother I am not understanding" },
    { text: "acha theek h", meaning: "okay fine" },
    { text: "ruk zara", meaning: "wait a bit" },
    { text: "yaar aaj mood off hai", meaning: "friend, today my mood is off" },
    { text: "mujhe nahi lagta main jaunga", meaning: "I don't think I will go" },
    { text: "bro tu serious hai kya", meaning: "bro are you serious?" },
    { text: "bc ye kya tha 💀", meaning: "what was this" },
    { text: "bhai today mera mann nahi hai", meaning: "brother today I don't feel like it" },
    { text: "kal office jana padega", meaning: "will have to go to office tomorrow" },
    { text: "mereko ye samajh nahi aaya", meaning: "I didn't understand this" },
    { text: "kya kar raha hai tu", meaning: "what are you doing" },
    { text: "haan bhai aa raha hu", meaning: "yes brother, I am coming" },
    { text: "nahi yaar rehne de", meaning: "no friend, let it be" },
    { text: "ab kya kare", meaning: "what to do now" },
    { text: "kitne baje aaega", meaning: "at what time will you come" }
  ];

  it('correctly identifies Hindi/Hinglish from corpus', () => {
    for (const { text, meaning } of corpus) {
      const res = detectLanguage(text);
      expect([DetectedLanguage.ROMAN_HINDI, DetectedLanguage.HINGLISH_MIXED]).toContain(res.language);
      expect(res.confidence).toBeGreaterThan(0.2);
    }
  });

  it('does not incorrectly identify clear English as Hindi', () => {
    const englishCorpus = [
      "I'm going to the store",
      "What time is the meeting?",
      "The report is ready",
      "Can you help me with this?"
    ];

    for (const text of englishCorpus) {
      const res = detectLanguage(text);
      expect(res.language).toBe(DetectedLanguage.ENGLISH);
    }
  });
});
