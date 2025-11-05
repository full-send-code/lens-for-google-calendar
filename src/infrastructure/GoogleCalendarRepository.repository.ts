/**
 * Google Calendar Repository Implementation
 * Handles DOM interaction with Google Calendar's virtual-scrolled calendar list
 */

import { CalendarRepository, Calendar, CalendarState } from '../core';
import { DOMUtils } from './DOMUtils.util';
import logger from '../logger';

/**
 * Implementation of CalendarRepository for Google Calendar DOM interaction
 * Handles virtual scrolling, calendar discovery, and visibility management
 */
export class GoogleCalendarRepository implements CalendarRepository {
  // Google Calendar DOM selectors
  private static readonly SELECTORS = {
    // Calendar list container (try multiple approaches)
    CALENDAR_LIST: '[data-testid="calendar-list"]',
    CALENDAR_LIST_ALT: '[role="grid"][aria-label*="calendar" i]',
    CALENDAR_LIST_BY_LABEL: '[aria-label*="My calendars" i]',
    CALENDAR_LIST_SIDEBAR: '[aria-label*="calendars" i]',
    
    // Individual calendar items
    CALENDAR_ITEM: '[data-id]:has(input[type="checkbox"])',
    CALENDAR_ITEM_ALT: '[role="gridcell"]:has(input[type="checkbox"])',
    CALENDAR_ITEM_CHECKBOX: 'div:has(input[type="checkbox"][role="checkbox"])',
    CALENDAR_ITEM_GENERIC: 'div:has(input[type="checkbox"])',
    
    // Calendar checkbox for visibility
    CALENDAR_CHECKBOX: 'input[type="checkbox"]',
    CALENDAR_CHECKBOX_ROLE: 'input[type="checkbox"][role="checkbox"]',
    
    // Calendar email/name extraction
    CALENDAR_LABEL: '[aria-label], [title]',
    CALENDAR_EMAIL: '[data-email]',
    
    // Scroll container
    SCROLL_CONTAINER: '[role="grid"]',
    SCROLL_CONTAINER_ALT: '.calendar-list-container'
  };

  private static readonly TIMEOUTS = {
    ELEMENT_WAIT: 5000,
    SCROLL_SETTLE: 300,
    VIRTUAL_SCROLL_WAIT: 1000
  };

