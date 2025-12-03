/**
 * Cache Service - Centralized cache management
 * Manages LRU caches for various purposes
 */

import { LRUCache } from 'lru-cache';

// Cache configurations
const CACHE_CONFIGS = {
  gzip: { max: 500, name: 'Gzip Cache' },
  fullList: { max: 50, name: 'Full List Cache' },
  colorName: { max: 1000, name: 'Color Name Cache' },
  rateLimit: { max: 10000, name: 'Rate Limit Cache' },
  closest: { max: 5000, name: 'Closest Color Cache' },
} as const;

type CacheType = keyof typeof CACHE_CONFIGS;

// Cache instances
const caches: Record<CacheType, LRUCache<string, unknown>> = {
  gzip: new LRUCache({ max: CACHE_CONFIGS.gzip.max }),
  fullList: new LRUCache({ max: CACHE_CONFIGS.fullList.max }),
  colorName: new LRUCache({ max: CACHE_CONFIGS.colorName.max }),
  rateLimit: new LRUCache({ max: CACHE_CONFIGS.rateLimit.max }),
  closest: new LRUCache({ max: CACHE_CONFIGS.closest.max }),
};

/**
 * Get a value from cache
 */
export function getFromCache<T>(type: CacheType, key: string): T | undefined {
  return caches[type].get(key) as T | undefined;
}

/**
 * Set a value in cache
 */
export function setInCache<T>(type: CacheType, key: string, value: T): void {
  caches[type].set(key, value);
}

/**
 * Check if key exists in cache
 */
export function hasInCache(type: CacheType, key: string): boolean {
  return caches[type].has(key);
}

/**
 * Delete a key from cache
 */
export function deleteFromCache(type: CacheType, key: string): void {
  caches[type].delete(key);
}

/**
 * Clear a specific cache
 */
export function clearCache(type: CacheType): void {
  caches[type].clear();
}

/**
 * Clear all caches
 */
export function clearAllCaches(): void {
  Object.values(caches).forEach(cache => cache.clear());
}

/**
 * Get cache statistics
 */
export function getCacheStats(): Record<string, { size: number; maxSize: number }> {
  const stats: Record<string, { size: number; maxSize: number }> = {};

  for (const [type, config] of Object.entries(CACHE_CONFIGS)) {
    const cache = caches[type as CacheType];
    stats[config.name] = {
      size: cache.size,
      maxSize: config.max,
    };
  }

  return stats;
}

/**
 * Get total cache memory usage estimate
 */
export function getTotalCacheSize(): number {
  return Object.values(caches).reduce((total, cache) => total + cache.size, 0);
}

/**
 * Get cache instance directly (for advanced usage)
 */
export function getCacheInstance<T>(type: CacheType): LRUCache<string, T> {
  return caches[type] as LRUCache<string, T>;
}
