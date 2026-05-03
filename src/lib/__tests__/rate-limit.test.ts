// ============================================
// Tests: Rate Limiter
// ============================================

import { describe, it, expect, beforeEach, vi } from "vitest";
import { rateLimit } from "@/lib/rate-limit";

describe("rateLimit", () => {
  beforeEach(() => {
    // Clear the internal attempts map by using a fresh import
    // Since the module uses a module-level Map, we need vi.resetModules()
    vi.resetModules();
  });

  it("allows the first 5 attempts", async () => {
    // Re-import to get fresh module state
    const { rateLimit: freshRateLimit } = await import("@/lib/rate-limit");

    for (let i = 0; i < 5; i++) {
      const result = freshRateLimit("test-key");
      expect(result.success).toBe(true);
    }
  });

  it("blocks the 6th attempt", async () => {
    const { rateLimit: freshRateLimit } = await import("@/lib/rate-limit");

    for (let i = 0; i < 5; i++) {
      freshRateLimit("block-test");
    }
    const result = freshRateLimit("block-test");
    expect(result.success).toBe(false);
    expect(result.retryAfter).toBeDefined();
    expect(typeof result.retryAfter).toBe("number");
    expect(result.retryAfter!).toBeGreaterThan(0);
  });

  it("resets after window expires", async () => {
    // Use a very short window for testing (1ms)
    const { rateLimit: freshRateLimit } = await import("@/lib/rate-limit");

    // Exhaust the limit with a 1ms window
    for (let i = 0; i < 5; i++) {
      freshRateLimit("reset-test", 5, 1);
    }
    const blocked = freshRateLimit("reset-test", 5, 1);
    expect(blocked.success).toBe(false);

    // Wait for the window to expire
    await new Promise((resolve) => setTimeout(resolve, 10));

    const result = freshRateLimit("reset-test", 5, 1);
    expect(result.success).toBe(true);
  });

  it("tracks different keys independently", async () => {
    const { rateLimit: freshRateLimit } = await import("@/lib/rate-limit");

    // Exhaust key A
    for (let i = 0; i < 5; i++) {
      freshRateLimit("key-a", 5, 60000);
    }

    // Key B should still be allowed
    const result = freshRateLimit("key-b", 5, 60000);
    expect(result.success).toBe(true);
  });

  it("returns retryAfter in seconds", async () => {
    const { rateLimit: freshRateLimit } = await import("@/lib/rate-limit");

    // Use a 10-second window for predictable retryAfter
    for (let i = 0; i < 5; i++) {
      freshRateLimit("retry-test", 5, 10000);
    }
    const result = freshRateLimit("retry-test", 5, 10000);
    expect(result.success).toBe(false);
    expect(result.retryAfter!).toBeLessThanOrEqual(10);
    expect(result.retryAfter!).toBeGreaterThan(0);
  });
});
