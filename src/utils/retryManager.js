// src/utils/retryManager.js - Shared retry logic
export class RetryManager {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.baseDelay = options.baseDelay || 1000;
    this.maxDelay = options.maxDelay || 10000;
    this.backoffFactor = options.backoffFactor || 2;
  }

  async retry(fn, _context = {}) {
    let lastError;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        if (attempt < this.maxRetries) {
          const delay = Math.min(
            this.baseDelay * Math.pow(this.backoffFactor, attempt),
            this.maxDelay
          );

          console.warn(
            `🔁 Retry ${attempt + 1}/${this.maxRetries} after ${delay}ms:`,
            error.message
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }
}
