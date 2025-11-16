/**
 * Google Calendar Repository Implementation
 * Handles DOM interaction with Google Calendar's virtual-scrolled calendar list
 */

import { CalendarRepository, Calendar, CalendarState } from '../core';
import { DOMUtils } from './DOMUtils.util';
import logger from './logger';

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
        const calendarElements = this.getCalendarElementsInContainer(container);
        logger.info(`Found ${calendarElements.length} calendar elements in container: ${containerLabel}`);
        
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
      }

      // If no calendars found in containers, fall back to global search
      // (Virtual scrolling has already been performed, so all calendars should be rendered)
      if (calendars.length === 0) {
        logger.info('No calendars found in containers, falling back to global search after virtual scroll');
        const globalElements = this.getCalendarElements();
        logger.info(`Found ${globalElements.length} calendar elements globally`);
        
        for (const element of globalElements) {
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
   * Find all calendar containers (My calendars, Other calendars, etc.)
   * Also handles virtual scrolling to ensure all calendars are rendered
   */
  private async findAllCalendarContainers(): Promise<Element[]> {
    try {
      logger.info('Finding calendar containers...');
      
      // First, wait for the main calendar list to be available
      const calendarList = await this.waitForCalendarList();
      logger.info('Found main calendar list, performing virtual scroll to load all calendars...');
      
      // Perform virtual scrolling on the main calendar list to ensure all calendars are rendered
      await this.scrollToDiscoverAllCalendars(calendarList);
      
      logger.info('Virtual scroll complete, now searching for calendar containers...');
      
      // Search for container elements with various selectors
      const containerSelectors = [
        '[aria-label*="My calendars" i]',
        '[aria-label*="Other calendars" i]', 
        '[aria-label*="calendars" i]',
        '[role="group"][aria-label]',
        '[role="region"][aria-label]'
      ];
      
      const containers: Element[] = [];
      
      for (const selector of containerSelectors) {
        const elements = Array.from(document.querySelectorAll(selector));
        for (const element of elements) {
          const label = element.getAttribute('aria-label')?.toLowerCase() || '';
          // Filter out non-calendar containers
          if (label.includes('calendar') && 
              !label.includes('add') && 
              !label.includes('create') &&
              !containers.includes(element)) {
            containers.push(element);
            logger.info(`Found container: ${element.getAttribute('aria-label')}`);
          }
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
   * Get calendar elements within a specific container
   */
  private getCalendarElementsInContainer(container: Element): Element[] {
    const containerLabel = container.getAttribute('aria-label') || 'Unknown';
    logger.debug(`Searching for calendar elements in container: ${containerLabel}`);
    
    // Skip "Add other calendars" container as it's just a button, not a calendar list
    if (containerLabel.toLowerCase().includes('add other calendars')) {
      logger.debug('Skipping "Add other calendars" container - it\'s not a calendar list');
      return [];
    }
    
    const selectors = [
      GoogleCalendarRepository.SELECTORS.CALENDAR_ITEM,
      GoogleCalendarRepository.SELECTORS.CALENDAR_ITEM_ALT,
      GoogleCalendarRepository.SELECTORS.CALENDAR_ITEM_CHECKBOX,
      GoogleCalendarRepository.SELECTORS.CALENDAR_ITEM_GENERIC
    ];

    // First, try to find calendar elements within this specific container
    for (const selector of selectors) {
      const elements = Array.from(container.querySelectorAll(selector));
      logger.debug(`Selector ${selector} found ${elements.length} elements in container`);
      if (elements.length > 0) {
        logger.info(`Found ${elements.length} calendar elements in container using selector: ${selector}`);
        return elements;
      }
    }

    // If no direct children found, the calendar elements might be in a sibling or nearby container
    // Look for calendar elements near this container (within the same parent)
    const parentContainer = container.parentElement;
    if (parentContainer) {
      logger.debug('Searching in parent container for calendar elements near this section');
      
      for (const selector of selectors) {
        const nearbyElements = Array.from(parentContainer.querySelectorAll(selector));
        if (nearbyElements.length > 0) {
          // Filter to elements that are logically associated with this container
          const relevantElements = nearbyElements.filter(element => {
            // Check if element is after this container in DOM order
            const containerPosition = Array.from(parentContainer.children).indexOf(container);
            const elementPosition = this.findElementPositionInParent(element, parentContainer);
            return elementPosition > containerPosition;
          });
          
          if (relevantElements.length > 0) {
            logger.info(`Found ${relevantElements.length} calendar elements near container using selector: ${selector}`);
            return relevantElements;
          }
        }
      }
    }

    // If no elements found with specific selectors, try to find any checkboxes within this container
    const checkboxes = Array.from(container.querySelectorAll('input[type="checkbox"]'));
    logger.debug(`Found ${checkboxes.length} total checkboxes in container as fallback`);
    
    // Filter to likely calendar checkboxes (ones with nearby text containing calendar info)
    const calendarCheckboxes = checkboxes.filter(checkbox => {
      const parent = checkbox.closest('div');
      if (!parent) return false;
      
      const text = parent.textContent?.toLowerCase() || '';
      // Look for common calendar patterns
      return text.includes('@') || text.includes('calendar') || text.includes('gmail');
    });

    logger.debug(`Found ${calendarCheckboxes.length} likely calendar checkboxes in container`);
    const result = calendarCheckboxes.map(cb => cb.closest('div')).filter(Boolean) as Element[];
    
    return result;
  }

  /**
   * Find the position of an element within a parent container
   */
  private findElementPositionInParent(element: Element, parentContainer: Element): number {
    let currentElement: Element | null = element;
    while (currentElement && currentElement.parentElement !== parentContainer) {
      currentElement = currentElement.parentElement;
    }
    if (currentElement) {
      return Array.from(parentContainer.children).indexOf(currentElement);
    }
    return -1;
  }

  /**
   * Get all calendar elements from DOM (legacy method - kept for backward compatibility)
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