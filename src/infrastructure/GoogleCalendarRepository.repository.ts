/**
 * Google Calendar Repository Implementation
 * Handles DOM interaction with Google Calendar's virtual-scrolled calendar list
 */

import { CalendarRepository, Calendar, CalendarState } from '../core';
import { DOMUtils } from './DOMUtils.util';

/**
 * Implementation of CalendarRepository for Google Calendar DOM interaction
 * Handles virtual scrolling, calendar discovery, and visibility management
 */
export class GoogleCalendarRepository implements CalendarRepository {
  // Google Calendar DOM selectors
  private static readonly SELECTORS = {
    // Calendar list container (virtual scrolled)
    CALENDAR_LIST: '[data-testid="calendar-list"]',
    CALENDAR_LIST_ALT: '[role="grid"][aria-label*="calendar" i]',
    
    // Individual calendar items
    CALENDAR_ITEM: '[data-id]:has(input[type="checkbox"])',
    CALENDAR_ITEM_ALT: '[role="gridcell"]:has(input[type="checkbox"])',
    
    // Calendar checkbox for visibility
    CALENDAR_CHECKBOX: 'input[type="checkbox"]',
    
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
      // Wait for calendar list to be available
      const calendarList = await this.waitForCalendarList();
      
      // Scroll through virtual list to discover all calendars
      await this.scrollToDiscoverAllCalendars(calendarList);
      
      // Extract calendar data from DOM
      const calendarElements = this.getCalendarElements();
      const calendars: Calendar[] = [];

      for (const element of calendarElements) {
        try {
          const calendarData = this.extractCalendarData(element);
          if (calendarData) {
            calendars.push(new Calendar(calendarData));
          }
        } catch (error) {
          console.warn('Failed to extract calendar data from element:', element, error);
        }
      }

      return calendars;
    } catch (error) {
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
    // Try primary selector first
    try {
      return await DOMUtils.waitForElementMutation(
        GoogleCalendarRepository.SELECTORS.CALENDAR_LIST,
        { timeout: GoogleCalendarRepository.TIMEOUTS.ELEMENT_WAIT }
      );
    } catch {
      // Fallback to alternative selector
      return await DOMUtils.waitForElementMutation(
        GoogleCalendarRepository.SELECTORS.CALENDAR_LIST_ALT,
        { timeout: GoogleCalendarRepository.TIMEOUTS.ELEMENT_WAIT }
      );
    }
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
    let elements = DOMUtils.queryAll(GoogleCalendarRepository.SELECTORS.CALENDAR_ITEM);
    
    if (elements.length === 0) {
      elements = DOMUtils.queryAll(GoogleCalendarRepository.SELECTORS.CALENDAR_ITEM_ALT);
    }

    return elements;
  }

  /**
   * Extract calendar data from DOM element
   */
  private extractCalendarData(element: Element): CalendarState | null {
    try {
      // Extract email (primary identifier)
      const email = this.extractCalendarEmail(element);
      if (!email) return null;

      // Extract name
      const name = this.extractCalendarName(element) || email;

      // Extract visibility state
      const isVisible = this.extractCalendarVisibility(element);

      return { email, name, isVisible };
    } catch (error) {
      console.warn('Failed to extract calendar data:', error);
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

    // Try data-id attribute (often contains email)
    const dataId = element.getAttribute('data-id');
    if (dataId && dataId.includes('@')) return dataId;

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
    const checkbox = DOMUtils.query<HTMLInputElement>(
      GoogleCalendarRepository.SELECTORS.CALENDAR_CHECKBOX, 
      element
    );
    
    return checkbox?.checked || false;
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