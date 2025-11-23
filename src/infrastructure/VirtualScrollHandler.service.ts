/**
 * Virtual Scroll Handler Service
 * Orchestrates virtual scrolling operations for Google Calendar
 *
 * Follows SOLID principles:
 * - Single Responsibility: Orchestrates scrolling operations
 * - Open/Closed: Extensible through composition
 * - Dependency Inversion: Depends on abstractions (CalendarDOMSelector)
 */

import { CalendarDOMSelector } from './CalendarDOMSelector.service';
import logger from './logger';

/**
 * Service responsible for orchestrating virtual scrolling operations
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
   * Expand all collapsed calendar sections
   *
   * This method specifically targets only the "My calendars" and "Other calendars"
   * section headers in Google Calendar. Based on extensive debugging:
   *
   * - Uses aria-expanded="false" to find collapsed sections
   * - Filters by text content containing "My calendars" or "Other calendars" + keyboard arrows
   * - Avoids auto-generated CSS class names which change with Google Calendar updates
   * - Skips all other expandable buttons (menus, settings, etc.) to prevent side effects
   *
   * This approach ensures reliable expansion without triggering unintended UI interactions.
   */
  async expandSections(): Promise<void> {
    logger.info('🔘 Expanding collapsed calendar sections...');

    // First, let's debug what expandable elements exist
    const debugResult = this.debugExpandableElements();

    // Target specifically calendar section expand buttons (avoid auto-generated classes)
    // Note: We use aria-expanded="false" because Google Calendar section headers
    // have this attribute when collapsed, and we filter by specific text content
    // to avoid clicking menus, settings buttons, or other expandable elements
    const calendarSectionSelectors = [
      'button[aria-expanded="false"]' // Collapsed sections - we'll filter by content
    ];

    let expandedCount = 0;

    for (const selector of calendarSectionSelectors) {
      const buttons = Array.from(document.querySelectorAll(selector)) as HTMLElement[];

      for (const button of buttons) {
        const ariaLabel = button.getAttribute('aria-label') || '';
        const textContent = button.textContent || '';

        // Only expand calendar section headers (My calendars, Other calendars)
        // Text content patterns observed: "My calendarskeyboard_arrow_up", "Other calendarskeyboard_arrow_down"
        // This specific filtering prevents clicking:
        // - "Add other calendars" menu buttons
        // - Individual calendar option menus (more_vert buttons)
        // - Settings, support, or other UI buttons
        if ((textContent.includes('My calendars') || textContent.includes('Other calendars')) &&
            (textContent.includes('keyboard_arrow_up') || textContent.includes('keyboard_arrow_down'))) {
          logger.info(`🔘 Clicking calendar section expand button: "${ariaLabel}" (text: "${textContent}")`);
          button.click();
          expandedCount++;
          await this.delay(VirtualScrollHandler.TIMEOUTS.EXPANSION_ANIMATION);
        } else {
          logger.debug(`🔘 Skipping non-calendar section button: "${ariaLabel}" (text: "${textContent}")`);
        }
      }
    }

    logger.info(`🔘 Section expansion complete: clicked ${expandedCount} expand buttons`);
  }

  /**
   * Count all discoverable calendars through scrolling
   */
  async countCalendars(): Promise<number> {
    const elements = await this.discoverCalendars();
    return elements.length;
  }

  /**
   * Discover all calendar elements through scrolling
   */
  async discoverCalendars(): Promise<Element[]> {
    logger.info('🔄 Starting calendar discovery...');

    const scrollContainer = this.findScrollContainer();
    if (!scrollContainer) {
      logger.warn('🔄 No scroll container found, returning currently visible calendars');
      return this.domSelector.getCalendarElements();
    }

    // Expand sections first
    await this.expandSections();

    const discoveredElements = new Set<Element>();
    const stepSize = scrollContainer.clientHeight;
    const maxScrolls = 20;

    // Scroll to bottom in steps, collecting elements
    for (let i = 0; i < maxScrolls; i++) {
      scrollContainer.scrollTop += stepSize;
      await this.delay(VirtualScrollHandler.TIMEOUTS.SCROLL_SETTLE);

      const currentElements = this.domSelector.getCalendarElements();
      currentElements.forEach(el => discoveredElements.add(el));

      if (scrollContainer.scrollTop >= scrollContainer.scrollHeight - scrollContainer.clientHeight) {
        break; // Reached bottom
      }
    }

    // Scroll back to top
    scrollContainer.scrollTop = 0;
    await this.delay(VirtualScrollHandler.TIMEOUTS.SCROLL_SETTLE);

    const elementsArray = Array.from(discoveredElements);
    logger.info(`🔄 Discovery complete: ${elementsArray.length} unique calendars`);
    return elementsArray;
  }

  /**
   * Find the scroll container for calendar list
   */
  private findScrollContainer(): Element | null {
    // Try known selectors first
    const knownSelectors = [
      '[role="grid"]',
      '.calendar-list-container',
      '[data-testid="calendar-list"]'
    ];

    for (const selector of knownSelectors) {
      const element = document.querySelector(selector);
      if (element && this.isScrollable(element)) {
        logger.info(`🔄 Found scroll container: ${selector}`);
        return element;
      }
    }

    // Fallback: traverse from calendar elements
    logger.info('🔄 Known selectors failed, traversing from calendar elements...');
    return this.findScrollContainerByTraversal();
  }

  /**
   * Find scroll container by traversing up from calendar elements
   */
  private findScrollContainerByTraversal(): Element | null {
    const calendarElements = this.domSelector.getCalendarElements();
    if (calendarElements.length === 0) {
      logger.warn('🔄 No calendar elements found to traverse from');
      return null;
    }

    let currentElement: Element | null = calendarElements[0];
    const visited = new Set<Element>();
    const candidates: { element: Element; depth: number; calendarCount: number }[] = [];

    // Traverse up, collecting scrollable containers
    while (currentElement && currentElement !== document.body) {
      if (visited.has(currentElement)) break;
      visited.add(currentElement);

      if (this.isScrollable(currentElement)) {
        const scrollHeight = currentElement.scrollHeight;
        const clientHeight = currentElement.clientHeight;

        if (scrollHeight > clientHeight && scrollHeight > 100) {
          const calendarCount = currentElement.querySelectorAll('[data-id]:has(input[type="checkbox"])').length;

          candidates.push({
            element: currentElement,
            depth: visited.size,
            calendarCount
          });

          logger.debug(`🔄 Candidate: ${currentElement.tagName}.${currentElement.className} - calendars=${calendarCount}, depth=${visited.size}`);
        }
      }

      currentElement = currentElement.parentElement;
    }

    // Select best candidate: more calendars, then shallower depth
    if (candidates.length > 0) {
      candidates.sort((a, b) => {
        if (a.calendarCount !== b.calendarCount) {
          return b.calendarCount - a.calendarCount;
        }
        return a.depth - b.depth;
      });

      const best = candidates[0];
      logger.info(`🔄 Selected container: ${best.element.tagName}.${best.element.className} - calendars=${best.calendarCount}`);
      return best.element;
    }

    // Final fallback: search scrollable elements near calendar area
    logger.info('🔄 Traversal failed, searching calendar area...');
    return this.findScrollableInCalendarArea();
  }

  /**
   * Find scrollable elements in the calendar area
   */
  private findScrollableInCalendarArea(): Element | null {
    const scrollableDivs = Array.from(document.querySelectorAll('div')).filter(div =>
      this.isScrollable(div) &&
      div.scrollHeight > div.clientHeight &&
      div.scrollHeight > 100
    );

    const candidates: { element: Element; calendarCount: number; proximity: number }[] = [];

    for (const div of scrollableDivs) {
      const directCalendars = div.querySelectorAll('[data-id]:has(input[type="checkbox"])');
      if (directCalendars.length > 0) {
        candidates.push({
          element: div,
          calendarCount: directCalendars.length,
          proximity: 0
        });
        continue;
      }

      // Check nearby siblings
      const siblings = Array.from(div.parentElement?.children || []);
      const divIndex = siblings.indexOf(div);

      let maxProximityCalendars = 0;
      for (let i = Math.max(0, divIndex - 3); i < Math.min(siblings.length, divIndex + 4); i++) {
        if (i === divIndex) continue;
        const siblingCalendars = siblings[i].querySelectorAll('[data-id]:has(input[type="checkbox"])');
        if (siblingCalendars.length > maxProximityCalendars) {
          maxProximityCalendars = siblingCalendars.length;
        }
      }

      if (maxProximityCalendars > 0) {
        const calendarIndex = siblings.findIndex(s =>
          s.querySelectorAll('[data-id]:has(input[type="checkbox"])').length > 0
        );
        candidates.push({
          element: div,
          calendarCount: maxProximityCalendars,
          proximity: Math.abs(divIndex - calendarIndex)
        });
      }
    }

    if (candidates.length > 0) {
      candidates.sort((a, b) => {
        if (a.calendarCount !== b.calendarCount) {
          return b.calendarCount - a.calendarCount;
        }
        return a.proximity - b.proximity;
      });

      const best = candidates[0];
      logger.info(`🔄 Found container in calendar area: ${best.element.tagName}.${best.element.className} - calendars=${best.calendarCount}`);
      return best.element;
    }

    logger.warn('🔄 No suitable scroll container found');
    return null;
  }

  /**
   * Check if element is scrollable
   */
  private isScrollable(element: Element): boolean {
    const style = getComputedStyle(element);
    return style.overflow === 'auto' || style.overflow === 'scroll' ||
           style.overflowY === 'auto' || style.overflowY === 'scroll';
  }

  /**
   * Debug method to inspect scroll container detection
   */
  debugScrollContainer(): { container: Element | null; grids: Element[]; isScrollable: boolean; method?: string } {
    const container = this.findScrollContainer();
    const grids = Array.from(document.querySelectorAll('[role="grid"]'));

    let method: string | undefined;
    if (container) {
      const knownSelectors = ['[role="grid"]', '.calendar-list-container', '[data-testid="calendar-list"]'];
      method = knownSelectors.find(selector => document.querySelector(selector) === container) || 'traversal';
    }

    return {
      container,
      grids,
      isScrollable: container ? this.isScrollable(container) : false,
      method
    };
  }

  /**
   * Debug method to find all expandable elements
   */
  debugExpandableElements(): { buttons: Element[]; expandableSections: Element[] } {
    // Find all potentially expandable buttons
    const allButtons = Array.from(document.querySelectorAll('button, [role="button"]'));
    const expandableButtons = allButtons.filter(button => {
      const ariaLabel = button.getAttribute('aria-label') || '';
      const ariaExpanded = button.getAttribute('aria-expanded');
      const textContent = button.textContent || '';

      // Look for buttons that might be expandable
      const isExpandable =
        ariaExpanded !== null || // Has aria-expanded attribute
        ariaLabel.toLowerCase().includes('expand') ||
        ariaLabel.toLowerCase().includes('collapse') ||
        ariaLabel.toLowerCase().includes('show') ||
        ariaLabel.toLowerCase().includes('hide') ||
        textContent.toLowerCase().includes('expand') ||
        textContent.toLowerCase().includes('collapse') ||
        textContent.toLowerCase().includes('show') ||
        textContent.toLowerCase().includes('hide');

      return isExpandable;
    });

    // Find elements with aria-expanded attribute
    const ariaExpandedElements = Array.from(document.querySelectorAll('[aria-expanded]'));

    logger.info(`🔍 Found ${expandableButtons.length} potentially expandable buttons`);
    logger.info(`🔍 Found ${ariaExpandedElements.length} elements with aria-expanded`);

    expandableButtons.forEach((button, index) => {
      const ariaLabel = button.getAttribute('aria-label') || 'no-label';
      const ariaExpanded = button.getAttribute('aria-expanded') || 'not-set';
      const textContent = (button.textContent || '').trim();
      const tagName = button.tagName.toLowerCase();
      const className = button.className || 'no-class';

      logger.info(`🔍 Expandable Button ${index}: ${tagName}.${className} [aria-label="${ariaLabel}"] [aria-expanded="${ariaExpanded}"] text="${textContent}"`);
    });

    return {
      buttons: expandableButtons,
      expandableSections: ariaExpandedElements
    };
  }  /**
   * Scroll element into view for interaction
   * Different from container scrolling - this ensures individual elements are visible before interaction
   */
  async scrollElementIntoView(element: Element): Promise<void> {
    if (!this.isElementVisible(element)) {
      logger.debug('🔄 Scrolling element into view for interaction');
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      await this.delay(100); // Allow scroll to complete
    }
  }

  /**
   * Check if element is visible in viewport
   */
  private isElementVisible(element: Element): boolean {
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const windowWidth = window.innerWidth || document.documentElement.clientWidth;

    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= windowHeight &&
      rect.right <= windowWidth
    );
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Legacy methods for backward compatibility

  async simpleExpandCollapse(): Promise<void> {
    return this.expandSections();
  }

  async simpleScrollAndCount(): Promise<number> {
    return this.countCalendars();
  }

  async simpleScrollAndDiscover(): Promise<Element[]> {
    return this.discoverCalendars();
  }

  async scrollToDiscoverAllCalendars(calendarList: Element): Promise<void> {
    await this.countCalendars();
  }

  async expandCollapsedSections(): Promise<void> {
    return this.expandSections();
  }

  /**
   * Scroll through calendar list and process visible elements
   * Optimized for applying visibility changes without full discovery
   */
  async scrollAndProcessCalendars(
    processor: (visibleElements: Element[]) => Promise<void>
  ): Promise<void> {
    logger.info('🔄 Starting scroll-and-process operation');

    const scrollContainer = this.findScrollContainer();
    if (!scrollContainer) {
      logger.warn('🔄 No scroll container found, processing currently visible calendars');
      const visibleElements = this.domSelector.getCalendarElements();
      await processor(visibleElements);
      return;
    }

    // Expand sections first
    await this.expandSections();

    const stepSize = scrollContainer.clientHeight;
    let totalProcessed = 0;
    const maxScrolls = 200; // Very high limit to handle many calendars
    const processedElements = new Set<Element>(); // Track processed elements to avoid duplicates

    // Scroll to top first
    scrollContainer.scrollTop = 0;
    await this.delay(VirtualScrollHandler.TIMEOUTS.SCROLL_SETTLE);

    // Scroll down step by step, processing visible elements at each step
    for (let i = 0; i < maxScrolls; i++) {
      // Get currently visible calendar elements
      const visibleElements = this.domSelector.getCalendarElements();

      // Filter out already processed elements
      const newElements = visibleElements.filter(element => !processedElements.has(element));

      if (newElements.length > 0) {
        logger.debug(`🔄 Processing ${newElements.length} new visible elements at scroll position ${i}`);
        await processor(newElements);
        totalProcessed += newElements.length;

        // Mark these elements as processed
        newElements.forEach(element => processedElements.add(element));
      }

      // Scroll down to next batch
      const previousScrollTop = scrollContainer.scrollTop;
      scrollContainer.scrollTop += stepSize;
      await this.delay(VirtualScrollHandler.TIMEOUTS.SCROLL_SETTLE);

      // Check if we reached the bottom
      if (scrollContainer.scrollTop >= scrollContainer.scrollHeight - scrollContainer.clientHeight ||
          scrollContainer.scrollTop === previousScrollTop) {
        logger.info(`🔄 Reached bottom after ${i + 1} scroll steps`);
        break; // Reached bottom or can't scroll further
      }
    }

    // Scroll back to top
    scrollContainer.scrollTop = 0;
    await this.delay(VirtualScrollHandler.TIMEOUTS.SCROLL_SETTLE);

    logger.info(`🔄 Scroll-and-process complete: processed ${totalProcessed} unique elements`);
  }
}
