import { DatabaseConfig, ScrapingConfig } from '../types';

// Database configuration
export const getDatabaseConfig = (): DatabaseConfig => {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  // Parse DATABASE_URL format: mysql://user:password@host:port/database
  const url = new URL(databaseUrl);

  return {
    host: url.hostname,
    port: parseInt(url.port) || 3306,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1), // Remove leading slash
    ssl: url.searchParams.get('ssl') === 'true'
  };
};

// Scraping configuration
export const getScrapingConfig = (): ScrapingConfig => {
  return {
    baseUrl: 'https://www.royalroad.com',
    userAgent: 'RRCompanion-Serverless/1.0 (https://rrcompanion.com)',
    requestDelay: parseInt(process.env.REQUEST_DELAY || '1000'), // 1 second default
    maxRetries: parseInt(process.env.MAX_RETRIES || '3'),
    timeout: parseInt(process.env.REQUEST_TIMEOUT || '30000'), // 30 seconds default
    batchSize: parseInt(process.env.BATCH_SIZE || '10'),
    concurrentRequests: parseInt(process.env.CONCURRENT_REQUESTS || '5')
  };
};

// Lambda timeout configuration
export const getLambdaConfig = (lambdaContext?: any) => {
  const ctx = lambdaContext || context;
  const remainingTime = ctx.getRemainingTimeInMillis();
  const bufferTime = 30000; // 30 seconds buffer

  return {
    maxExecutionTime: remainingTime - bufferTime,
    isNearTimeout: remainingTime < 60000, // Less than 1 minute remaining
    shouldStop: remainingTime < bufferTime
  };
};

// Helper to check if we should continue processing
export const shouldContinueProcessing = (startTime: number, maxExecutionTime: number): boolean => {
  const elapsed = Date.now() - startTime;
  return elapsed < maxExecutionTime;
};

// Helper to create timeout-aware delay
export const createTimeoutAwareDelay = (ms: number, maxExecutionTime: number, startTime: number): Promise<void> => {
  return new Promise((resolve) => {
    const elapsed = Date.now() - startTime;
    const remainingTime = maxExecutionTime - elapsed;

    if (remainingTime <= 0) {
      resolve();
      return;
    }

    const delayTime = Math.min(ms, remainingTime);
    setTimeout(resolve, delayTime);
  });
};

// Error handling utilities
export class ScrapingError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = false,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'ScrapingError';
  }
}

export const handleScrapingError = (error: any): ScrapingError => {
  if (error instanceof ScrapingError) {
    return error;
  }

  // Network errors are usually retryable
  if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
    return new ScrapingError(
      `Network error: ${error.message}`,
      error.code,
      true,
      error
    );
  }

  // HTTP errors
  if (error.response) {
    const status = error.response.status;
    const retryable = status >= 500 || status === 429; // Server errors and rate limiting

    return new ScrapingError(
      `HTTP ${status}: ${error.response.statusText}`,
      `HTTP_${status}`,
      retryable,
      error
    );
  }

  // Generic error
  return new ScrapingError(
    error.message || 'Unknown error occurred',
    'UNKNOWN',
    false,
    error
  );
};

// Batch processing utilities
export const createBatchProcessor = <T>(
  items: T[],
  batchSize: number,
  processor: (batch: T[]) => Promise<any>,
  onProgress?: (processed: number, total: number) => void
) => {
  return async (): Promise<any[]> => {
    const results: any[] = [];

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResult = await processor(batch);
      results.push(batchResult);

      if (onProgress) {
        onProgress(Math.min(i + batchSize, items.length), items.length);
      }
    }

    return results;
  };
};

// Context mock for local development
const context = {
  getRemainingTimeInMillis: () => {
    // In local development, return a large number
    return process.env.NODE_ENV === 'development' ? 900000 : 300000;
  }
};

export { context };
