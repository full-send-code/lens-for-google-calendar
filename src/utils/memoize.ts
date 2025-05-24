/**
 * Memoization utilities for optimizing function performance
 */

/**
 * Options for the memoize function
 */
interface MemoizeOptions {
  /** Maximum number of results to cache */
  maxSize?: number;
  /** Time in milliseconds before cache entry expires */
  expireAfter?: number;
}

/**
 * Cache entry data structure
 */
interface CacheEntry<T> {
  /** Cached result value */
  value: T;
  /** Timestamp when this entry was created */
  timestamp: number;
}

/**
 * Memoize a function to cache its results based on arguments
 * @param fn Function to memoize
 * @param options Caching options
 * @returns Memoized function with same signature as original
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  options: MemoizeOptions = {}
): T {
  const cache = new Map<string, CacheEntry<ReturnType<T>>>();
  const { maxSize = 100, expireAfter } = options;
  
  // Track cache access order for LRU eviction
  const accessOrder: string[] = [];
  
  function memoized(this: any, ...args: Parameters<T>): ReturnType<T> {
    // Create a cache key from the arguments
    const key = JSON.stringify(args);
    
    const now = Date.now();
    
    // Check if we have a cached result
    if (cache.has(key)) {
      const entry = cache.get(key)!;
      
      // Check if cache entry has expired
      if (expireAfter && now - entry.timestamp > expireAfter) {
        cache.delete(key);
        
        // Remove from access order
        const index = accessOrder.indexOf(key);
        if (index !== -1) {
          accessOrder.splice(index, 1);
        }
      } else {
        // Update access order (move to end)
        const index = accessOrder.indexOf(key);
        if (index !== -1) {
          accessOrder.splice(index, 1);
        }
        accessOrder.push(key);
        
        return entry.value;
      }
    }
    
    // Calculate result if not cached or expired
    const result = fn.apply(this, args);
    
    // Store result in cache
    cache.set(key, { 
      value: result, 
      timestamp: now 
    });
    
    // Update access order
    accessOrder.push(key);
    
    // Evict least recently used entries if cache is too large
    if (maxSize && cache.size > maxSize) {
      const oldestKey = accessOrder.shift();
      if (oldestKey) {
        cache.delete(oldestKey);
      }
    }
    
    return result;
  }
  
  // Return memoized function with same type as original
  return memoized as T;
}

/**
 * Create a function that returns cached results until a specific time has passed
 * @param fn Function to cache
 * @param ms Milliseconds to cache results for
 * @returns Function that uses cached results when appropriate
 */
export function cacheFor<T extends (...args: any[]) => any>(
  fn: T,
  ms: number
): T {
  let lastResult: ReturnType<T> | undefined;
  let lastTimestamp = 0;
  
  function cached(this: any, ...args: Parameters<T>): ReturnType<T> {
    const now = Date.now();
    
    // Return cached result if still valid
    if (lastTimestamp && now - lastTimestamp < ms) {
      return lastResult as ReturnType<T>;
    }
    
    // Calculate new result
    const result = fn.apply(this, args);
    
    // Update cache
    lastResult = result;
    lastTimestamp = now;
    
    return result;
  }
  
  return cached as T;
}
