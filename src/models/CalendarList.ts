/**
 * Calendar list management
 */
import { Calendar } from './Calendar';
import * as Logger from '../utils/logger';
import { findVisibleCalendarElements, findCalendarListContainer } from '../utils/domSelectors';
import { scanElement, Overlay } from '../utils/domOperations';

/**
 * Represents a list of calendars with operations to manipulate them
 */
export class CalendarList extends Array<Calendar> {
  constructor(...args: any[]) {
    super(...args);
    // Set the prototype explicitly for proper inheritance
    Object.setPrototypeOf(this, CalendarList.prototype);
  }

  /**
   * Perform any initialization needed for this list
   * @returns This list for chaining
   */
  async initialize(): Promise<CalendarList> {
    return this;
  }

  /**
   * Get a calendar by ID
   * @param id Calendar ID to find
   * @returns Calendar or undefined if not found
   */
  get(id: string): Calendar | undefined {
    return this.find(cal => cal.id === id);
  }

  /**
   * Refresh DOM elements for calendars in the list
   * @param cals Optional subset of calendars to refresh, or all if omitted
   * @returns Refreshed calendars
   */
  refreshVisibleCalendarDOMs(...cals: Calendar[]): Calendar[] {
    const calendars = cals.length > 0 ? cals : this;
    
    // Get all visible calendar elements
    const visibleCalendarElements = findVisibleCalendarElements();
    
    if (visibleCalendarElements.length === 0) {
      Logger.warn('Could not find calendar elements using known selectors');
      return calendars;
    }
    
    Logger.debug(`Found ${visibleCalendarElements.length} visible calendar elements`);
    
    // For each calendar that needs refreshing, find its matching DOM element
    for (const cal of calendars) {
      if (!cal.attached) {
        // First try to match by ID
        let foundMatch = false;
          for (const el of visibleCalendarElements) {
          // Use the same approach as the original implementation
          const labelEl = el.querySelector('div');
          const checkbox = el.querySelector('input[type="checkbox"]') as HTMLInputElement;
          
          let matchesId = false;
          
          if (labelEl && checkbox) {
            // Try to match by decoded data-id (like original implementation)
            const dataId = labelEl.getAttribute('data-id');
            if (dataId) {
              try {
                const decodedId = atob(dataId);
                if (decodedId === cal.id) {
                  matchesId = true;
                }
              } catch (error) {
                // If base64 decode fails, try direct comparison
                if (dataId === cal.id) {
                  matchesId = true;
                }
              }
            }
            
            // Also try matching by checkbox aria-label (calendar name)
            if (!matchesId) {
              const ariaLabel = checkbox.getAttribute('aria-label');
              if (ariaLabel === cal.name) {
                matchesId = true;
              }
            }
          }
          
          // Fallback to the old complex matching logic if needed
          if (!matchesId) {
            const fallbackCheckbox = findCheckboxInCalendar(el);
            
            if (fallbackCheckbox) {
              if (fallbackCheckbox instanceof HTMLInputElement && fallbackCheckbox.value === cal.id) {
                matchesId = true;
              } else {
                const dataId = fallbackCheckbox.getAttribute('data-cal-id') || 
                              fallbackCheckbox.getAttribute('data-id') || 
                              fallbackCheckbox.getAttribute('id');
                if (dataId === cal.id) {
                  matchesId = true;
                }
              }
            }
            
            // If still not found by ID, try matching by name
            if (!matchesId) {
              const nameElements = el.querySelectorAll('span, div[role="heading"], label');
              for (const nameEl of Array.from(nameElements)) {
                if (nameEl.textContent?.trim() === cal.name) {
                  matchesId = true;
                  break;
                }
              }
            }
          }
          
          if (matchesId) {
            cal.setEl(el);
            foundMatch = true;
            break;
          }
        }
        
        if (!foundMatch) {
          Logger.debug(`Could not find DOM element for calendar: ${cal.name} (${cal.id})`);
        }
      }
    }
    
    return calendars;
  }

  /**
   * Get enabled calendars
   * @returns Array of enabled calendars
   */
  enabled(): Calendar[] {
    return this.filter(cal => cal.isChecked());
  }

  /**
   * Get disabled calendars
   * @returns Array of disabled calendars
   */
  disabled(): Calendar[] {
    return this.filter(cal => !cal.isChecked());
  }

  /**
   * Ensure a calendar has a valid DOM reference
   * @param calendar Calendar to validate
   * @param opts Options for validation
   * @returns Calendar with valid DOM
   */
  async ensureValidDOM(calendar: Calendar, opts = { restoreScroll: true }): Promise<Calendar> {
    if (calendar.attached) return calendar;
    
    return this._ensureValidDOM(calendar, opts);
  }

  /**
   * Internal method to ensure valid DOM with scrolling if needed
   * @param calendar Calendar to validate
   * @param opts Options for validation
   * @returns Calendar with valid DOM
   */
  private async _ensureValidDOM(calendar: Calendar, opts = { restoreScroll: true }): Promise<Calendar> {
    // Refresh all calendar DOMs first
    this.refreshVisibleCalendarDOMs();
    
    if (!calendar.attached) {
      // Try to find the calendar by scanning through scroll
      const container = CalendarList.getScrollContainer();
      if (!container) return calendar;
      
      const overlay = Overlay.createInstance({ target: container });
      overlay.show();
      
      try {
        await scanElement(container, { scrollIncrement: 100 }, () => {
          this.refreshVisibleCalendarDOMs(calendar);
          return calendar.attached;
        });
      } finally {
        overlay.hide();
      }
    }
    
    // If still not attached, it's probably not visible
    if (!calendar.attached) {
      Logger.warn('Could not find calendar in visible list:', { id: calendar.id, name: calendar.name });
    } else if (opts.restoreScroll && calendar.scrollPosition) {
      await calendar.dom?.scrollTo();
    }
    
    return calendar;
  }

