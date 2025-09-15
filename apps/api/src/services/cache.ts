interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class CacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly defaultTTL = 60 * 1000; // 1 minute default

  /**
   * Get data from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      console.log(`📦 Cache MISS for key: ${key}`);
      return null;
    }

    const now = Date.now();
    const isExpired = (now - entry.timestamp) > entry.ttl;

    if (isExpired) {
      console.log(`⏰ Cache EXPIRED for key: ${key} (age: ${Math.floor((now - entry.timestamp) / 1000)}s)`);
      this.cache.delete(key);
      return null;
    }

    const age = Math.floor((now - entry.timestamp) / 1000);
    console.log(`📦 Cache HIT for key: ${key} (age: ${age}s)`);
    return entry.data;
  }

  /**
   * Set data in cache
   */
  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl
    };

    this.cache.set(key, entry);
    console.log(`💾 Cache SET for key: ${key} (TTL: ${ttl / 1000}s)`);
  }

  /**
   * Delete specific cache entry
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      console.log(`🗑️ Cache DELETED for key: ${key}`);
    }
    return deleted;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`🧹 Cache CLEARED (${size} entries removed)`);
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[]; entries: Array<{ key: string; age: number; ttl: number }> } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      age: Math.floor((now - entry.timestamp) / 1000),
      ttl: Math.floor(entry.ttl / 1000)
    }));

    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      entries
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if ((now - entry.timestamp) > entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cache CLEANUP: removed ${cleaned} expired entries`);
    }

    return cleaned;
  }

  /**
   * Cache with automatic cleanup
   */
  getWithCleanup<T>(key: string): T | null {
    // Clean up expired entries occasionally
    if (Math.random() < 0.1) { // 10% chance
      this.cleanup();
    }
    
    return this.get<T>(key);
  }
}

// Global cache instance
export const cacheService = new CacheService();

// Auto-cleanup every 5 minutes
setInterval(() => {
  cacheService.cleanup();
}, 5 * 60 * 1000);