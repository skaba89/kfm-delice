// ============================================
// KFM Delice — Simple In-Memory Rate Limiter
// ============================================

const attempts = new Map<string, { count: number; resetAt: number }>();

/**
 * Rate limit a given key.
 * Returns { success: true } if the request is allowed,
 * or { success: false, retryAfter: seconds } if the limit is exceeded.
 */
export function rateLimit(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000
): { success: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = attempts.get(key);

  if (!record || now > record.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true };
  }

  if (record.count >= maxAttempts) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return { success: false, retryAfter };
  }

  record.count++;
  return { success: true };
}
