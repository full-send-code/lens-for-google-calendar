/**
 * Calendar models and related classes
 */
import * as Logger from '../utils/logger';
import { findCheckboxInCalendar } from '../utils/domSelectors';
import { scrollElementTo, scanElement, Overlay } from '../utils/domOperations';

/**
 * Represents a calendar's DOM element and provides operations for it
 */
export class CalendarDOM {
  /** The DOM element for this calendar */
  el: HTMLElement;
  
  /** The calendar associated with this DOM element */
  calendar: Calendar;
  
  /**
   * Create a new CalendarDOM instance
   * @param el DOM element representing the calendar in the sidebar
   * @param calendar The calendar this DOM element represents
   */
  constructor(el: HTMLElement, calendar: Calendar) {
    this.el = el;
    this.calendar = calendar;
  }

  /**
   * Check if this DOM element is still attached to the document
   * @returns Whether element is attached
   */
  isAttached(): boolean {
    return document.body.contains(this.el);
  }
  /**
   * Get the scroll container for calendars
   * Uses the original working implementation's approach
   * @returns Scroll container element or null if not found
   */
  getScrollContainer(): HTMLElement | null {
    try {
      const drawerNavigator = document.querySelector('div#drawerMiniMonthNavigator');
      return drawerNavigator?.parentElement as HTMLElement || null;
    } catch (e) {
      Logger.warn('Could not find calendar list scroll container via "div#drawerMiniMonthNavigator"');
      // Fallback to generic list selector
      return document.querySelector('div[role="list"]');
    }
  }

  /**
   * Calculate where this calendar is in the scroll container
   * @returns Scroll position in pixels
   */
  async calculateScrollPosition(): Promise<number> {
    const container = this.getScrollContainer();
    if (!container || !this.isAttached()) return 0;

    const rect = this.el.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    return rect.top - containerRect.top + container.scrollTop;
  }

  /**
   * Scroll to this calendar in the list
   */
  async scrollTo(): Promise<void> {
    const container = this.getScrollContainer();
    if (!container || !this.isAttached()) return;

    const position = await this.calculateScrollPosition();
    await scrollElementTo(container, position);
  }
}

/**
 * Represents a Google Calendar
 */
export class Calendar {
  /** Unique identifier for this calendar */
  id: string = '';
  
  /** Display name of this calendar */
  name: string = '';
  
  /** DOM element representation of this calendar */
  dom: CalendarDOM | null = null;
  
  /** Saved scroll position of this calendar in the list */
  scrollPosition: number = 0;

  /**
   * Create a new Calendar
   * @param element Optional DOM element to initialize from
   */
  constructor(element?: HTMLElement) {
    if (element) {
      this.setEl(element);
    }
  }
  /**
   * Set the DOM element for this calendar and extract its properties
   * @param el DOM element representing this calendar
   */
  setEl(el: HTMLElement): void {
    this.dom = new CalendarDOM(el, this);
    
    // Find the label element (div child) and checkbox based on original working implementation
    const labelEl = el.querySelector('div');
    const checkbox = el.querySelector('input[type="checkbox"]') as HTMLInputElement;
    
    if (labelEl && checkbox) {
      // Extract ID from base64 encoded data-id attribute on the label element (like original)
      const dataId = labelEl.getAttribute('data-id');
      if (dataId) {
        try {
          this.id = atob(dataId); // Base64 decode like the original
        } catch (error) {
          Logger.warn('Failed to decode data-id, using as-is:', dataId);
          this.id = dataId;
        }
      }
      
      // Extract name from checkbox aria-label (like original)
      this.name = checkbox.getAttribute('aria-label') || '';
      
      // If we still don't have an ID, fallback to other methods
      if (!this.id) {
        const fallbackId = checkbox.value || 
                          checkbox.getAttribute('data-cal-id') || 
                          checkbox.getAttribute('id');
        
        if (fallbackId) {
          this.id = fallbackId;
        } else {
          // As a last resort, generate an ID based on the name or position
          const idFromText = 
            this.name?.trim().toLowerCase().replace(/[^a-z0-9]/g, '_') || 
            `calendar_${Math.random().toString(36).substring(2, 10)}`;
          this.id = idFromText;
        }
      }
      
      // If we still don't have a name, fallback to other methods
      if (!this.name) {
        const nameSelectors = [
          'span', 
          'div[role="heading"]', 
          '[data-cal-name]',
          'label',
          '.cal-name',
          '[title]'
        ];
        
        for (const selector of nameSelectors) {
          const nameEl = el.querySelector(selector);
          if (nameEl && nameEl.textContent?.trim()) {
            this.name = nameEl.textContent.trim();
            break;
          }
        }
        
        // If still nothing found, try direct text content
        if (!this.name && el.textContent?.trim()) {
          const visibleText = Array.from(el.childNodes)
            .filter(node => node.nodeType === Node.TEXT_NODE || 
                          (node instanceof HTMLElement && getComputedStyle(node).display !== 'none'))
            .map(node => node.textContent?.trim())
            .filter(Boolean)
            .join(' ');
          
          if (visibleText) {
            this.name = visibleText;
          }
        }
        
        this.name = this.name || 'Unnamed Calendar';
      }
    } else {
      Logger.warn('Could not find expected DOM structure (div + input[type="checkbox"]) in calendar element:', el);
      
      // Fallback to the old complex extraction if the expected structure isn't found
      const checkbox = findCheckboxInCalendar(el);
      
      if (checkbox) {
        if (checkbox instanceof HTMLInputElement && checkbox.value) {
          this.id = checkbox.value;
        } else {
          const dataId = checkbox.getAttribute('data-cal-id') || 
                        checkbox.getAttribute('data-id') || 
                        checkbox.getAttribute('id');
          
          if (dataId) {
            this.id = dataId;
          } else {
            const idFromText = 
              el.textContent?.trim().toLowerCase().replace(/[^a-z0-9]/g, '_') || 
              `calendar_${Math.random().toString(36).substring(2, 10)}`;
            this.id = idFromText;
          }
        }
        
        this.name = checkbox.getAttribute('aria-label') || el.textContent?.trim() || 'Unnamed Calendar';
      } else {
        this.id = `calendar_${Math.random().toString(36).substring(2, 10)}`;
        this.name = el.textContent?.trim() || 'Unnamed Calendar';
      }
    }
    
    // Debug logging for incomplete information
    if (!this.id || !this.name) {
      Logger.warn('Calendar element with incomplete information:', {
        element: el,
        id: this.id,
        name: this.name
      });
    }
  }

