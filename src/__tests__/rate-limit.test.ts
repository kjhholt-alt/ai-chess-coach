import { describe, it, expect, beforeEach, vi } from "vitest";
import { checkRateLimit } from "@/lib/rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    // Reset rate limit state by using unique keys per test
  });

  it("allows the first request", () => {
    const key = `test-${Date.now()}-first`;
    const result = checkRateLimit(key, 5, 60000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("decrements remaining count with each request", () => {
    const key = `test-${Date.now()}-decrement`;
    checkRateLimit(key, 5, 60000);
    const result = checkRateLimit(key, 5, 60000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(3);
  });

  it("blocks requests after limit is reached", () => {
    const key = `test-${Date.now()}-block`;
    for (let i = 0; i < 3; i++) {
      checkRateLimit(key, 3, 60000);
    }
    const result = checkRateLimit(key, 3, 60000);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("resets after the window expires", () => {
    const key = `test-${Date.now()}-reset`;
    // Use a 1ms window so it expires immediately
    checkRateLimit(key, 1, 1);

    // Wait a tiny bit for the window to expire
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const result = checkRateLimit(key, 1, 1);
        expect(result.allowed).toBe(true);
        resolve();
      }, 10);
    });
  });

  it("tracks different keys independently", () => {
    const base = Date.now();
    const key1 = `test-${base}-user1`;
    const key2 = `test-${base}-user2`;

    // Exhaust key1
    checkRateLimit(key1, 1, 60000);

    // key2 should still be allowed
    const result = checkRateLimit(key2, 1, 60000);
    expect(result.allowed).toBe(true);
  });

  it("returns correct resetIn value", () => {
    const key = `test-${Date.now()}-resetin`;
    const windowMs = 60000;
    const result = checkRateLimit(key, 5, windowMs);
    expect(result.resetIn).toBeLessThanOrEqual(windowMs);
    expect(result.resetIn).toBeGreaterThan(0);
  });
});
