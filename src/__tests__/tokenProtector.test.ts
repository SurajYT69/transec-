import { describe, it, expect } from 'vitest';
import { tokenizeMessage, restoreTokens } from '../translation/tokenProtector';

describe('tokenProtector', () => {
  describe('tokenizeMessage', () => {
    it('protects user mentions', () => {
      const res = tokenizeMessage("hello <@123456789> how are you");
      expect(res.processedText).toContain('§MENTION_0§');
      expect(res.tokens[0].original).toBe('<@123456789>');
    });

    it('protects channel mentions', () => {
      const res = tokenizeMessage("go to <#987654321>");
      expect(res.processedText).toContain('§CHANNEL_0§');
      expect(res.tokens[0].original).toBe('<#987654321>');
    });

    it('protects custom emojis', () => {
      const res = tokenizeMessage("look <:emoji:123456789>");
      expect(res.processedText).toContain('§EMOJI_0§');
    });

    it('protects URLs', () => {
      const res = tokenizeMessage("check https://example.com please");
      expect(res.processedText).toContain('§URL_0§');
    });

    it('protects code blocks', () => {
      const res = tokenizeMessage("```js\nconsole.log('hi')\n```");
      expect(res.processedText).toContain('§CODE_BLOCK_0§');
    });

    it('protects inline code', () => {
      const res = tokenizeMessage("use `npm install`");
      expect(res.processedText).toContain('§INLINE_CODE_0§');
    });

    it('protects timestamps', () => {
      const res = tokenizeMessage("<t:1234567890:R>");
      expect(res.processedText).toContain('§TIMESTAMP_0§');
    });

    it('protects multiple tokens', () => {
      const res = tokenizeMessage("hello <@123> check https://example.com");
      expect(res.tokens.length).toBe(2);
      expect(res.processedText).toContain('§MENTION_0§');
      expect(res.processedText).toContain('§URL_1§');
    });

    it('does nothing to plain text', () => {
      const text = "just some normal text";
      const res = tokenizeMessage(text);
      expect(res.processedText).toBe(text);
      expect(res.tokens.length).toBe(0);
    });
  });

  describe('restoreTokens', () => {
    it('restores multiple tokens correctly', () => {
      const tokenized = tokenizeMessage("hello <@123> check https://example.com");
      const restored = restoreTokens(tokenized.processedText, tokenized.tokens);
      expect(restored).toBe("hello <@123> check https://example.com");
    });

    it('appends missing tokens at the end', () => {
      const tokenized = tokenizeMessage("hello <@123>");
      // Simulate translator losing the placeholder
      const translated = "namaste";
      const restored = restoreTokens(translated, tokenized.tokens);
      expect(restored).toBe("namaste <@123>");
    });
    
    it('recovers original text with roundtrip', () => {
      const original = "hi <@123> see https://example.com";
      const tokenized = tokenizeMessage(original);
      const restored = restoreTokens(tokenized.processedText, tokenized.tokens);
      expect(restored).toBe(original);
    });
  });
});
