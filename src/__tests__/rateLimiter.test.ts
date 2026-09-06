import { describe, it, expect, beforeEach } from 'vitest';
import { RateLimiter } from '../services/rateLimiter';

describe('RateLimiter', () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter({ maxRequests: 2, windowMs: 100 });
  });

  it('allows requests within limit', () => {
    const r1 = limiter.consume("user1");
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(1);
    
    const r2 = limiter.consume("user1");
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(0);
  });

  it('blocks requests exceeding limit', () => {
    limiter.consume("user1");
    limiter.consume("user1");
    const r3 = limiter.consume("user1");
    
    expect(r3.allowed).toBe(false);
    expect(r3.remaining).toBe(0);
  });

  it('reset allows new requests', () => {
    limiter.consume("user1");
    limiter.consume("user1");
    expect(limiter.consume("user1").allowed).toBe(false);
    
    limiter.reset("user1");
    
    expect(limiter.consume("user1").allowed).toBe(true);
  });

  it('window expiration allows new requests', async () => {
    limiter.consume("user1");
    limiter.consume("user1");
    expect(limiter.consume("user1").allowed).toBe(false);
    
    await new Promise(r => setTimeout(r, 110));
    
    expect(limiter.consume("user1").allowed).toBe(true);
  });

  it('tracks different keys independently', () => {
    limiter.consume("user1");
    limiter.consume("user1");
    
    expect(limiter.consume("user2").allowed).toBe(true);
  });
});