  /**
   * Check if this calendar is attached to the DOM
   */
  get attached(): boolean {
    return this.dom !== null && this.dom.isAttached();
  }

  /**
   * Get the DOM element for this calendar
   * @returns DOM element or null if not attached
   */
  getEl(): HTMLElement | null {
    return this.dom?.el || null;
  }

  /**
   * Save the current scroll position of this calendar
   */
  async saveScrollPosition(): Promise<void> {
    if (this.dom) {
      this.scrollPosition = await this.dom.calculateScrollPosition();
    }
  }

  /**
   * Get the checkbox element for this calendar
   * @returns Checkbox element or null if not found
   */
  getCheckbox(): HTMLElement | null {
    if (!this.dom?.el) return null;
    return findCheckboxInCalendar(this.dom.el);
  }
  /**
   * Check if this calendar is enabled (checked)
   * @returns Whether calendar is checked
   */
  isChecked(): boolean {
    if (!this.dom?.el) return false;
    
    const checkbox = this.dom.el.querySelector('input[type="checkbox"]') as HTMLInputElement;
    if (!checkbox) return false;
    
    // Use the simple approach from the original working implementation
    return checkbox.checked;
  }
  /**
   * Toggle this calendar's checked state
   */
  toggle(): void {
    if (!this.dom?.el) return;
    
    // Find the label element (div child) - click this instead of the checkbox like the original
    const labelEl = this.dom.el.querySelector('div');
    if (!labelEl) {
      Logger.error('Could not find label element (div) to click for calendar', { name: this.name, id: this.id });
      return;
    }
    
    try {
      // Click the label element like the original implementation
      labelEl.click();
      
      Logger.debug('Toggled calendar by clicking label:', { 
        name: this.name, 
        id: this.id,
        isChecked: this.isChecked()
      });
    } catch (error) {
      Logger.error('Error toggling calendar by clicking label:', error);
    }
  }

  /**
   * Enable this calendar (check it)
   */  enable(): void {
    if (!this.isChecked() && this.dom?.el) {
      Logger.debug('Enabling calendar', { name: this.name, id: this.id });
      this.toggle();
    }
  }

  /**
   * Disable this calendar (uncheck it)
   */  disable(): void {
    if (this.isChecked() && this.dom?.el) {
      Logger.debug('Disabling calendar', { name: this.name, id: this.id });
      this.toggle();
    }
  }

  /**
   * Check if this calendar has valid data
   * @returns Whether calendar has valid ID and name
   */
  isValid(): boolean {
    return Boolean(this.id && this.name);
  }

  /**
   * Factory method to create a Calendar
   * @param args Constructor arguments
   * @returns New Calendar instance
   */
  static create(...args: any[]): Calendar {
    return new Calendar(...args);
  }
}
