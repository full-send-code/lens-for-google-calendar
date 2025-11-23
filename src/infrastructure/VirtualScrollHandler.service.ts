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
   */
  async expandSections(): Promise<void> {
    logger.info('🔘 Expanding collapsed calendar sections...');

    const selectors = [
      'button[aria-label*="Other calendars" i]',
      '[role="button"][aria-label*="Other calendars" i]',
      'button[aria-expanded="false"]'
    ];

    for (const selector of selectors) {
      const buttons = Array.from(document.querySelectorAll(selector)) as HTMLElement[];
      for (const button of buttons) {
        const label = button.getAttribute('aria-label') || button.textContent || '';
        if (label.toLowerCase().includes('other') && label.toLowerCase().includes('calendar')) {
          logger.info(`🔘 Clicking expand button: ${label}`);
          button.click();
          await this.delay(VirtualScrollHandler.TIMEOUTS.EXPANSION_ANIMATION);
        }
      }
    }

    logger.info('🔘 Section expansion complete');
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

  async scrollAndProcessCalendars(
    container: Element,
    processor: (calendarElements: Element[]) => Promise<void>
  ): Promise<void> {
    const elements = await this.discoverCalendars();
    await processor(elements);
  }
}
