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
  // Cache for discovered calendars to avoid redundant DOM operations
  private calendarCache: { calendars: Calendar[], timestamp: number, elements: Map<string, Element> } | null = null;
  private static readonly CACHE_DURATION = 5000; // 5 seconds

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
   * Uses caching to avoid redundant expensive operations
   */
  async discoverCalendars(forceRefresh: boolean = false): Promise<Calendar[]> {
    try {
      // Check cache first (unless forcing refresh)
      if (!forceRefresh && this.calendarCache && 
          (Date.now() - this.calendarCache.timestamp) < GoogleCalendarRepository.CACHE_DURATION) {
        logger.info(`Using cached calendar discovery (${this.calendarCache.calendars.length} calendars)`);
        return this.calendarCache.calendars;
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
        const calendarElements = this.getCalendarElementsInContainer(container);
        logger.info(`Found ${calendarElements.length} calendar elements in container: ${containerLabel}`);
        
        for (const element of calendarElements) {
          try {
            const calendarData = this.extractCalendarData(element);
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
        const globalElements = this.getCalendarElements();
        logger.info(`Found ${globalElements.length} calendar elements globally`);
        
        for (const element of globalElements) {
          try {
            const calendarData = this.extractCalendarData(element);
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

      // Cache the results
      this.calendarCache = {
        calendars: [...calendars], // Create a copy
        timestamp: Date.now(),
        elements: elementMap
      };

      logger.info(`Discovery complete. Found ${calendars.length} calendars. Cached for ${GoogleCalendarRepository.CACHE_DURATION}ms.`);
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
      logger.info(`Applying visibility changes to ${calendars.length} calendars...`);
      
      // Ensure we have current calendar discovery (but use cache if available)
      await this.discoverCalendars(false);
      
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
    } catch (error) {
      throw new Error(`Failed to apply calendar visibility: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get current state of all calendars
   * Forces a fresh discovery to get the most current state
   */
  async getCurrentCalendarStates(): Promise<Calendar[]> {
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
      const calendarList = await this.waitForCalendarList();
      logger.info('Found main calendar list, performing virtual scroll to load all calendars...');
      
      // Perform virtual scrolling on the main calendar list to ensure all calendars are rendered
      await this.scrollToDiscoverAllCalendars(calendarList);
      
      logger.info('Virtual scroll complete, now searching for calendar containers...');
      
      // Try to expand collapsed sections before searching
      await this.expandCollapsedSections();
      
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
            
            // If this is the "Other calendars" container, try to scroll it specifically
            if (label.includes('other')) {
              logger.info('Found "Other calendars" container, performing specific scroll...');
              await this.scrollToDiscoverAllCalendars(element);
            }
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
    if (!scrollContainer) {
      logger.warn('🔄 Virtual Scroll: No scroll container found, skipping virtual scroll');
      return;
    }

    logger.info(`🔄 Virtual Scroll: Starting virtual scroll discovery on container with scrollHeight: ${scrollContainer.scrollHeight}px`);
    
    let previousCalendarCount = 0;
    let currentCalendarCount = 0;
    let scrollAttempts = 0;
    const maxScrollAttempts = 10;

    do {
      previousCalendarCount = currentCalendarCount;
      
      // Scroll to bottom to trigger virtual scroll loading
      const previousScrollTop = scrollContainer.scrollTop;
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
      logger.debug(`🔄 Virtual Scroll: Attempt ${scrollAttempts + 1} - Scrolled from ${previousScrollTop}px to ${scrollContainer.scrollTop}px (height: ${scrollContainer.scrollHeight}px)`);
      
      // Wait for virtual scroll to settle
      await this.delay(GoogleCalendarRepository.TIMEOUTS.SCROLL_SETTLE);
      
      // Count current calendars
      currentCalendarCount = this.getCalendarElements().length;
      const calendarsFound = currentCalendarCount - previousCalendarCount;
      logger.info(`🔄 Virtual Scroll: Attempt ${scrollAttempts + 1} found ${calendarsFound} new calendars (total: ${currentCalendarCount})`);
      scrollAttempts++;
      
    } while (
      currentCalendarCount > previousCalendarCount && 
      scrollAttempts < maxScrollAttempts
    );

    if (scrollAttempts >= maxScrollAttempts) {
      logger.warn(`🔄 Virtual Scroll: Reached maximum scroll attempts (${maxScrollAttempts}), stopping`);
    } else {
      logger.info(`🔄 Virtual Scroll: Discovery complete after ${scrollAttempts} scroll attempts`);
    }

    // Scroll back to top to ensure all calendars are accessible
    logger.debug('🔄 Virtual Scroll: Scrolling back to top to make all calendars accessible');
    scrollContainer.scrollTop = 0;
    await this.delay(GoogleCalendarRepository.TIMEOUTS.SCROLL_SETTLE);
    logger.info(`🔄 Virtual Scroll: Virtual scroll complete. Final calendar count: ${currentCalendarCount}`);
  }

  /**
   * Get the scroll container for the calendar list
   */
  private getScrollContainer(calendarList: Element): Element | null {
    logger.debug('🔄 Scroll Container: Searching for scroll container within calendar list');
    
    // Try to find scroll container within calendar list
    let scrollContainer = DOMUtils.query(
      GoogleCalendarRepository.SELECTORS.SCROLL_CONTAINER, 
      calendarList
    );

    if (scrollContainer) {
      logger.info(`🔄 Scroll Container: Found using primary selector: ${GoogleCalendarRepository.SELECTORS.SCROLL_CONTAINER}`);
    } else {
      logger.debug(`🔄 Scroll Container: Primary selector failed, trying alternative: ${GoogleCalendarRepository.SELECTORS.SCROLL_CONTAINER_ALT}`);
      scrollContainer = DOMUtils.query(
        GoogleCalendarRepository.SELECTORS.SCROLL_CONTAINER_ALT, 
        calendarList
      );
      
      if (scrollContainer) {
        logger.info(`🔄 Scroll Container: Found using alternative selector: ${GoogleCalendarRepository.SELECTORS.SCROLL_CONTAINER_ALT}`);
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

    // Special handling for "Other calendars" - look in the entire document tree after this container
    if (containerLabel.toLowerCase().includes('other')) {
      logger.debug('Special handling for "Other calendars" - searching globally after expansion');
      
      // Wait a moment for any expansion to complete
      setTimeout(() => {}, 100);
      
      // Look for all calendar elements globally and try to identify which ones belong to "Other calendars"
      const allCalendarElements = this.getCalendarElements();
      logger.debug(`Found ${allCalendarElements.length} total calendar elements globally`);
      
      // Filter out elements that we know belong to "My calendars" (emails ending in gmail.com, birthdays, tasks)
      const otherCalendarElements = allCalendarElements.filter(element => {
        const email = this.extractCalendarEmail(element);
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
        logger.debug('Decoded Base64 data-id:', dataId, '->', decoded);
        if (emailRegex.test(decoded)) {
          return decoded;
        }
      } catch (error) {
        // Not valid Base64, continue with other methods
        logger.debug('Failed to decode data-id as Base64:', dataId);
      }
      
      // If data-id exists but doesn't decode to a valid email format,
      // it might still be a valid calendar identifier (like for Holidays)
      // Use the data-id as the email identifier even if it doesn't look like an email
      if (dataId.length > 0) {
        logger.debug('Using data-id as calendar identifier:', dataId);
        return dataId;
      }
    }

    // Try to find email in aria-label or title
    const labelElement = DOMUtils.query(GoogleCalendarRepository.SELECTORS.CALENDAR_LABEL, element);
    if (labelElement) {
      const ariaLabel = labelElement.getAttribute('aria-label') || '';
      const title = labelElement.getAttribute('title') || '';
      
      const emailMatch = (ariaLabel + ' ' + title).match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      if (emailMatch) return emailMatch[1];
    }

    // If no email found but we have a checkbox element, try to generate an ID from the aria-label
    const checkbox = DOMUtils.query<HTMLInputElement>('input[type="checkbox"]', element);
    if (checkbox) {
      const ariaLabel = checkbox.getAttribute('aria-label') || '';
      if (ariaLabel) {
        // Generate a pseudo-email from the aria-label for calendars like "Holidays in United States"
        const cleanLabel = ariaLabel.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '.');
        const pseudoEmail = `${cleanLabel}@google.calendar`;
        logger.debug('Generated pseudo-email from aria-label:', ariaLabel, '->', pseudoEmail);
        return pseudoEmail;
      }
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
   * Set calendar visibility by email (legacy method with delays)
   */
  private async setCalendarVisibility(email: string, isVisible: boolean): Promise<void> {
    const calendarElement = await this.findCalendarElementByEmail(email);
    if (!calendarElement) {
      logger.error(`🔘 Checkbox Click (Legacy): Calendar element not found for email: ${email}`);
      throw new Error(`Calendar element not found for email: ${email}`);
    }

    const checkbox = DOMUtils.query<HTMLInputElement>(
      GoogleCalendarRepository.SELECTORS.CALENDAR_CHECKBOX,
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
      GoogleCalendarRepository.SELECTORS.CALENDAR_CHECKBOX,
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
   * Clear the calendar cache to force fresh discovery
   */
  public clearCache(): void {
    logger.info('Clearing calendar cache');
    this.calendarCache = null;
  }

  /**
   * Log performance metrics for debugging
   */
  public logPerformanceMetrics(): void {
    const cacheStatus = this.calendarCache 
      ? `Cache: ${this.calendarCache.calendars.length} calendars, age: ${Date.now() - this.calendarCache.timestamp}ms`
      : 'Cache: empty';
    
    logger.info(`📊 GoogleCalendarRepository Performance - ${cacheStatus}`);
  }

  /**
   * Find calendar element by email using cached elements when possible
   */
  private async findCalendarElementByEmail(email: string): Promise<Element | null> {
    // First check cache
    if (this.calendarCache && 
        (Date.now() - this.calendarCache.timestamp) < GoogleCalendarRepository.CACHE_DURATION) {
      const cachedElement = this.calendarCache.elements.get(email);
      if (cachedElement) {
        logger.debug(`Using cached element for calendar: ${email}`);
        return cachedElement;
      }
    }
    
    // Fallback to discovery if not in cache
    await this.discoverCalendars(false); // Use cache if available
    
    // Try cache again after discovery
    if (this.calendarCache) {
      const cachedElement = this.calendarCache.elements.get(email);
      if (cachedElement) {
        return cachedElement;
      }
    }
    
    // Final fallback: search DOM directly
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
   * Invalidate cache when DOM structure might have changed
   */
  private invalidateCache(): void {
    if (this.calendarCache) {
      logger.debug('Invalidating calendar cache due to DOM changes');
      this.calendarCache = null;
    }
  }

  /**
   * Try to expand collapsed calendar sections (like "Other calendars")
   */
  private async expandCollapsedSections(): Promise<void> {
    try {
      logger.info('🔘 Button Selection: Looking for collapsed calendar sections to expand...');
      
      // Look for expand/collapse buttons or clickable headers
      const expandSelectors = [
        '[aria-label*="Other calendars" i][role="button"]',
        '[aria-label*="Other calendars" i] button',
        '[aria-expanded="false"]',
        'button[aria-expanded="false"]',
        '[role="button"][aria-expanded="false"]'
      ];
      
      let totalButtonsFound = 0;
      let buttonsClicked = 0;
      let buttonsSkipped = 0;
      
      for (const selector of expandSelectors) {
        const elements = Array.from(document.querySelectorAll(selector));
        logger.debug(`🔘 Button Selection: Selector "${selector}" found ${elements.length} elements`);
        totalButtonsFound += elements.length;
        
        for (const element of elements) {
          const ariaLabel = element.getAttribute('aria-label')?.toLowerCase() || '';
          const textContent = element.textContent?.toLowerCase() || '';
          const ariaExpanded = element.getAttribute('aria-expanded');
          
          logger.debug(`🔘 Button Selection: Examining element - Label: "${ariaLabel}", Text: "${textContent}", Expanded: ${ariaExpanded}`);
          
          // IMPORTANT: Skip "Add other calendars" buttons - we only want expand/collapse buttons
          if (ariaLabel.includes('add') || textContent.includes('add') || 
              ariaLabel.includes('create') || textContent.includes('create') ||
              ariaLabel.includes('subscribe') || textContent.includes('subscribe')) {
            logger.debug(`🔘 Button Selection: Skipping add/create button: ${ariaLabel || textContent}`);
            buttonsSkipped++;
            continue;
          }
          
          // Check if this looks like a calendar section header that might be collapsed
          if ((ariaLabel.includes('calendar') || textContent.includes('calendar')) &&
              (ariaLabel.includes('other') || textContent.includes('other')) &&
              // Additional check: look for collapsed indicators
              (element.getAttribute('aria-expanded') === 'false' || 
               ariaLabel.includes('expand') || textContent.includes('expand'))) {
            
            logger.info(`🔘 Button Selection: Found expandable section button - Label: "${ariaLabel || textContent}", Selector: "${selector}"`);
            
            // Try clicking to expand
            if (element instanceof HTMLElement) {
              logger.info(`🔘 Button Click: Clicking to expand collapsed section: ${ariaLabel || textContent}`);
              element.click();
              buttonsClicked++;
              this.invalidateCache(); // Cache might be stale after expanding
              logger.debug('🔘 Button Click: Waiting 500ms for expansion animation to complete...');
              await this.delay(500); // Wait for expansion animation
              logger.debug('🔘 Button Click: Expansion animation wait complete');
            } else {
              logger.warn(`🔘 Button Selection: Element is not an HTMLElement, cannot click: ${element.constructor.name}`);
            }
          } else {
            logger.debug(`🔘 Button Selection: Element does not match expansion criteria - skipping`);
            buttonsSkipped++;
          }
        }
      }
      
      // Also look for chevron/arrow icons that might indicate collapsed sections
      logger.debug('🔘 Button Selection: Searching for chevron/arrow icons in "Other calendars" sections...');
      const chevronElements = Array.from(document.querySelectorAll('[aria-label*="Other calendars" i] svg, [aria-label*="Other calendars" i] [role="img"]'));
      logger.debug(`🔘 Button Selection: Found ${chevronElements.length} potential chevron elements`);
      
      for (const chevron of chevronElements) {
        const parentButton = chevron.closest('button') || chevron.closest('[role="button"]');
        if (parentButton && parentButton instanceof HTMLElement) {
          const parentLabel = parentButton.getAttribute('aria-label') || parentButton.textContent || 'Unknown';
          logger.info(`🔘 Button Selection: Found chevron with parent button: "${parentLabel}"`);
          logger.info(`🔘 Button Click: Clicking chevron expand button: ${parentLabel}`);
          parentButton.click();
          buttonsClicked++;
          this.invalidateCache(); // Cache might be stale after expanding
          logger.debug('🔘 Button Click: Waiting 500ms for chevron expansion animation...');
          await this.delay(500);
          logger.debug('🔘 Button Click: Chevron expansion wait complete');
        } else {
          logger.debug('🔘 Button Selection: Chevron element has no clickable parent button');
        }
      }
      
      logger.info(`🔘 Button Selection: Expansion complete - Total buttons found: ${totalButtonsFound}, Clicked: ${buttonsClicked}, Skipped: ${buttonsSkipped}`);
      
    } catch (error) {
      logger.warn('🔘 Button Selection: Error expanding collapsed sections:', error);
    }
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}