/**
 * Calendar Visibility Manager Service
 * Handles calendar visibility changes
 */

import { Calendar } from '../core';
import { CalendarDOMSelector } from './CalendarDOMSelector.service';
import { CalendarDataExtractor } from './CalendarDataExtractor.service';
import { VirtualScrollHandler } from './VirtualScrollHandler.service';
import logger from './logger';

/**
 * Service responsible for managing calendar visibility
 */
export class CalendarVisibilityManager {
  private static readonly SELECTORS = {
    CALENDAR_CHECKBOX: 'input[type="checkbox"]'
  };

  constructor(
    private domSelector: CalendarDOMSelector,
    private dataExtractor: CalendarDataExtractor,
    private virtualScrollHandler: VirtualScrollHandler
  ) {}

  /**
   * Process a single calendar element and set its visibility
   * Used during batch operations when elements are already discovered
   */
  async processCalendarElement(
    element: Element,
    desiredEmailsVisible: Set<string>
  ): Promise<void> {
    try {
      const calendarData = this.dataExtractor.extractCalendarData(element);
      if (!calendarData) return;

      const shouldBeVisible = desiredEmailsVisible.has(calendarData.email);
      const checkbox = this.domSelector.getCheckboxFromCalendarElement(element) as HTMLInputElement;
      
      if (!checkbox) {
        logger.warn(`No checkbox found for calendar: ${calendarData.email}`);
        return;
      }

      await this.setCheckboxState(checkbox, shouldBeVisible, calendarData.email);
    } catch (error) {
      logger.warn('Error processing calendar element:', error);
    }
  }

  /**
   * Set calendar visibility by email with full error handling and scrolling
   * Used for individual calendar operations that need reliability
   */
  async setCalendarVisibility(email: string, isVisible: boolean): Promise<void> {
    const calendarElement = await this.findCalendarElementByEmail(email);
    if (!calendarElement) {
      throw new Error(`Calendar element not found for email: ${email}`);
    }

    // Scroll element into view for reliable interaction
    await this.virtualScrollHandler.scrollElementIntoView(calendarElement);

    const checkbox = calendarElement.querySelector<HTMLInputElement>(
      CalendarVisibilityManager.SELECTORS.CALENDAR_CHECKBOX
    );

    if (!checkbox) {
      throw new Error(`Calendar checkbox not found for email: ${email}`);
    }

    await this.setCheckboxState(checkbox, isVisible, email);
  }

  /**
   * Set calendar visibility by email (optimized for batch operations)
   * Used internally for performance-critical batch operations
   */
  async setCalendarVisibilityOptimized(email: string, isVisible: boolean): Promise<void> {
    const calendarElement = await this.findCalendarElementByEmail(email);
    if (!calendarElement) {
      logger.warn(`Calendar element not found for email: ${email}`);
      return; // Continue with other calendars in batch
    }

    const checkbox = calendarElement.querySelector<HTMLInputElement>(
      CalendarVisibilityManager.SELECTORS.CALENDAR_CHECKBOX
    );

    if (!checkbox) {
      logger.warn(`Calendar checkbox not found for email: ${email}`);
      return; // Continue with other calendars in batch
    }

    await this.setCheckboxState(checkbox, isVisible, email);
  }

  /**
   * Apply calendar visibility changes to Google Calendar
   * Processes calendars sequentially for reliability
   */
  async applyBatchVisibilityChanges(calendars: Calendar[]): Promise<void> {
    logger.info(`Applying visibility changes to ${calendars.length} calendars...`);
    
    // Process calendars sequentially to avoid overwhelming the DOM
    for (const calendar of calendars) {
      await this.setCalendarVisibilityOptimized(calendar.email, calendar.isVisible);
    }
    
    logger.info(`Applied visibility changes to ${calendars.length} calendars`);
  }

  /**
   * Core method for setting checkbox state
   * Single responsibility: handle the actual DOM interaction
   */
  private async setCheckboxState(
    checkbox: HTMLInputElement, 
    isVisible: boolean, 
    email: string
  ): Promise<void> {
    logger.info(`Setting calendar visibility for "${email}" to ${isVisible}`);
    
    // Set checkbox state directly
    checkbox.checked = isVisible;
    
    // Trigger events to notify Google Calendar
    this.triggerEvent(checkbox, 'change', null, { bubbles: true });
    this.triggerEvent(checkbox, 'click', null, { bubbles: true });
    
    logger.info(`Successfully updated visibility for calendar: ${email}`);
  }

  /**
   * Find calendar element by email by searching DOM directly
   */
  async findCalendarElementByEmail(email: string): Promise<Element | null> {
    // Search DOM directly
    const calendarElements = this.domSelector.getCalendarElements();
    
    for (const element of calendarElements) {
      const elementEmail = this.dataExtractor.extractCalendarEmail(element);
      if (elementEmail === email) {
        return element;
      }
    }

    return null;
  }

  /**
   * Verify that calendar elements have the correct visibility state
   */
  async verifyCalendarElementsState(
    elements: Element[],
    desiredEmailsVisible: Set<string>
  ): Promise<number> {
    let verifiedCount = 0;

    for (const element of elements) {
      try {
        const calendarData = this.dataExtractor.extractCalendarData(element);
        if (!calendarData) continue;

        const shouldBeVisible = desiredEmailsVisible.has(calendarData.email);
        const checkbox = this.domSelector.getCheckboxFromCalendarElement(element) as HTMLInputElement;

        if (!checkbox) continue;

        if (checkbox.checked === shouldBeVisible) {
          verifiedCount++;
        } else {
          logger.warn(`❌ State verification failed for ${calendarData.email}: expected ${shouldBeVisible}, got ${checkbox.checked}`);
        }
      } catch (error) {
        logger.warn('Error verifying calendar element state:', error);
      }
    }

    return verifiedCount;
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Trigger a DOM event on an element
   */
  private triggerEvent(
    element: Element, 
    eventType: string, 
    eventData: any = null, 
    options: { bubbles?: boolean } = {}
  ): void {
    const event = new Event(eventType, { bubbles: options.bubbles || false });
    if (eventData) {
      Object.assign(event, eventData);
    }
    element.dispatchEvent(event);
  }
}
