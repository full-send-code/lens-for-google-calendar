/**
 * Google Calendar Repository Implementation
 * Handles DOM interaction with Google Calendar's virtual-scrolled calendar list
 */

import { CalendarRepository, Calendar, CalendarState } from '../core';
import { CalendarDOMSelector } from './CalendarDOMSelector.service';
import { CalendarDataExtractor } from './CalendarDataExtractor.service';
import { CalendarCacheManager } from './CalendarCacheManager.service';
import { VirtualScrollHandler } from './VirtualScrollHandler.service';
import { CalendarVisibilityManager } from './CalendarVisibilityManager.service';
import logger from './logger';

/**
 * Implementation of CalendarRepository for Google Calendar DOM interaction
 * Orchestrates specialized services for calendar discovery and visibility management
 */
export class GoogleCalendarRepository implements CalendarRepository {
  private readonly domSelector: CalendarDOMSelector;
  private readonly dataExtractor: CalendarDataExtractor;
  private readonly cacheManager: CalendarCacheManager;
  private readonly virtualScrollHandler: VirtualScrollHandler;
  private readonly visibilityManager: CalendarVisibilityManager;

  constructor() {
    // Initialize services with dependency injection
    this.domSelector = new CalendarDOMSelector();
    this.dataExtractor = new CalendarDataExtractor();
    this.cacheManager = new CalendarCacheManager();
    this.virtualScrollHandler = new VirtualScrollHandler(this.domSelector, this.cacheManager);
    this.visibilityManager = new CalendarVisibilityManager(this.domSelector, this.dataExtractor, this.cacheManager);
  }

