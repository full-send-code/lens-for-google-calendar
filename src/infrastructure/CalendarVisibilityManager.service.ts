/**
 * Calendar Visibility Manager Service
 * Handles calendar visibility changes
 */

import { Calendar } from '../core';
import { CalendarDOMSelector } from './CalendarDOMSelector.service';
import { CalendarDataExtractor } from './CalendarDataExtractor.service';
import { DOMUtils } from './DOMUtils.util';
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
    private dataExtractor: CalendarDataExtractor
  ) {}

  /**
   * Process a single calendar element and set its visibility if needed
   * New approach: Process calendars as we encounter them during scroll
   */
  async processCalendarElement(
    element: Element,
    desiredEmailsVisible: Set<string>
  ): Promise<void> {
    try {
      // Extract calendar data
      const calendarData = this.dataExtractor.extractCalendarData(element);
      if (!calendarData) return;

      // Determine what the visibility should be
      const shouldBeVisible = desiredEmailsVisible.has(calendarData.email);
      
      // If current state matches desired, skip
      if (calendarData.isVisible === shouldBeVisible) {
        logger.debug(`Calendar ${calendarData.email} already in correct state: ${shouldBeVisible}`);
        return;
      }

      // Find and click checkbox
      const checkbox = this.domSelector.getCheckboxFromCalendarElement(element);
      if (!checkbox || !(checkbox instanceof HTMLElement)) {
        logger.warn(`No checkbox found for calendar: ${calendarData.email}`);
        return;
      }

      logger.info(`Clicking calendar ${calendarData.email} to set visibility: ${shouldBeVisible}`);
      checkbox.click();
      await this.delay(100); // Brief delay after click

    } catch (error) {
      logger.warn('Error processing calendar element:', error);
    }
  }

  /**
   * Apply calendar visibility changes to Google Calendar
   * Optimized to batch operations and avoid redundant discovery calls
   */
  async applyBatchVisibilityChanges(calendars: Calendar[]): Promise<void> {
    logger.info(`Applying visibility changes to ${calendars.length} calendars...`);
    
    // Batch process calendar visibility changes without individual delays
    const promises = calendars.map(async (calendar) => {
      return this.setCalendarVisibilityOptimized(calendar.email, calendar.isVisible);
    });
    
    // Execute all visibility changes in parallel
    const results = await Promise.allSettled(promises);
    
    // Check for failures
    const failures = results.filter(result => result.status === 'rejected');
    if (failures.length > 0) {
      logger.warn(`${failures.length} calendar visibility updates failed`);
      failures.forEach((failure, index) => {
        if (failure.status === 'rejected') {
          logger.warn(`Calendar ${calendars[index].email} failed:`, failure.reason);
        }
      });
    }
    
    logger.info(`Applied visibility changes to ${results.length - failures.length}/${calendars.length} calendars`);
  }

  /**
   * Set calendar visibility by email (legacy method with delays)
   */
  async setCalendarVisibility(email: string, isVisible: boolean): Promise<void> {
    const calendarElement = await this.findCalendarElementByEmail(email);
    if (!calendarElement) {
      logger.error(`🔘 Checkbox Click (Legacy): Calendar element not found for email: ${email}`);
      throw new Error(`Calendar element not found for email: ${email}`);
    }

    const checkbox = DOMUtils.query<HTMLInputElement>(
      CalendarVisibilityManager.SELECTORS.CALENDAR_CHECKBOX,
      calendarElement
    );

    if (!checkbox) {
      logger.error(`🔘 Checkbox Click (Legacy): Calendar checkbox not found for email: ${email}`);
      throw new Error(`Calendar checkbox not found for email: ${email}`);
    }

    const currentState = checkbox.checked;
    logger.debug(`🔘 Checkbox Click (Legacy): Calendar "${email}" current state: ${currentState}, target state: ${isVisible}`);

    if (checkbox.checked !== isVisible) {
      logger.info(`🔘 Checkbox Click (Legacy): Toggling calendar visibility for "${email}" from ${currentState} to ${isVisible}`);
      
      // Scroll element into view if needed
      logger.debug(`🔘 Checkbox Click (Legacy): Scrolling calendar element into view for: ${email}`);
      DOMUtils.scrollIntoViewIfNeeded(calendarElement);
      
      // Wait a moment for scroll to complete
      logger.debug('🔘 Checkbox Click (Legacy): Waiting 100ms for scroll to complete...');
      await this.delay(100);
      
      // Click the checkbox to toggle visibility
      logger.debug(`🔘 Checkbox Click (Legacy): Setting checkbox state for: ${email}`);
      checkbox.checked = isVisible;
      
      // Trigger change event to notify Google Calendar
      logger.debug(`🔘 Checkbox Click (Legacy): Triggering 'change' event for: ${email}`);
      DOMUtils.triggerEvent(checkbox, 'change', null, { bubbles: true });
      
      // Also trigger click event as some implementations may listen for it
      logger.debug(`🔘 Checkbox Click (Legacy): Triggering 'click' event for: ${email}`);
      DOMUtils.triggerEvent(checkbox, 'click', null, { bubbles: true });
      
      logger.info(`🔘 Checkbox Click (Legacy): Successfully updated visibility for calendar: ${email}`);
    } else {
      logger.debug(`🔘 Checkbox Click (Legacy): No change needed for calendar "${email}" - already in desired state: ${isVisible}`);
    }
  }

  /**
   * Optimized set calendar visibility - no delays, minimal DOM operations
   */
  private async setCalendarVisibilityOptimized(email: string, isVisible: boolean): Promise<void> {
    const calendarElement = await this.findCalendarElementByEmail(email);
    if (!calendarElement) {
      logger.warn(`🔘 Checkbox Click: Calendar element not found for email: ${email}`);
      return; // Don't throw, just warn and continue
    }

    const checkbox = DOMUtils.query<HTMLInputElement>(
      CalendarVisibilityManager.SELECTORS.CALENDAR_CHECKBOX,
      calendarElement
    );

    if (!checkbox) {
      logger.warn(`🔘 Checkbox Click: Calendar checkbox not found for email: ${email}`);
      return; // Don't throw, just warn and continue
    }

    const currentState = checkbox.checked;
    logger.debug(`🔘 Checkbox Click: Calendar "${email}" current state: ${currentState}, target state: ${isVisible}`);

    if (checkbox.checked !== isVisible) {
      logger.info(`🔘 Checkbox Click: Toggling calendar visibility for "${email}" from ${currentState} to ${isVisible}`);
      
      // Set checkbox state directly (no scrolling delays)
      checkbox.checked = isVisible;
      logger.debug(`🔘 Checkbox Click: Checkbox state updated to: ${checkbox.checked}`);
      
      // Trigger events to notify Google Calendar
      logger.debug(`🔘 Checkbox Click: Triggering 'change' event for calendar: ${email}`);
      DOMUtils.triggerEvent(checkbox, 'change', null, { bubbles: true });
      
      logger.debug(`🔘 Checkbox Click: Triggering 'click' event for calendar: ${email}`);
      DOMUtils.triggerEvent(checkbox, 'click', null, { bubbles: true });
      
      logger.info(`🔘 Checkbox Click: Successfully updated visibility for calendar: ${email}`);
    } else {
      logger.debug(`🔘 Checkbox Click: No change needed for calendar "${email}" - already in desired state: ${isVisible}`);
    }
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
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
