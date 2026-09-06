import { describe, it, expect, beforeEach } from 'vitest';
import { ReactionTracker } from '../services/reactionTracker';

describe('ReactionTracker', () => {
  let tracker: ReactionTracker;

  beforeEach(() => {
    tracker = new ReactionTracker();
  });

  it('tracks first reaction correctly', () => {
    const res = tracker.addReaction("msg1", "en", "user1");
    expect(res.isFirstReaction).toBe(true);
    expect(res.isDuplicate).toBe(false);
  });

  it('tracks second user reacting as duplicate', () => {
    tracker.addReaction("msg1", "en", "user1");
    tracker.setTranslationMessageId("msg1", "en", "transMsg1");
    
    const res = tracker.addReaction("msg1", "en", "user2");
    expect(res.isFirstReaction).toBe(false);
    expect(res.isDuplicate).toBe(true);
  });

  it('handles removing one of two users', () => {
    tracker.addReaction("msg1", "en", "user1");
    tracker.addReaction("msg1", "en", "user2");
    
    const res = tracker.removeReaction("msg1", "en", "user1");
    expect(res.shouldDeleteTranslation).toBe(false);
    expect(res.remainingReactors).toBe(1);
  });

  it('handles removing last user', () => {
    tracker.addReaction("msg1", "en", "user1");
    const res = tracker.removeReaction("msg1", "en", "user1");
    expect(res.shouldDeleteTranslation).toBe(true);
    expect(res.remainingReactors).toBe(0);
  });

  it('tracks different languages independently', () => {
    tracker.addReaction("msg1", "en", "user1");
    const resHi = tracker.addReaction("msg1", "hi", "user1");
    expect(resHi.isFirstReaction).toBe(true);
  });

  it('manages jobs correctly', () => {
    expect(tracker.acquireJob("msg1", "en")).toBe(true);
    expect(tracker.acquireJob("msg1", "en")).toBe(false); // Already acquired
    
    tracker.releaseJob("msg1", "en");
    expect(tracker.acquireJob("msg1", "en")).toBe(true); // Can acquire again
  });

  it('sets and gets translation message id', () => {
    tracker.addReaction("msg1", "en", "user1");
    tracker.setTranslationMessageId("msg1", "en", "trans1");
    
    expect(tracker.getTranslationMessageId("msg1", "en")).toBe("trans1");
    expect(tracker.getTranslationMessageId("msg1", "hi")).toBeUndefined();
  });

  it('clears all reactions for a message', () => {
    tracker.addReaction("msg1", "en", "user1");
    tracker.addReaction("msg1", "hi", "user2");
    
    tracker.removeMessage("msg1");
    
    const res = tracker.addReaction("msg1", "en", "user1");
    expect(res.isFirstReaction).toBe(true); // Treat as new
  });
});