  /**
   * Discover all calendars in Google Calendar
   * Handles virtual scrolling to ensure all calendars are found
   * Uses caching to avoid redundant expensive operations
   */
  async discoverCalendars(forceRefresh: boolean = false): Promise<Calendar[]> {
    try {
      // Check cache first (unless forcing refresh)
      if (!forceRefresh) {
        const cachedCalendars = this.cacheManager.getCachedCalendars();
        if (cachedCalendars) {
          return cachedCalendars;
        }
      }

      logger.info('Starting fresh calendar discovery...');
      
      // Find all calendar containers (This already handles virtual scrolling)
      const calendarContainers = await this.findAllCalendarContainers();
      logger.info(`Found ${calendarContainers.length} calendar containers`);
      
      const calendars: Calendar[] = [];
      const elementMap = new Map<string, Element>();

      // Process each calendar container
      for (const container of calendarContainers) {
        const containerLabel = container.getAttribute('aria-label') || 'Unknown';
        logger.info(`Processing container: ${containerLabel}`);
        
        // Note: Virtual scrolling is already done in findAllCalendarContainers()
        // Extract calendar data from this container
        const calendarElements = this.domSelector.getCalendarElementsInContainer(container);
        logger.info(`Found ${calendarElements.length} calendar elements in container: ${containerLabel}`);
        
        for (const element of calendarElements) {
          try {
            const calendarData = this.dataExtractor.extractCalendarData(element);
            if (calendarData) {
              calendars.push(new Calendar(calendarData));
              elementMap.set(calendarData.email, element); // Cache element for later use
              logger.info(`Successfully extracted calendar: ${calendarData.name} (${calendarData.email})`);
            } else {
              logger.info('Failed to extract calendar data from element:', element);
            }
          } catch (error) {
            logger.warn('Failed to extract calendar data from element:', element, error);
          }
        }
      }

      // If no calendars found in containers, fall back to global search
      // (Virtual scrolling has already been performed, so all calendars should be rendered)
      if (calendars.length === 0) {
        logger.info('No calendars found in containers, falling back to global search after virtual scroll');
        const globalElements = this.domSelector.getCalendarElements();
        logger.info(`Found ${globalElements.length} calendar elements globally`);
        
        for (const element of globalElements) {
          try {
            const calendarData = this.dataExtractor.extractCalendarData(element);
            if (calendarData) {
              calendars.push(new Calendar(calendarData));
              elementMap.set(calendarData.email, element); // Cache element for later use
              logger.info(`Successfully extracted calendar: ${calendarData.name} (${calendarData.email})`);
            } else {
              logger.info('Failed to extract calendar data from element:', element);
            }
          } catch (error) {
            logger.warn('Failed to extract calendar data from element:', element, error);
          }
        }
      }

      // Cache the results using the cache manager
      this.cacheManager.setCachedCalendars(calendars, elementMap);

      logger.info(`Discovery complete. Found ${calendars.length} calendars.`);
      return calendars;
    } catch (error) {
      logger.error('Calendar discovery failed:', error);
      throw new Error(`Failed to discover calendars: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Apply calendar visibility changes to Google Calendar
   * Optimized to batch operations and avoid redundant discovery calls
   */
  async applyCalendarVisibility(calendars: Calendar[]): Promise<void> {
    try {
      // Ensure we have current calendar discovery (but use cache if available)
      await this.discoverCalendars(false);
      
      // Delegate to visibility manager for batch processing
      await this.visibilityManager.applyBatchVisibilityChanges(calendars);
    } catch (error) {
      throw new Error(`Failed to apply calendar visibility: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get current state of all calendars
   * Uses cached state when available (within cache duration) for better performance
   * Only forces refresh when explicitly needed (app initialization, etc.)
   */
  async getCurrentCalendarStates(): Promise<Calendar[]> {
    return this.discoverCalendars(false); // Use cache when available for better performance
  }

  /**
   * Get fresh current state of all calendars (bypasses cache)
   * Use this only when you need guaranteed fresh state (app initialization, etc.)
   */
  async getCurrentCalendarStatesFresh(): Promise<Calendar[]> {
    return this.discoverCalendars(true); // Force refresh to get current state
  }

  /**
   * Find all calendar containers (My calendars, Other calendars, etc.)
   * Also handles virtual scrolling to ensure all calendars are rendered
   */
  private async findAllCalendarContainers(): Promise<Element[]> {
    try {
      logger.info('Finding calendar containers...');
      
      // First, wait for the main calendar list to be available
      const calendarList = await this.domSelector.waitForCalendarList();
      logger.info('Found main calendar list, performing virtual scroll to load all calendars...');
      
      // Perform virtual scrolling on the main calendar list to ensure all calendars are rendered
      await this.virtualScrollHandler.scrollToDiscoverAllCalendars(calendarList);
      
      logger.info('Virtual scroll complete, now searching for calendar containers...');
      
      // Try to expand collapsed sections before searching
      await this.virtualScrollHandler.expandCollapsedSections();
      
      // Find containers using the DOM selector service
      const containers = this.domSelector.findCalendarContainers();
      
      // Additional handling for "Other calendars" containers
      for (const container of containers) {
        const label = container.getAttribute('aria-label')?.toLowerCase() || '';
        // If this is the "Other calendars" container, try to scroll it specifically
        if (label.includes('other')) {
          logger.info('Found "Other calendars" container, performing specific scroll...');
          await this.virtualScrollHandler.scrollToDiscoverAllCalendars(container);
        }
      }
      
      if (containers.length === 0) {
        logger.info('No specific containers found, using main calendar list as fallback');
        containers.push(calendarList);
      }
      
      logger.info(`Found ${containers.length} calendar containers`);
      return containers;
      
    } catch (error) {
      logger.warn('Error finding calendar containers:', error);
      // Fallback to a dummy container that will trigger global search
      const dummyContainer = document.createElement('div');
      dummyContainer.setAttribute('aria-label', 'Global Search Fallback');
      return [dummyContainer];
    }
  }

















  /**
   * Clear the calendar cache to force fresh discovery
   */
  public clearCache(): void {
    this.cacheManager.clearCache();
  }

  /**
   * Log performance metrics for debugging
   */
  public logPerformanceMetrics(): void {
    this.cacheManager.logPerformanceMetrics();
  }

  /**
   * Find calendar element by email (delegated to visibility manager)
   */
  public async findCalendarElementByEmail(email: string): Promise<Element | null> {
    return this.visibilityManager.findCalendarElementByEmail(email);
  }

  /**
   * Set individual calendar visibility (for external use)
   */
  public async setCalendarVisibility(email: string, isVisible: boolean): Promise<void> {
    await this.visibilityManager.setCalendarVisibility(email, isVisible);
  }
}