  /**
   * Toggle multiple calendars
   * @param cals Calendars to toggle
   * @param opts Options for toggling
   * @returns Toggled calendars
   */
  async toggleAll(cals: Calendar[], opts = { restoreScroll: true }): Promise<Calendar[]> {
    for (const cal of cals) {
      await this.toggleSingle(cal, opts);
    }
    return cals;
  }

  /**
   * Toggle a single calendar
   * @param cal Calendar to toggle
   * @param opts Options for toggling
   * @returns Toggled calendar
   */
  async toggleSingle(cal: Calendar, opts = { restoreScroll: true }): Promise<Calendar> {
    await this.ensureValidDOM(cal, opts);
    if (cal.attached) {
      cal.toggle();
    }
    return cal;
  }

  /**
   * Enable calendars
   * @param filterFn Optional filter function to select calendars
   * @returns Enabled calendars
   */
  async enable(filterFn?: (cal: Calendar) => boolean): Promise<Calendar[]> {
    const calendars = filterFn ? this.filter(filterFn) : this.slice();
    
    for (const cal of calendars) {
      await this.ensureValidDOM(cal);
      if (cal.attached) {
        cal.enable();
      }
    }
    
    return calendars;
  }

  /**
   * Disable calendars
   * @param filterFn Optional filter function to select calendars
   * @returns Disabled calendars
   */
  async disable(filterFn?: (cal: Calendar) => boolean): Promise<Calendar[]> {
    const calendars = filterFn ? this.filter(filterFn) : this.slice();
    
    for (const cal of calendars) {
      await this.ensureValidDOM(cal);
      if (cal.attached) {
        cal.disable();
      }
    }
    
    return calendars;
  }

  /**
   * Toggle calendars
   * @param filterFn Optional filter function to select calendars
   * @returns Toggled calendars
   */
  async toggle(filterFn?: (cal: Calendar) => boolean): Promise<Calendar[]> {
    const calendars = filterFn ? this.filter(filterFn) : this.slice();
    
    for (const cal of calendars) {
      await this.toggleSingle(cal);
    }
    
    return calendars;
  }

  /**
   * Toggle calendars by ID
   * @param calIds IDs of calendars to toggle
   * @param opts Options for toggling
   * @returns Toggled calendars
   */
  async toggleById(calIds: string[], opts?: any): Promise<Calendar[]> {
    const calendars = this.filter(cal => calIds.includes(cal.id));
    return this.toggleAll(calendars, opts);
  }

  /**
   * Save scroll positions for all calendars
   * @returns This list for chaining
   */
  async discoverCalendarScrollPositions(): Promise<CalendarList> {
    await CalendarList.discoverCalendarScrollPositions(this);
    return this;
  }

  /**
   * Get the scroll container for calendars
   * @returns Scroll container element or null if not found
   */
  static getScrollContainer(): HTMLElement | null {
    return findCalendarListContainer();
  }
  
  /**
   * Get visible calendar elements
   * @returns Array of visible calendar elements
   */
  static getVisibleCalendarElements(): HTMLElement[] {
    return findVisibleCalendarElements();
  }

  /**
   * Save scroll positions for an array of calendars
   * @param calendars Calendars to save positions for
   * @param opts Options for saving
   * @returns Calendars with saved positions
   */
  static async discoverCalendarScrollPositions(
    calendars: Calendar[], 
    opts = {}
  ): Promise<Calendar[]> {
    // Save current scroll positions for all calendars
    for (const cal of calendars) {
      if (cal.attached) {
        await cal.saveScrollPosition();
      }
    }
    return calendars;
  }

  /**
   * Get all calendar instances from the UI
   * @returns List of all calendars
   */
  static async getInstance(): Promise<CalendarList> {
    Logger.info('Getting all calendar instances...');
    
    // Find all visible calendar elements
    const visibleElements = findVisibleCalendarElements();
    
    if (visibleElements.length === 0) {
      Logger.warn('Could not find calendar elements with standard selectors');
    }
    
    Logger.debug(`Found ${visibleElements.length} calendar elements total`);
    
    const calendarList = new CalendarList();
    
    // Create Calendar objects for each visible element
    for (const el of visibleElements) {
      const cal = new Calendar(el);
      if (cal.id && cal.name) {
        calendarList.push(cal);
      } else {
        Logger.warn('Skipping calendar with missing ID or name:', cal);
      }
    }
    
    Logger.info(`Created ${calendarList.length} Calendar objects`);
    
    // Save scroll positions
    await calendarList.discoverCalendarScrollPositions();
    return calendarList;
  }
}

/**
 * Find a checkbox element within a calendar element
 * @param parent The calendar element to search within
 * @returns Checkbox element or null if not found
 */
function findCheckboxInCalendar(parent: HTMLElement): HTMLElement | null {
  // Try multiple selectors to find the checkbox
  const selectors = [
    'input[type="checkbox"]',
    '[role="checkbox"]',
    '[aria-checked]',
    '.calendar-checkbox',
    '.checkbox-container input'
  ];
  
  for (const selector of selectors) {
    const checkbox = parent.querySelector(selector);
    if (checkbox) {
      return checkbox as HTMLElement;
    }
  }
  
  // Log a warning if no checkbox is found
  Logger.warn('No checkbox found for calendar in element:', parent);
  return null;
}
