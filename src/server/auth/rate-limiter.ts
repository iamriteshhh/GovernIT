/**
 * Lightweight In-Memory Rate Limiter with Backoff and Lockout
 * Provides brute-force protection for sensitive endpoints without external infrastructure.
 */

interface RateLimitRecord {
  attempts: number;
  firstAttemptAt: number;
  lockedUntil?: number;
}

export class InMemoryRateLimiter {
  private records = new Map<string, RateLimitRecord>();
  private readonly maxAttempts: number;
  private readonly windowMs: number;
  private readonly lockoutMs: number;

  constructor(options: { maxAttempts?: number; windowMs?: number; lockoutMs?: number } = {}) {
    this.maxAttempts = options.maxAttempts ?? 5; // max 5 failed attempts
    this.windowMs = options.windowMs ?? 15 * 60 * 1000; // within 15 min window
    this.lockoutMs = options.lockoutMs ?? 15 * 60 * 1000; // 15 min lockout cooldown
  }

  public check(key: string): { allowed: boolean; remainingAttempts: number; retryAfterSeconds?: number } {
    this.prune();
    const now = Date.now();
    const record = this.records.get(key);

    if (!record) {
      return { allowed: true, remainingAttempts: this.maxAttempts };
    }

    if (record.lockedUntil && record.lockedUntil > now) {
      const retryAfterSeconds = Math.ceil((record.lockedUntil - now) / 1000);
      return { allowed: false, remainingAttempts: 0, retryAfterSeconds };
    }

    // If window expired, reset
    if (now - record.firstAttemptAt > this.windowMs) {
      this.records.delete(key);
      return { allowed: true, remainingAttempts: this.maxAttempts };
    }

    const remaining = Math.max(0, this.maxAttempts - record.attempts);
    return {
      allowed: remaining > 0,
      remainingAttempts: remaining,
      retryAfterSeconds: remaining === 0 ? Math.ceil(this.lockoutMs / 1000) : undefined,
    };
  }

  public recordFailure(key: string): { remainingAttempts: number; isLocked: boolean; retryAfterSeconds?: number } {
    const now = Date.now();
    let record = this.records.get(key);

    if (!record || now - record.firstAttemptAt > this.windowMs) {
      record = { attempts: 1, firstAttemptAt: now };
    } else {
      record.attempts += 1;
    }

    if (record.attempts >= this.maxAttempts) {
      record.lockedUntil = now + this.lockoutMs;
      this.records.set(key, record);
      console.warn(`[SECURITY AUDIT] Rate limit lockout triggered for key: ${key}. Locked for ${this.lockoutMs / 1000}s`);
      return {
        remainingAttempts: 0,
        isLocked: true,
        retryAfterSeconds: Math.ceil(this.lockoutMs / 1000),
      };
    }

    this.records.set(key, record);
    return {
      remainingAttempts: Math.max(0, this.maxAttempts - record.attempts),
      isLocked: false,
    };
  }

  public recordSuccess(key: string): void {
    this.records.delete(key);
  }

  public reset(): void {
    this.records.clear();
  }

  private prune(): void {
    const now = Date.now();
    for (const [key, record] of this.records.entries()) {
      if (record.lockedUntil && record.lockedUntil < now) {
        this.records.delete(key);
      } else if (!record.lockedUntil && now - record.firstAttemptAt > this.windowMs) {
        this.records.delete(key);
      }
    }
  }
}

// Global login rate limiter instance
export const loginRateLimiter = new InMemoryRateLimiter({
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000,
  lockoutMs: 15 * 60 * 1000,
});

/**
 * High-performance sliding window rate limiter for general API routes.
 * Protects against aggressive scraping, request flooding, and API abuse.
 */
export class ApiRateLimiter {
  private requests = new Map<string, { count: number; windowStart: number }>();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(options: { maxRequests?: number; windowMs?: number } = {}) {
    this.maxRequests = options.maxRequests ?? 100;
    this.windowMs = options.windowMs ?? 60 * 1000; // 1 minute
  }

  public check(key: string): { allowed: boolean; remaining: number; retryAfterSeconds?: number } {
    const now = Date.now();
    this.prune(now);
    let record = this.requests.get(key);

    if (!record || now - record.windowStart > this.windowMs) {
      record = { count: 1, windowStart: now };
      this.requests.set(key, record);
      return { allowed: true, remaining: this.maxRequests - 1 };
    }

    if (record.count >= this.maxRequests) {
      const retryAfterSeconds = Math.max(1, Math.ceil((record.windowStart + this.windowMs - now) / 1000));
      return { allowed: false, remaining: 0, retryAfterSeconds };
    }

    record.count += 1;
    this.requests.set(key, record);
    return { allowed: true, remaining: this.maxRequests - record.count };
  }

  public reset(): void {
    this.requests.clear();
  }

  private prune(now: number = Date.now()): void {
    for (const [key, record] of this.requests.entries()) {
      if (now - record.windowStart > this.windowMs) {
        this.requests.delete(key);
      }
    }
  }
}

// Global API rate limiter (100 req/min per IP)
export const apiRateLimiter = new ApiRateLimiter({
  maxRequests: 100,
  windowMs: 60 * 1000,
});

// Contact and grievance form rate limiter (5 submissions per 15 minutes per IP)
export const contactRateLimiter = new InMemoryRateLimiter({
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000,
  lockoutMs: 15 * 60 * 1000,
});

