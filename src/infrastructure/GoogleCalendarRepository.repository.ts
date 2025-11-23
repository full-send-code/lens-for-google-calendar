/**
 * Google Calendar Repository Implementation
 * Handles DOM interaction with Google Calendar's virtual-scrolled calendar list
 */

import { CalendarRepository, Calendar, CalendarState } from '../core';
import { CalendarDOMSelector } from './CalendarDOMSelector.service';
import { CalendarDataExtractor } from './CalendarDataExtractor.service';
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
  private readonly virtualScrollHandler: VirtualScrollHandler;
  private readonly visibilityManager: CalendarVisibilityManager;

  constructor() {
    // Initialize services with dependency injection
    this.domSelector = new CalendarDOMSelector();
    this.dataExtractor = new CalendarDataExtractor();
    this.virtualScrollHandler = new VirtualScrollHandler(this.domSelector);
    this.visibilityManager = new CalendarVisibilityManager(this.domSelector, this.dataExtractor, this.virtualScrollHandler);
  }

  /**
   * Discover all calendars in Google Calendar
   * Delegates to VirtualScrollHandler for element discovery and CalendarDataExtractor for data extraction
   */
  async discoverCalendars(forceRefresh: boolean = false): Promise<Calendar[]> {
    try {
      logger.info('Starting calendar discovery...');

      // Delegate to VirtualScrollHandler for element discovery (handles scrolling and expansion)
      const calendarElements = await this.virtualScrollHandler.discoverCalendars();
      logger.info(`VirtualScrollHandler discovered ${calendarElements.length} calendar elements`);

      if (calendarElements.length === 0) {
        logger.warn('No calendars discovered by VirtualScrollHandler, falling back to global search');
        const fallbackElements = this.domSelector.getCalendarElements();
        logger.info(`Global search found ${fallbackElements.length} calendar elements`);
        // Use fallback elements
        const calendars: Calendar[] = [];
        for (const element of fallbackElements) {
          try {
            const calendarData = this.dataExtractor.extractCalendarData(element);
            if (calendarData) {
              calendars.push(new Calendar(calendarData));
              logger.info(`Successfully extracted calendar: ${calendarData.name} (${calendarData.email})`);
            } else {
              logger.debug('Failed to extract calendar data from element - no data returned');
            }
          } catch (error) {
            logger.warn('Failed to extract calendar data from element:', error);
          }
        }
        logger.info(`Fallback discovery complete. Found ${calendars.length} calendars.`);
        return calendars;
      }

      const calendars: Calendar[] = [];

      // Delegate to CalendarDataExtractor for data extraction from each element
      for (const element of calendarElements) {
        try {
          const calendarData = this.dataExtractor.extractCalendarData(element);
          if (calendarData) {
            calendars.push(new Calendar(calendarData));
            logger.info(`Successfully extracted calendar: ${calendarData.name} (${calendarData.email})`);
          } else {
            logger.debug('Failed to extract calendar data from element - no data returned');
          }
        } catch (error) {
          logger.warn('Failed to extract calendar data from element:', error);
        }
      }

      logger.info(`Discovery complete. Found ${calendars.length} calendars.`);
      return calendars;
    } catch (error) {
      logger.error('Calendar discovery failed:', error);
      throw new Error(`Failed to discover calendars: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Apply calendar visibility changes to Google Calendar
   * Uses optimized scrolling approach for clear all, traditional approach for selective visibility
   */
  async applyCalendarVisibility(calendars: Calendar[]): Promise<void> {
    try {
      logger.info(`Applying visibility for ${calendars.length} calendars`);

      // Build set of emails that should be visible
      const desiredVisible = new Set<string>(
        calendars.filter(c => c.isVisible).map(c => c.email)
      );

      logger.info(`${desiredVisible.size} calendars should be visible`);

      // Special case: if no calendars should be visible (clear all), use optimized scrolling approach
      if (desiredVisible.size === 0) {
        await this.applyCalendarVisibilityByScrolling(desiredVisible);
        return;
      }

      // For selective visibility changes, use the traditional approach
      // This maintains compatibility with existing tests and behavior
      const allCalendarElements = await this.virtualScrollHandler.discoverCalendars();
      logger.info(`Processing ${allCalendarElements.length} discovered calendar elements`);

      // Process all calendar elements
      for (const element of allCalendarElements) {
        await this.visibilityManager.processCalendarElement(element, desiredVisible);
      }

      logger.info('Calendar visibility application complete');
    } catch (error) {
      throw new Error(`Failed to apply calendar visibility: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get current state of all calendars
   */
  async getCurrentCalendarStates(): Promise<Calendar[]> {
    return this.discoverCalendars(false);
  }

  /**
   * Get fresh current state of all calendars
   */
  async getCurrentCalendarStatesFresh(): Promise<Calendar[]> {
    return this.discoverCalendars(true);
  }

  /**
   * Find calendar element by email (delegated to visibility manager)
   */
  public async findCalendarElementByEmail(email: string): Promise<Element | null> {
    return this.visibilityManager.findCalendarElementByEmail(email);
  }

  /**
   * Optimized method to apply calendar visibility by scrolling through the list
   * Much faster than discovering all calendars first, then processing individually
   */
  private async applyCalendarVisibilityByScrolling(desiredVisible: Set<string>): Promise<void> {
    logger.info('🌀 Starting optimized calendar visibility application by scrolling');

    try {
      // Use VirtualScrollHandler's scrollAndProcessCalendars method
      // This handles all the scrolling logic and calls our processor for each batch of visible elements
      await this.virtualScrollHandler.scrollAndProcessCalendars(async (visibleElements: Element[]) => {
        logger.debug(`🌀 Processing batch of ${visibleElements.length} visible calendar elements`);

        // Process all visible elements (apply desired visibility state)
        for (const element of visibleElements) {
          try {
            await this.visibilityManager.processCalendarElement(element, desiredVisible);
          } catch (error) {
            logger.warn('🌀 Error processing calendar element:', error);
          }
        }
      });

      logger.info('🌀 Optimized visibility application complete');
    } catch (error) {
      logger.error('🌀 Failed to apply calendar visibility by scrolling:', error);
      throw error;
    }
  }

  /**
   * Set individual calendar visibility (for external use)
   */
  public async setCalendarVisibility(email: string, isVisible: boolean): Promise<void> {
    await this.visibilityManager.setCalendarVisibility(email, isVisible);
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}