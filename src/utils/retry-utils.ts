import { RetryableError, APIQuotaExceededError } from '../types/errors.js';

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number; // Base delay in milliseconds
  maxDelay: number; // Maximum delay in milliseconds
  backoffMultiplier: number; // Exponential backoff multiplier
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
};

/**
 * Retry utility for handling API calls with exponential backoff
 */
export class RetryUtil {
  /**
   * Execute a function with retry logic
   */
  static async executeWithRetry<T>(
    fn: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
    let lastError: Error;

    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        // Don't retry on the last attempt
        if (attempt === retryConfig.maxRetries) {
          break;
        }

        // Check if error is retryable
        if (!this.isRetryableError(error)) {
          throw error;
        }

        // Calculate delay with exponential backoff
        const delay = this.calculateDelay(attempt, retryConfig);
        
        console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, error);
        
        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  /**
   * Check if an error is retryable
   */
  private static isRetryableError(error: any): boolean {
    // Network errors
    if (error.code === 'ECONNRESET' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
      return true;
    }

    // HTTP status codes that are retryable
    if (error.status || error.statusCode) {
      const status = error.status || error.statusCode;
      return status >= 500 || status === 429; // Server errors or rate limiting
    }

    // Google API specific errors
    if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
      return true;
    }

    // RetryableError instances
    if (error instanceof RetryableError) {
      return true;
    }

    return false;
  }

  /**
   * Calculate delay with exponential backoff
   */
  private static calculateDelay(attempt: number, config: RetryConfig): number {
    const delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt);
    return Math.min(delay, config.maxDelay);
  }

  /**
   * Sleep for specified milliseconds
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Handle Google API quota errors specifically
   */
  static async handleQuotaError(error: any): Promise<never> {
    if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
      throw new APIQuotaExceededError();
    }
    throw error;
  }
}

/**
 * Rate limiter for API calls
 */
export class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 60, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Check if request is allowed and record it
   */
  async checkRateLimit(): Promise<void> {
    const now = Date.now();
    
    // Remove old requests outside the window
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    // Check if we're at the limit
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.windowMs - (now - oldestRequest);
      
      if (waitTime > 0) {
        await this.sleep(waitTime);
        return this.checkRateLimit();
      }
    }
    
    // Record this request
    this.requests.push(now);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

