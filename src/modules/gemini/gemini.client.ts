// ============================================================================
// GEMINI CLIENT
// ============================================================================

// External Libraries
import { GoogleGenAI } from '@google/genai';

// Config
import { GEMINI_API_KEY, RATE_LIMIT_CONFIG } from './config/gemini.config.js';

// Utils
import { createLogger } from '../../utils/helpers/logger.js';

const logger = createLogger('GeminiClient');

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

class GeminiRateLimiter {
  private readonly windows: Map<string, number[]> = new Map();

  private getWindow(feature: string): number[] {
    if (!this.windows.has(feature)) this.windows.set(feature, []);
    return this.windows.get(feature)!;
  }

  private prune(timestamps: number[]): number[] {
    const cutoff = Date.now() - RATE_LIMIT_CONFIG.windowMs;
    return timestamps.filter((t) => t > cutoff);
  }

  getStatus(feature: string): { remaining: number; resetInMs: number; allowed: boolean } {
    const now = Date.now();
    const pruned = this.prune(this.getWindow(feature));
    const remaining = Math.max(0, RATE_LIMIT_CONFIG.requestsPerMinute - pruned.length);
    const oldest = pruned[0] ?? now;
    const resetInMs = Math.max(0, RATE_LIMIT_CONFIG.windowMs - (now - oldest));
    return { remaining, resetInMs, allowed: remaining > 0 };
  }

  consume(feature: string): void {
    const status = this.getStatus(feature);

    if (!status.allowed) {
      const err = new Error(
        `Rate limit exceeded for "${feature}". Retry in ${Math.ceil(status.resetInMs / 1_000)}s.`,
      ) as Error & { code: string; retryAfterMs: number };
      err.code = 'RATE_LIMIT';
      err.retryAfterMs = status.resetInMs;
      throw err;
    }

    const pruned = this.prune(this.getWindow(feature));
    pruned.push(Date.now());
    this.windows.set(feature, pruned);
  }
}

const isRateLimitError = (error: unknown): boolean => {
  let message = '';
  let errorStr = '';
  let is429 = false;

  if (error instanceof Error) {
    message = error.message;
    errorStr = JSON.stringify({ message: error.message, name: error.name });
  } else if (isRecord(error)) {
    errorStr = JSON.stringify(error);
    if (typeof error['message'] === 'string') message = error['message'];
    if (error['status'] === 429 || error['code'] === 429) is429 = true;
    const nested = error['error'];
    if (isRecord(nested) && nested['code'] === 429) is429 = true;
  } else {
    errorStr = String(error);
  }

  const lower = message.toLowerCase();
  return (
    is429 ||
    errorStr.includes('429') ||
    errorStr.includes('RESOURCE_EXHAUSTED') ||
    lower.includes('quota') ||
    lower.includes('limit') ||
    lower.includes('exceeded')
  );
};

export class GeminiClient {
  private static instance: GeminiClient | undefined;

  private readonly ai: GoogleGenAI;
  private readonly rateLimiter: GeminiRateLimiter;

  private globalBackoffUntil: number = 0;

  private requestSlotQueue: Promise<void> = Promise.resolve();

  private constructor() {
    this.ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    this.rateLimiter = new GeminiRateLimiter();

    logger.info('GeminiClient initialised (singleton)');
  }

  static getInstance(): GeminiClient {
    if (!GeminiClient.instance) {
      if (!GEMINI_API_KEY.trim()) {
        throw new Error(
          'GEMINI_API_KEY is not configured. Set it in server/src/modules/gemini/config/gemini.config.ts',
        );
      }
      GeminiClient.instance = new GeminiClient();
    }
    return GeminiClient.instance;
  }

  get models() {
    return this.ai.models;
  }

  getRateLimitStatus(feature: string) {
    return this.rateLimiter.getStatus(feature);
  }

  async call<T>(fn: () => Promise<T>, feature: string): Promise<T> {
    this.rateLimiter.consume(feature);

    const { maxRetries, initialBackoffMs, jitterMs, slotDelayMs } = RATE_LIMIT_CONFIG;
    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      if (attempt === 0) {
        let releaseSlot!: () => void;
        const previousSlot = this.requestSlotQueue;
        this.requestSlotQueue = new Promise<void>((resolve) => {
          releaseSlot = resolve;
        });
        await previousSlot;
        await delay(slotDelayMs);
        releaseSlot();
      }

      const now = Date.now();
      if (now < this.globalBackoffUntil) {
        const wait = this.globalBackoffUntil - now + Math.random() * 1_000;
        logger.warn(`Global backoff active — waiting ${Math.round(wait)}ms (attempt ${attempt + 1})`);
        await delay(wait);
      }

      try {
        return await fn();
      } catch (error) {
        lastError = error;

        if (isRateLimitError(error) && attempt < maxRetries) {
          const backoff = initialBackoffMs * Math.pow(2, attempt) + Math.random() * jitterMs;
          this.globalBackoffUntil = Date.now() + backoff;
          logger.warn(
            `Gemini rate limit hit — retrying in ${Math.round(backoff)}ms ` +
              `(attempt ${attempt + 1}/${maxRetries})`,
          );
          await delay(backoff);
          continue;
        }

        throw error;
      }
    }

    throw lastError;
  }
}
