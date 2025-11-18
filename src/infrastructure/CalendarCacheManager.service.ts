/**
 * Calendar Cache Manager Service
 * Handles caching logic for calendar data
 */

import { Calendar } from '../core';
import logger from './logger';

/**
 * Cache entry structure
 */
interface CalendarCacheEntry {
  calendars: Calendar[];
  timestamp: number;
  elements: Map<string, Element>;
}

/**
 * Service responsible for managing calendar data cache
 */
export class CalendarCacheManager {
  private static readonly CACHE_DURATION = 5000; // 5 seconds
  private calendarCache: CalendarCacheEntry | null = null;

  /**
   * Get cached calendars if cache is valid
   */
  getCachedCalendars(): Calendar[] | null {
    if (!this.calendarCache) {
      return null;
    }

    if (!this.isCacheValid()) {
      logger.debug('Calendar cache expired');
      this.clearCache();
      return null;
    }

    logger.info(`Using cached calendar discovery (${this.calendarCache.calendars.length} calendars)`);
    return this.calendarCache.calendars;
  }

  /**
   * Set cached calendars
   */
  setCachedCalendars(calendars: Calendar[], elementMap: Map<string, Element>): void {
    this.calendarCache = {
      calendars: [...calendars], // Create a copy
      timestamp: Date.now(),
      elements: elementMap
    };

    logger.info(`Cached ${calendars.length} calendars for ${CalendarCacheManager.CACHE_DURATION}ms.`);
  }

  /**
   * Get cached element for a specific calendar email
   */
  getCachedElement(email: string): Element | null {
    if (!this.calendarCache || !this.isCacheValid()) {
      return null;
    }

    const cachedElement = this.calendarCache.elements.get(email);
    if (cachedElement) {
      logger.debug(`Using cached element for calendar: ${email}`);
      return cachedElement;
    }

    return null;
  }

  /**
   * Check if cache is valid (not expired)
   */
  isCacheValid(): boolean {
    if (!this.calendarCache) {
      return false;
    }

    return (Date.now() - this.calendarCache.timestamp) < CalendarCacheManager.CACHE_DURATION;
  }

  /**
   * Clear the calendar cache
   */
  clearCache(): void {
    logger.info('Clearing calendar cache');
    this.calendarCache = null;
  }

  /**
   * Invalidate cache (alias for clearCache)
   */
  invalidateCache(): void {
    if (this.calendarCache) {
      logger.debug('Invalidating calendar cache due to DOM changes');
      this.clearCache();
    }
  }

  /**
   * Log performance metrics for debugging
   */
  logPerformanceMetrics(): void {
    const cacheStatus = this.calendarCache 
      ? `Cache: ${this.calendarCache.calendars.length} calendars, age: ${Date.now() - this.calendarCache.timestamp}ms`
      : 'Cache: empty';
    
    logger.info(`📊 CalendarCacheManager Performance - ${cacheStatus}`);
  }
}
