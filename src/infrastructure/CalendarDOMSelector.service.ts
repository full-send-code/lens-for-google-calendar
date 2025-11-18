/**
 * Calendar DOM Selector Service
 * Handles DOM selection logic and selectors
 */

import { DOMUtils } from './DOMUtils.util';
import logger from './logger';

/**
 * Service responsible for DOM selection logic
 */
export class CalendarDOMSelector {
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
    
    // Scroll container
    SCROLL_CONTAINER: '[role="grid"]',
    SCROLL_CONTAINER_ALT: '.calendar-list-container'
  };

  /**
   * Wait for Google Calendar list to be available
   */
  async waitForCalendarList(): Promise<Element> {
    const selectors = [
      CalendarDOMSelector.SELECTORS.CALENDAR_LIST,
      CalendarDOMSelector.SELECTORS.CALENDAR_LIST_ALT,
      CalendarDOMSelector.SELECTORS.CALENDAR_LIST_BY_LABEL,
      CalendarDOMSelector.SELECTORS.CALENDAR_LIST_SIDEBAR
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
   * Find calendar containers (My calendars, Other calendars, etc.)
   */
  findCalendarContainers(): Element[] {
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
    
    return containers;
  }

  /**
   * Get the scroll container for the calendar list
   */
  getScrollContainer(calendarList: Element): Element | null {
    logger.debug('🔄 Scroll Container: Searching for scroll container within calendar list');
    
    // Try to find scroll container within calendar list
    let scrollContainer = DOMUtils.query(
      CalendarDOMSelector.SELECTORS.SCROLL_CONTAINER, 
      calendarList
    );

    if (scrollContainer) {
      logger.info(`🔄 Scroll Container: Found using primary selector: ${CalendarDOMSelector.SELECTORS.SCROLL_CONTAINER}`);
    } else {
      logger.debug(`🔄 Scroll Container: Primary selector failed, trying alternative: ${CalendarDOMSelector.SELECTORS.SCROLL_CONTAINER_ALT}`);
      scrollContainer = DOMUtils.query(
        CalendarDOMSelector.SELECTORS.SCROLL_CONTAINER_ALT, 
        calendarList
      );
      
      if (scrollContainer) {
        logger.info(`🔄 Scroll Container: Found using alternative selector: ${CalendarDOMSelector.SELECTORS.SCROLL_CONTAINER_ALT}`);
      }
    }

    // Fallback to calendar list itself
    const result = scrollContainer || calendarList;
    if (result === calendarList) {
      logger.info('🔄 Scroll Container: Using calendar list itself as fallback scroll container');
    }
    
    logger.debug(`🔄 Scroll Container: Selected container has scrollHeight: ${result.scrollHeight}px, scrollTop: ${result.scrollTop}px`);
    return result;
  }

  /**
   * Get all calendar elements from DOM
   */
  getCalendarElements(): Element[] {
    const selectors = [
      CalendarDOMSelector.SELECTORS.CALENDAR_ITEM,
      CalendarDOMSelector.SELECTORS.CALENDAR_ITEM_ALT,
      CalendarDOMSelector.SELECTORS.CALENDAR_ITEM_CHECKBOX,
      CalendarDOMSelector.SELECTORS.CALENDAR_ITEM_GENERIC
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
   * Get calendar elements within a specific container
   */
  getCalendarElementsInContainer(container: Element): Element[] {
    const containerLabel = container.getAttribute('aria-label') || 'Unknown';
    logger.debug(`Searching for calendar elements in container: ${containerLabel}`);
    
    // Skip "Add other calendars" container as it's just a button, not a calendar list
    if (containerLabel.toLowerCase().includes('add other calendars')) {
      logger.debug('Skipping "Add other calendars" container - it\'s not a calendar list');
      return [];
    }
    
    const selectors = [
      CalendarDOMSelector.SELECTORS.CALENDAR_ITEM,
      CalendarDOMSelector.SELECTORS.CALENDAR_ITEM_ALT,
      CalendarDOMSelector.SELECTORS.CALENDAR_ITEM_CHECKBOX,
      CalendarDOMSelector.SELECTORS.CALENDAR_ITEM_GENERIC
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

    // Special handling for "Other calendars" - look in the entire document tree after this container
    if (containerLabel.toLowerCase().includes('other')) {
      return this.findOtherCalendarElements();
    }

    // If no direct children found, look for nearby elements
    return this.findNearbyCalendarElements(container, selectors);
  }

  /**
   * Find elements that belong to "Other calendars" section
   */
  private findOtherCalendarElements(): Element[] {
    logger.debug('Special handling for "Other calendars" - searching globally after expansion');
    
    // Wait a moment for any expansion to complete
    setTimeout(() => {}, 100);
    
    // Look for all calendar elements globally and try to identify which ones belong to "Other calendars"
    const allCalendarElements = this.getCalendarElements();
    logger.debug(`Found ${allCalendarElements.length} total calendar elements globally`);
    
    // Filter out elements that we know belong to "My calendars" (emails ending in gmail.com, birthdays, tasks)
    const otherCalendarElements = allCalendarElements.filter(element => {
      const email = this.extractEmailForFiltering(element);
      if (!email) return false;
      
      // These patterns typically belong to "My calendars"
      const myCalendarPatterns = [
        /@gmail\.com$/,
        /^birthdays@/,
        /^tasks@/,
        /@group\.calendar\.google\.com$/ // This might be in either section, but let's check context
      ];
      
      // If it matches "My calendars" patterns, it's probably not in "Other calendars"
      const isMyCalendar = myCalendarPatterns.some(pattern => pattern.test(email));
      
      if (!isMyCalendar) {
        logger.debug(`Potential "Other calendar" found: ${email}`);
        return true;
      }
      
      return false;
    });
    
    if (otherCalendarElements.length > 0) {
      logger.info(`Found ${otherCalendarElements.length} potential "Other calendars" elements`);
      return otherCalendarElements;
    }
    
    return [];
  }

  /**
   * Find calendar elements near a container
   */
  private findNearbyCalendarElements(container: Element, selectors: string[]): Element[] {
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

    // Fallback to checkbox-based search
    return this.findCheckboxBasedCalendarElements(container);
  }

  /**
   * Find calendar elements based on checkboxes within container
   */
  private findCheckboxBasedCalendarElements(container: Element): Element[] {
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
   * Extract email for filtering purposes (simplified version)
   */
  private extractEmailForFiltering(element: Element): string | null {
    // Try data-email attribute
    const emailAttr = element.getAttribute('data-email');
    if (emailAttr) return emailAttr;

    // Try data-id attribute
    const dataId = element.getAttribute('data-id');
    if (dataId) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (emailRegex.test(dataId)) return dataId;
      
      try {
        const decoded = atob(dataId);
        if (emailRegex.test(decoded)) return decoded;
      } catch (error) {
        // Not valid Base64
      }
      
      if (dataId.length > 0) return dataId;
    }

    return null;
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
}