  /**
   * Discover all calendars in Google Calendar
   * Handles virtual scrolling to ensure all calendars are found
   */
  async discoverCalendars(): Promise<Calendar[]> {
    try {
      logger.info('Starting calendar discovery...');
      
      // Wait for calendar list to be available
      const calendarList = await this.waitForCalendarList();
      logger.info('Calendar list found:', calendarList);
      
      // Scroll through virtual list to discover all calendars
      await this.scrollToDiscoverAllCalendars(calendarList);
      
      // Extract calendar data from DOM
      const calendarElements = this.getCalendarElements();
      logger.info(`Found ${calendarElements.length} calendar elements to process`);
      
      const calendars: Calendar[] = [];

      for (const element of calendarElements) {
        try {
          const calendarData = this.extractCalendarData(element);
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

      logger.info(`Discovery complete. Found ${calendars.length} calendars.`);
      return calendars;
    } catch (error) {
      logger.error('Calendar discovery failed:', error);
      throw new Error(`Failed to discover calendars: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Apply calendar visibility changes to Google Calendar
   */
  async applyCalendarVisibility(calendars: Calendar[]): Promise<void> {
    try {
      for (const calendar of calendars) {
        await this.setCalendarVisibility(calendar.email, calendar.isVisible);
      }
    } catch (error) {
      throw new Error(`Failed to apply calendar visibility: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get current state of all calendars
   */
  async getCurrentCalendarStates(): Promise<Calendar[]> {
    return this.discoverCalendars();
  }

  /**
   * Wait for Google Calendar list to be available
   */
  private async waitForCalendarList(): Promise<Element> {
    const selectors = [
      GoogleCalendarRepository.SELECTORS.CALENDAR_LIST,
      GoogleCalendarRepository.SELECTORS.CALENDAR_LIST_ALT,
      GoogleCalendarRepository.SELECTORS.CALENDAR_LIST_BY_LABEL,
      GoogleCalendarRepository.SELECTORS.CALENDAR_LIST_SIDEBAR
    ];

    // Try each selector in order
    for (const selector of selectors) {
      try {
        const element = await DOMUtils.waitForElementMutation(
          selector,
          { timeout: 2000 } // Shorter timeout for each attempt
        );
        if (element) {
          logger.info(`Found calendar list using selector: ${selector}`);
          return element;
        }
      } catch (error) {
        logger.debug(`Selector failed: ${selector}`);
        continue;
      }
    }

    // If none of the specific selectors work, try to find any element with "calendars" in aria-label
    const fallbackElements = document.querySelectorAll('[aria-label*="calendars" i]');
    if (fallbackElements.length > 0) {
      logger.info(`Using fallback element with calendars aria-label`);
      return fallbackElements[0];
    }

    throw new Error(`Calendar list not found. Tried selectors: ${selectors.join(', ')}`);
  }

  /**
   * Scroll through virtual calendar list to discover all calendars
   */
  private async scrollToDiscoverAllCalendars(calendarList: Element): Promise<void> {
    const scrollContainer = this.getScrollContainer(calendarList);
    if (!scrollContainer) return;

    let previousCalendarCount = 0;
    let currentCalendarCount = 0;
    let scrollAttempts = 0;
    const maxScrollAttempts = 10;

    do {
      previousCalendarCount = currentCalendarCount;
      
      // Scroll to bottom to trigger virtual scroll loading
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
      
      // Wait for virtual scroll to settle
      await this.delay(GoogleCalendarRepository.TIMEOUTS.SCROLL_SETTLE);
      
      // Count current calendars
      currentCalendarCount = this.getCalendarElements().length;
      scrollAttempts++;
      
    } while (
      currentCalendarCount > previousCalendarCount && 
      scrollAttempts < maxScrollAttempts
    );

    // Scroll back to top to ensure all calendars are accessible
    scrollContainer.scrollTop = 0;
    await this.delay(GoogleCalendarRepository.TIMEOUTS.SCROLL_SETTLE);
  }

  /**
   * Get the scroll container for the calendar list
   */
  private getScrollContainer(calendarList: Element): Element | null {
    // Try to find scroll container within calendar list
    let scrollContainer = DOMUtils.query(
      GoogleCalendarRepository.SELECTORS.SCROLL_CONTAINER, 
      calendarList
    );

    if (!scrollContainer) {
      scrollContainer = DOMUtils.query(
        GoogleCalendarRepository.SELECTORS.SCROLL_CONTAINER_ALT, 
        calendarList
      );
    }

    // Fallback to calendar list itself
    return scrollContainer || calendarList;
  }

  /**
   * Get all calendar elements from DOM
   */
  private getCalendarElements(): Element[] {
    const selectors = [
      GoogleCalendarRepository.SELECTORS.CALENDAR_ITEM,
      GoogleCalendarRepository.SELECTORS.CALENDAR_ITEM_ALT,
      GoogleCalendarRepository.SELECTORS.CALENDAR_ITEM_CHECKBOX,
      GoogleCalendarRepository.SELECTORS.CALENDAR_ITEM_GENERIC
    ];

    for (const selector of selectors) {
      const elements = DOMUtils.queryAll(selector);
      if (elements.length > 0) {
        logger.info(`Found ${elements.length} calendar elements using selector: ${selector}`);
        return elements;
      }
    }

    // If no elements found with specific selectors, try to find any checkboxes
    const checkboxes = DOMUtils.queryAll('input[type="checkbox"]');
    logger.debug(`Found ${checkboxes.length} total checkboxes as fallback`);
    
    // Filter to likely calendar checkboxes (ones with nearby text containing calendar info)
    const calendarCheckboxes = checkboxes.filter(checkbox => {
      const parent = checkbox.closest('div');
      if (!parent) return false;
      
      const text = parent.textContent?.toLowerCase() || '';
      // Look for common calendar patterns
      return text.includes('@') || text.includes('calendar') || text.includes('gmail');
    });

    logger.debug(`Found ${calendarCheckboxes.length} likely calendar checkboxes`);
    return calendarCheckboxes.map(cb => cb.closest('div')).filter(Boolean) as Element[];
  }

  /**
   * Extract calendar data from DOM element
   */
  private extractCalendarData(element: Element): CalendarState | null {
    try {
      logger.debug('Extracting calendar data from element:', element);
      
      // Extract email (primary identifier)
      const email = this.extractCalendarEmail(element);
      logger.debug('Extracted email:', email);
      
      if (!email) {
        logger.debug('No email found, skipping element');
        return null;
      }

      // Extract name
      const name = this.extractCalendarName(element) || email;
      logger.debug('Extracted name:', name);

      // Extract visibility state
      const isVisible = this.extractCalendarVisibility(element);
      logger.debug('Extracted visibility:', isVisible);

      const result = { email, name, isVisible };
      logger.debug('Successfully extracted calendar data:', result);
      return result;
    } catch (error) {
      logger.warn('Failed to extract calendar data:', error);
      return null;
    }
  }

  /**
   * Extract calendar email from element
   */
  private extractCalendarEmail(element: Element): string | null {
    // Try data-email attribute
    const emailAttr = element.getAttribute('data-email');
    if (emailAttr) return emailAttr;

    // Try data-id attribute (often contains Base64-encoded email)
    const dataId = element.getAttribute('data-id');
    if (dataId) {
      // Check if it's a direct email (must look like a valid email format)
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (emailRegex.test(dataId)) return dataId;
      
      // Try to decode as Base64
      try {
        const decoded = atob(dataId);
        if (emailRegex.test(decoded)) {
          logger.debug('Decoded Base64 data-id:', dataId, '->', decoded);
          return decoded;
        }
      } catch (error) {
        // Not valid Base64, continue with other methods
        logger.debug('Failed to decode data-id as Base64:', dataId);
      }
      
      // If data-id exists but doesn't decode to a valid email, 
      // continue to other methods instead of returning null
    }

    // Try to find email in aria-label or title
    const labelElement = DOMUtils.query(GoogleCalendarRepository.SELECTORS.CALENDAR_LABEL, element);
    if (labelElement) {
      const ariaLabel = labelElement.getAttribute('aria-label') || '';
      const title = labelElement.getAttribute('title') || '';
      
      const emailMatch = (ariaLabel + ' ' + title).match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      if (emailMatch) return emailMatch[1];
    }

    return null;
  }

  /**
   * Extract calendar name from element
   */
  private extractCalendarName(element: Element): string | null {
    // Try aria-label first
    const labelElement = DOMUtils.query(GoogleCalendarRepository.SELECTORS.CALENDAR_LABEL, element);
    if (labelElement) {
      const ariaLabel = labelElement.getAttribute('aria-label');
      if (ariaLabel) {
        // Remove email from label if present
        return ariaLabel.replace(/\s*\([^)]*@[^)]*\)/, '').trim();
      }
    }

    // Try text content
    const textContent = element.textContent?.trim();
    if (textContent) {
      // Remove email patterns from text content
      return textContent.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, '').trim();
    }

    return null;
  }

  /**
   * Extract calendar visibility state from checkbox
   */
  private extractCalendarVisibility(element: Element): boolean {
    // Try multiple checkbox selectors
    const selectors = [
      GoogleCalendarRepository.SELECTORS.CALENDAR_CHECKBOX,
      GoogleCalendarRepository.SELECTORS.CALENDAR_CHECKBOX_ROLE,
      'input[type="checkbox"]'
    ];

    for (const selector of selectors) {
      const checkbox = DOMUtils.query<HTMLInputElement>(selector, element);
      if (checkbox) {
        logger.debug(`Found checkbox with selector ${selector}, checked: ${checkbox.checked}`);
        return checkbox.checked || false;
      }
    }

    logger.debug('No checkbox found in element');
    return false;
  }

  /**
   * Set calendar visibility by email
   */
  private async setCalendarVisibility(email: string, isVisible: boolean): Promise<void> {
    const calendarElement = await this.findCalendarElementByEmail(email);
    if (!calendarElement) {
      throw new Error(`Calendar element not found for email: ${email}`);
    }

    const checkbox = DOMUtils.query<HTMLInputElement>(
      GoogleCalendarRepository.SELECTORS.CALENDAR_CHECKBOX,
      calendarElement
    );

    if (!checkbox) {
      throw new Error(`Calendar checkbox not found for email: ${email}`);
    }

    if (checkbox.checked !== isVisible) {
      // Scroll element into view if needed
      DOMUtils.scrollIntoViewIfNeeded(calendarElement);
      
      // Wait a moment for scroll to complete
      await this.delay(100);
      
      // Click the checkbox to toggle visibility
      checkbox.checked = isVisible;
      
      // Trigger change event to notify Google Calendar
      DOMUtils.triggerEvent(checkbox, 'change', null, { bubbles: true });
      
      // Also trigger click event as some implementations may listen for it
      DOMUtils.triggerEvent(checkbox, 'click', null, { bubbles: true });
    }
  }

  /**
   * Find calendar element by email
   */
  private async findCalendarElementByEmail(email: string): Promise<Element | null> {
    // First, ensure all calendars are discovered
    await this.discoverCalendars();
    
    const calendarElements = this.getCalendarElements();
    
    for (const element of calendarElements) {
      const elementEmail = this.extractCalendarEmail(element);
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