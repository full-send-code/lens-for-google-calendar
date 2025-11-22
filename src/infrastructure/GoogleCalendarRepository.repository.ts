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
    this.visibilityManager = new CalendarVisibilityManager(this.domSelector, this.dataExtractor);
  }

  /**
   * Discover all calendars in Google Calendar
   * Handles virtual scrolling to ensure all calendars are found
   */
  async discoverCalendars(forceRefresh: boolean = false): Promise<Calendar[]> {
    try {
      logger.info('Starting calendar discovery...');
      
      // Find all calendar containers (This already handles virtual scrolling)
      const calendarContainers = await this.findAllCalendarContainers();
      logger.info(`Found ${calendarContainers.length} calendar containers`);
      
      const calendars: Calendar[] = [];

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
              logger.info(`Successfully extracted calendar: ${calendarData.name} (${calendarData.email})`);
            } else {
              logger.info('Failed to extract calendar data from element:', element);
            }
          } catch (error) {
            logger.warn('Failed to extract calendar data from element:', element, error);
          }
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
   * New approach: Scroll through each section and process calendars immediately
   */
  async applyCalendarVisibility(calendars: Calendar[]): Promise<void> {
    try {
      logger.info(`Applying visibility for ${calendars.length} calendars`);
      
      // Build set of emails that should be visible
      const desiredVisible = new Set<string>(
        calendars.filter(c => c.isVisible).map(c => c.email)
      );
      
      logger.info(`${desiredVisible.size} calendars should be visible`);

      // Find "My Calendars" container
      const myCalendarsContainer = await this.findMyCalendarsContainer();
      if (myCalendarsContainer) {
        logger.info('Processing "My Calendars" section...');
        await this.scrollAndProcess(myCalendarsContainer, desiredVisible);
      }

      // Find "Other Calendars" container
      const otherCalendarsContainer = await this.findOtherCalendarsContainer();
      if (otherCalendarsContainer) {
        logger.info('Processing "Other Calendars" section...');
        await this.scrollAndProcess(otherCalendarsContainer, desiredVisible);
      }

      logger.info('Calendar visibility application complete');
    } catch (error) {
      throw new Error(`Failed to apply calendar visibility: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async scrollAndProcess(
    container: Element,
    desiredVisible: Set<string>
  ): Promise<void> {
    await this.virtualScrollHandler.scrollAndProcessCalendars(
      container,
      async (elements: Element[]) => {
        for (const element of elements) {
          await this.visibilityManager.processCalendarElement(
            element,
            desiredVisible
          );
        }
      }
    );
  }

  private async findMyCalendarsContainer(): Promise<Element | null> {
    const containers = this.domSelector.findCalendarContainers();
    for (const container of containers) {
      const label = container.getAttribute('aria-label')?.toLowerCase() || '';
      if (label.includes('my calendars')) {
        return container;
      }
    }
    return null;
  }

  private async findOtherCalendarsContainer(): Promise<Element | null> {
    const containers = this.domSelector.findCalendarContainers();
    for (const container of containers) {
      const label = container.getAttribute('aria-label')?.toLowerCase() || '';
      if (label.includes('other')) {
        return container;
      }
    }
    return null;
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