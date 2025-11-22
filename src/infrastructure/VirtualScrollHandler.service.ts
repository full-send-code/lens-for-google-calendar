/**
 * Virtual Scroll Handler Service
 * Handles virtual scrolling behavior for Google Calendar
 */

import { CalendarDOMSelector } from './CalendarDOMSelector.service';
import logger from './logger';

/**
 * Service responsible for handling virtual scrolling behavior
 */
export class VirtualScrollHandler {
  private static readonly TIMEOUTS = {
    SCROLL_SETTLE: 300,
    EXPANSION_ANIMATION: 500
  };

  constructor(
    private domSelector: CalendarDOMSelector
  ) {}

  /**
   * Scroll through virtual calendar list to discover all calendars
   */
  async scrollToDiscoverAllCalendars(calendarList: Element): Promise<void> {
    const scrollContainer = this.domSelector.getScrollContainer(calendarList);
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
      await this.delay(VirtualScrollHandler.TIMEOUTS.SCROLL_SETTLE);
      
      // Count current calendars
      currentCalendarCount = this.domSelector.getCalendarElements().length;
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
    await this.delay(VirtualScrollHandler.TIMEOUTS.SCROLL_SETTLE);
    logger.info(`🔄 Virtual Scroll: Virtual scroll complete. Final calendar count: ${currentCalendarCount}`);
  }

  /**
   * Try to expand collapsed calendar sections (like "Other calendars")
   */
  async expandCollapsedSections(): Promise<void> {
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
          const result = await this.tryExpandElement(element);
          if (result.clicked) {
            buttonsClicked++;
          } else {
            buttonsSkipped++;
          }
        }
      }
      
      // Also look for chevron/arrow icons that might indicate collapsed sections
      logger.debug('🔘 Button Selection: Searching for chevron/arrow icons in "Other calendars" sections...');
      const chevronElements = Array.from(document.querySelectorAll('[aria-label*="Other calendars" i] svg, [aria-label*="Other calendars" i] [role="img"]'));
      logger.debug(`🔘 Button Selection: Found ${chevronElements.length} potential chevron elements`);
      
      for (const chevron of chevronElements) {
        const result = await this.tryExpandChevronElement(chevron);
        if (result.clicked) {
          buttonsClicked++;
        }
      }
      
      logger.info(`🔘 Button Selection: Expansion complete - Total buttons found: ${totalButtonsFound}, Clicked: ${buttonsClicked}, Skipped: ${buttonsSkipped}`);
      
    } catch (error) {
      logger.warn('🔘 Button Selection: Error expanding collapsed sections:', error);
    }
  }

  /**
   * Try to expand a specific element
   */
  private async tryExpandElement(element: Element): Promise<{ clicked: boolean }> {
    const ariaLabel = element.getAttribute('aria-label')?.toLowerCase() || '';
    const textContent = element.textContent?.toLowerCase() || '';
    const ariaExpanded = element.getAttribute('aria-expanded');
    
    logger.debug(`🔘 Button Selection: Examining element - Label: "${ariaLabel}", Text: "${textContent}", Expanded: ${ariaExpanded}`);
    
    // IMPORTANT: Skip "Add other calendars" buttons - we only want expand/collapse buttons
    if (ariaLabel.includes('add') || textContent.includes('add') || 
        ariaLabel.includes('create') || textContent.includes('create') ||
        ariaLabel.includes('subscribe') || textContent.includes('subscribe')) {
      logger.debug(`🔘 Button Selection: Skipping add/create button: ${ariaLabel || textContent}`);
      return { clicked: false };
    }
    
    // Check if this looks like a calendar section header that might be collapsed
    if ((ariaLabel.includes('calendar') || textContent.includes('calendar')) &&
        (ariaLabel.includes('other') || textContent.includes('other')) &&
        // Additional check: look for collapsed indicators
        (element.getAttribute('aria-expanded') === 'false' || 
         ariaLabel.includes('expand') || textContent.includes('expand'))) {
      
      logger.info(`🔘 Button Selection: Found expandable section button - Label: "${ariaLabel || textContent}"`);
      
      // Try clicking to expand
      if (element instanceof HTMLElement) {
        logger.info(`🔘 Button Click: Clicking to expand collapsed section: ${ariaLabel || textContent}`);
        element.click();
        logger.debug('🔘 Button Click: Waiting 500ms for expansion animation to complete...');
        await this.delay(VirtualScrollHandler.TIMEOUTS.EXPANSION_ANIMATION);
        logger.debug('🔘 Button Click: Expansion animation wait complete');
        return { clicked: true };
      } else {
        logger.warn(`🔘 Button Selection: Element is not an HTMLElement, cannot click: ${element.constructor.name}`);
        return { clicked: false };
      }
    } else {
      logger.debug(`🔘 Button Selection: Element does not match expansion criteria - skipping`);
      return { clicked: false };
    }
  }

  /**
   * Try to expand a chevron element
   */
  private async tryExpandChevronElement(chevron: Element): Promise<{ clicked: boolean }> {
    const parentButton = chevron.closest('button') || chevron.closest('[role="button"]');
    if (parentButton && parentButton instanceof HTMLElement) {
      const parentLabel = parentButton.getAttribute('aria-label') || parentButton.textContent || 'Unknown';
      logger.info(`🔘 Button Selection: Found chevron with parent button: "${parentLabel}"`);
      logger.info(`🔘 Button Click: Clicking chevron expand button: ${parentLabel}`);
      parentButton.click();
      logger.debug('🔘 Button Click: Waiting 500ms for chevron expansion animation...');
      await this.delay(VirtualScrollHandler.TIMEOUTS.EXPANSION_ANIMATION);
      logger.debug('🔘 Button Click: Chevron expansion wait complete');
      return { clicked: true };
    } else {
      logger.debug('🔘 Button Selection: Chevron element has no clickable parent button');
      return { clicked: false };
    }
  }

  /**
   * Scroll through calendar container and process each visible calendar immediately
   * New approach: No caching, process calendars as they appear during scroll
   */
  async scrollAndProcessCalendars(
    container: Element,
    processor: (calendarElements: Element[]) => Promise<void>
  ): Promise<void> {
    const scrollContainer = this.domSelector.getScrollContainer(container);
    if (!scrollContainer) {
      logger.warn('No scroll container found, processing visible calendars only');
      const visibleCalendars = this.domSelector.getCalendarElementsInContainer(container);
      await processor(visibleCalendars);
      return;
    }

    logger.info('Starting scroll-and-process for container');

    // Scroll to top first
    scrollContainer.scrollTop = 0;
    await this.delay(300);

    let previousScrollTop = -1;
    let scrollAttempt = 0;
    const maxScrollAttempts = 10;
    
    while (scrollContainer.scrollTop !== previousScrollTop && scrollAttempt < maxScrollAttempts) {
      previousScrollTop = scrollContainer.scrollTop;
      scrollAttempt++;
      
      // Get visible calendars at current scroll position
      const visibleCalendars = this.domSelector.getCalendarElementsInContainer(container);
      logger.debug(`Scroll attempt ${scrollAttempt}: Processing ${visibleCalendars.length} visible calendars`);
      
      // Process them immediately via callback
      await processor(visibleCalendars);
      
      // Scroll down one viewport height
      scrollContainer.scrollTop += scrollContainer.clientHeight;
      await this.delay(300); // Let DOM settle
    }
    
    logger.info(`Scroll-and-process complete after ${scrollAttempt} scroll attempts`);
    
    // Scroll back to top when done
    scrollContainer.scrollTop = 0;
    await this.delay(300);
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
