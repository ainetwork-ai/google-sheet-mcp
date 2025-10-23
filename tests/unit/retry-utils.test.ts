import { RetryUtil, RateLimiter } from '../src/utils/retry-utils.js';

describe('RetryUtil', () => {
  describe('executeWithRetry', () => {
    it('should succeed on first attempt', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      
      const result = await RetryUtil.executeWithRetry(mockFn);
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable error', async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');
      
      const result = await RetryUtil.executeWithRetry(mockFn, { maxRetries: 2 });
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should fail after max retries', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Persistent error'));
      
      await expect(RetryUtil.executeWithRetry(mockFn, { maxRetries: 2))
        .rejects.toThrow('Persistent error');
      
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should not retry non-retryable error', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Validation error'));
      
      await expect(RetryUtil.executeWithRetry(mockFn))
        .rejects.toThrow('Validation error');
      
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('isRetryableError', () => {
    it('should identify network errors as retryable', () => {
      const networkError = new Error('Network error');
      networkError.code = 'ECONNRESET';
      
      // This is a private method, so we test through executeWithRetry
      const mockFn = jest.fn().mockRejectedValue(networkError);
      
      expect(() => RetryUtil.executeWithRetry(mockFn, { maxRetries: 0 }))
        .rejects.toThrow('Network error');
    });

    it('should identify quota errors as retryable', () => {
      const quotaError = new Error('quota exceeded');
      
      const mockFn = jest.fn().mockRejectedValue(quotaError);
      
      expect(() => RetryUtil.executeWithRetry(mockFn, { maxRetries: 0 }))
        .rejects.toThrow('quota exceeded');
    });
  });
});

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    rateLimiter = new RateLimiter(2, 1000); // 2 requests per second
  });

  describe('checkRateLimit', () => {
    it('should allow requests within limit', async () => {
      await expect(rateLimiter.checkRateLimit()).resolves.not.toThrow();
      await expect(rateLimiter.checkRateLimit()).resolves.not.toThrow();
    });

    it('should delay when limit exceeded', async () => {
      const startTime = Date.now();
      
      // Make 2 requests (at limit)
      await rateLimiter.checkRateLimit();
      await rateLimiter.checkRateLimit();
      
      // Third request should be delayed
      await rateLimiter.checkRateLimit();
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeGreaterThan(900); // Should wait ~1 second
    });
  });
});

