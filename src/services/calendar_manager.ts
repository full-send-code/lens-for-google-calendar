// calendar_manager.ts
import { CalendarGroup } from "../types/CalendarGroup";
import { OperationStatus } from "../types/OperationStatus";

class Overlay {
  private element: HTMLElement | null = null;
  private options: {
    width: number;
    height: number;
    top: number;
    left: number;
    target: HTMLElement | null;
    scrollBarOffset: number;
  };
  private static instance: Overlay | null = null;

  // 8 pixels is the width of the scrollbar
  constructor(targetEl?: HTMLElement, opts: any = {}) {
    this.options = {
      width: opts.width || 0,
      height: opts.height || 0,
      top: opts.top || 0,
      left: opts.left || 0,
      target: targetEl || null,
      scrollBarOffset: 8
    };
  }
  show(): void {
    if (!this.element) {
      this.element = document.createElement('div');
      this.element.className = 'cs-overlay';
      document.body.appendChild(this.element);
    }

    if (!this.element) {
      console.error('Failed to create overlay element');
      return;
    }

    if (this.options.target) {
      const rect = this.options.target.getBoundingClientRect();
      this.element.style.width = `${rect.width - this.options.scrollBarOffset}px`;
      this.element.style.height = `${rect.height}px`;
      this.element.style.top = `${rect.top}px`;
      this.element.style.left = `${rect.left}px`;
    } else {
      this.element.style.width = `${this.options.width}px`;
      this.element.style.height = `${this.options.height}px`;
      this.element.style.top = `${this.options.top}px`;
      this.element.style.left = `${this.options.left}px`;
    }

    this.element.style.display = 'block';
  }

  hide(): void {
    if (this.element) {
      this.element.style.display = 'none';
    }
  }

  // instance factory
  static createInstance(opts = {}): Overlay {
    Overlay.instance = new Overlay(undefined, opts);
    return Overlay.instance;
  }

  static getInstance(): Overlay {
    if (!Overlay.instance) {
      Overlay.instance = new Overlay();
    }
    return Overlay.instance;
  }
}

class CalendarDOM {
  el: HTMLElement;
  calendar: Calendar;
  
  /* el: li_item */
  constructor(el: HTMLElement, calendar: Calendar) {
    this.el = el;
    this.calendar = calendar;
  }

  isAttached(): boolean {
    return document.body.contains(this.el);
  }

  getScrollContainer(): HTMLElement | null {
    return document.querySelector('div[role="list"]');
  }

  async calculateScrollPosition(): Promise<number> {
    const container = this.getScrollContainer();
    if (!container || !this.isAttached()) return 0;

    const rect = this.el.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    return rect.top - containerRect.top + container.scrollTop;
  }

  async scrollTo(): Promise<void> {
    const container = this.getScrollContainer();
    if (!container || !this.isAttached()) return;

    const position = await this.calculateScrollPosition();
    await scrollElementTo(container, position);
  }
}

class Calendar {
  id: string = '';
  name: string = '';
  dom: CalendarDOM | null = null;
  scrollPosition: number = 0;

  constructor(li_item?: HTMLElement) {
    if (li_item) {
      this.setEl(li_item);
    }
  }
  setEl(el: HTMLElement): void {
    this.dom = new CalendarDOM(el, this);
    
    // Look for input type checkbox with several possible selectors
    const checkbox = 
      el.querySelector('input[type="checkbox"]') || 
      el.querySelector('[role="checkbox"]') ||
      el.querySelector('[aria-checked]');
    
    if (checkbox) {
      // Try to get the value directly
      if (checkbox instanceof HTMLInputElement && checkbox.value) {
        this.id = checkbox.value;
      } 
      // If there's no direct value, try to use data attributes or generate an ID
      else {
        const dataId = checkbox.getAttribute('data-cal-id') || 
                      checkbox.getAttribute('data-id') || 
                      checkbox.getAttribute('id');
        
        if (dataId) {
          this.id = dataId;
        } else {
          // As a last resort, generate an ID based on the name or position
          const idFromText = 
            el.textContent?.trim().toLowerCase().replace(/[^a-z0-9]/g, '_') || 
            `calendar_${Math.random().toString(36).substring(2, 10)}`;
          this.id = idFromText;
        }
      }
    }
    
    // Get calendar name from various possible elements
    const nameSelectors = [
      'span', 
      'div[role="heading"]', 
      '[data-cal-name]',
      'label',
      '.cal-name',
      '[title]'
    ];
    
    let nameContent = '';
    for (const selector of nameSelectors) {
      const nameEl = el.querySelector(selector);
      if (nameEl && nameEl.textContent?.trim()) {
        nameContent = nameEl.textContent.trim();
        break;
      }
    }
    
    // If nothing found by selector, try direct text content
    if (!nameContent && el.textContent?.trim()) {
      // Remove any hidden or technical text
      const visibleText = Array.from(el.childNodes)
        .filter(node => node.nodeType === Node.TEXT_NODE || 
                      (node instanceof HTMLElement && getComputedStyle(node).display !== 'none'))
        .map(node => node.textContent?.trim())
        .filter(Boolean)
        .join(' ');
      
      if (visibleText) {
        nameContent = visibleText;
      }
    }
    
    this.name = nameContent || 'Unnamed Calendar';
    
    // Debug logging
    if (!this.id || !this.name) {
      console.log('Calendar element with incomplete information:', {
        element: el,
        id: this.id,
        name: this.name
      });
    }
  }

  // property used to identify this calendar entry in save lists and preset lists
  get attached(): boolean {
    return this.dom !== null && this.dom.isAttached();
  }

  getEl(): HTMLElement | null {
    return this.dom?.el || null;
  }

  async saveScrollPosition(): Promise<void> {
    if (this.dom) {
      this.scrollPosition = await this.dom.calculateScrollPosition();
    }
  }
  getCheckbox(): HTMLElement | null {
    if (!this.dom?.el) return null;
    
    // Try multiple selectors to find the checkbox
    const selectors = [
      'input[type="checkbox"]',
      '[role="checkbox"]',
      '[aria-checked]',
      '.calendar-checkbox',
      '.checkbox-container input'
    ];
    
    for (const selector of selectors) {
      const checkbox = this.dom.el.querySelector(selector);
      if (checkbox) {
        return checkbox as HTMLElement;
      }
    }
    
    // Log a warning if no checkbox is found
    console.warn('No checkbox found for calendar:', this.name, this.id);
    console.log('Calendar element:', this.dom.el);
    return null;
  }

  isChecked(): boolean {
    if (!this.dom?.el) return false;
    
    const checkbox = this.getCheckbox();
    if (!checkbox) return false;
    
    // Handle different types of checkboxes
    if (checkbox instanceof HTMLInputElement) {
      return checkbox.checked;
    } else if (checkbox.hasAttribute('aria-checked')) {
      return checkbox.getAttribute('aria-checked') === 'true';
    } else if (checkbox.hasAttribute('data-checked')) {
      return checkbox.getAttribute('data-checked') === 'true';
    } else {
      // Check for visual indicators as a fallback
      return checkbox.classList.contains('checked') || 
             checkbox.classList.contains('selected') ||
             checkbox.getAttribute('aria-selected') === 'true';
    }
  }

  /* NOTE: methods below assume that `this.dom.el` is a valid/existing DOM element */

  toggle(): void {
    if (!this.dom?.el) return;
    
    const checkbox = this.getCheckbox();
    if (!checkbox) {
      console.error('Could not find checkbox to toggle for calendar:', this.name, this.id);
      return;
    }
    
    try {
      // Try directly clicking the checkbox
      checkbox.click();
      
      // Log debug info
      console.log('Toggled calendar checkbox:', { 
        name: this.name, 
        id: this.id,
        isChecked: this.isChecked()
      });
    } catch (error) {
      console.error('Error toggling calendar checkbox:', error);
    }
  }

  enable(): void {
    if (!this.isChecked() && this.dom?.el) {
      console.log('Enabling calendar:', this.name, this.id);
      this.toggle();
    }
  }

  disable(): void {
    if (this.isChecked() && this.dom?.el) {
      console.log('Disabling calendar:', this.name, this.id);
      this.toggle();
    }
  }

  // helper so instances can be constructed
  static create(...args: any[]): Calendar {
    return new Calendar(...args);
  }
}

class CalendarList extends Array<Calendar> {
  constructor(...args: any[]) {
    super(...args);
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, CalendarList.prototype);
  }

  async initialize(): Promise<CalendarList> {
    return this;
  }

  push(...calendars: Calendar[]): number {
    return super.push(...calendars);
  }

  get(id: string): Calendar | undefined {
    return this.find(cal => cal.id === id);
  }
  refreshVisibleCalendarDOMs(...cals: Calendar[]): Calendar[] {
    const calendars = cals.length > 0 ? cals : this;
    
    // Get all visible calendar elements using multiple selector options
    const selectors = [
      "div[role='list'] li[role='listitem']",
      ".calendar-list li",
      "[data-is-list='true'] [role='listitem']",
      "aside li",
      "aside div[role='listitem']"
    ];
    
    let visibleCalendarElements: HTMLElement[] = [];
    
    // Try each selector until we find calendar elements
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        visibleCalendarElements = Array.from(elements) as HTMLElement[];
        break;
      }
    }
    
    if (visibleCalendarElements.length === 0) {
      console.warn('Could not find calendar elements using known selectors');
      return calendars;
    }
    
    console.log(`Found ${visibleCalendarElements.length} visible calendar elements`);
    
    // For each calendar that needs refreshing, try to find its matching DOM element
    for (const cal of calendars) {
      if (!cal.attached) {
        // First try to match by ID
        let foundMatch = false;
        
        for (const el of visibleCalendarElements) {
          // Try to find a checkbox or any element with a matching ID/value
          const checkbox = el.querySelector('input[type="checkbox"]') || 
                          el.querySelector('[role="checkbox"]') ||
                          el.querySelector('[aria-checked]');
          
          let matchesId = false;
          
          if (checkbox) {
            if (checkbox instanceof HTMLInputElement && checkbox.value === cal.id) {
              matchesId = true;
            } else {
              const dataId = checkbox.getAttribute('data-cal-id') || 
                            checkbox.getAttribute('data-id') || 
                            checkbox.getAttribute('id');
              if (dataId === cal.id) {
                matchesId = true;
              }
            }
          }
          
          // If not found by ID, try matching by name
          if (!matchesId) {
            const nameElements = el.querySelectorAll('span, div[role="heading"], label');
            for (const nameEl of Array.from(nameElements)) {
              if (nameEl.textContent?.trim() === cal.name) {
                matchesId = true;
                break;
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
          console.warn(`Could not find DOM element for calendar: ${cal.name} (${cal.id})`);
        }
      }
    }
    
    return calendars;
  }

  // helper methods

  enabled(): Calendar[] {
    return this.filter(cal => cal.isChecked());
  }

  disabled(): Calendar[] {
    return this.filter(cal => !cal.isChecked());
  }

  // other first class methods...

  async ensureValidDOM(calendar: Calendar, opts = { restoreScroll: true }): Promise<Calendar> {
    if (calendar.attached) return calendar;
    
    return this._ensureValidDOM(calendar, opts);
  }

  async _ensureValidDOM(calendar: Calendar, opts = { restoreScroll: true }): Promise<Calendar> {
    // Refresh all calendar DOMs
    this.refreshVisibleCalendarDOMs();
    
    if (!calendar.attached) {
      // Try to find the calendar by scanning through scroll
      const container = CalendarList.getScrollContainer();
      if (!container) return calendar;
      
      const overlay = Overlay.createInstance({ target: container });
      overlay.show();
      
      try {
        await scan(container, { scrollIncrement: 100 }, () => {
          this.refreshVisibleCalendarDOMs(calendar);
          return calendar.attached;
        });
      } finally {
        overlay.hide();
      }
    }
    
    // If still not attached, it's probably not visible
    if (!calendar.attached) {
      console.warn('Could not find calendar in visible list:', calendar.id, calendar.name);
    } else if (opts.restoreScroll && calendar.scrollPosition) {
      await calendar.dom?.scrollTo();
    }
    
    return calendar;
  }

  async toggleAll(cals: Calendar[], opts = { restoreScroll: true }): Promise<Calendar[]> {
    for (const cal of cals) {
      await this.toggleSingle(cal, opts);
    }
    return cals;
  }

  async toggleSingle(cal: Calendar, opts = { restoreScroll: true }): Promise<Calendar> {
    await this.ensureValidDOM(cal, opts);
    if (cal.attached) {
      cal.toggle();
    }
    return cal;
  }

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

  async toggle(filterFn?: (cal: Calendar) => boolean): Promise<Calendar[]> {
    const calendars = filterFn ? this.filter(filterFn) : this.slice();
    
    for (const cal of calendars) {
      await this.toggleSingle(cal);
    }
    
    return calendars;
  }

  async toggleById(calIds: string[], opts?: any): Promise<Calendar[]> {
    const calendars = this.filter(cal => calIds.includes(cal.id));
    return this.toggleAll(calendars, opts);
  }

  async discoverCalendarScrollPositions(): Promise<CalendarList> {
    await CalendarList.discoverCalendarScrollPositions(this);
    return this;
  }
  static getScrollContainer(): HTMLElement | null {
    // Try different selectors for the calendar list container
    const possibleContainers = [
      'div[role="list"]',
      '.cal-sidebar',
      '#calendars-list',
      '.calendar-list',
      '[data-is-list="true"]',
      'div[role="navigation"] div[role="list"]'
    ];
    
    for (const selector of possibleContainers) {
      const container = document.querySelector(selector);
      if (container) {
        return container as HTMLElement;
      }
    }
    
    // Fallback to any scrollable container in the side panel
    const sidePanelContainer = document.querySelector('aside');
    if (sidePanelContainer) {
      const scrollable = sidePanelContainer.querySelector('div[style*="overflow"]');
      if (scrollable) {
        return scrollable as HTMLElement;
      }
    }
    
    console.warn('Could not find calendar list container');
    return null;
  }

  static async discoverCalendarScrollPositions(calendars: Calendar[], opts = {}): Promise<Calendar[]> {
    // Save current scroll positions for all calendars
    for (const cal of calendars) {
      if (cal.attached) {
        await cal.saveScrollPosition();
      }
    }
    return calendars;
  }
  static async getInstance(): Promise<CalendarList> {
    console.log('Getting all calendar instances...');
    
    // Try different selector combinations for calendar items
    const selectors = [
      "div[role='list'] li[role='listitem']",
      ".calendar-list li",
      "[data-is-list='true'] [role='listitem']",
      "[data-is-list='true'] li",
      ".cal-sidebar li",
      "aside li:has(input[type='checkbox'])",
      "aside [role='listitem']"
    ];
    
    let visibleElements: HTMLElement[] = [];
    
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        visibleElements = Array.from(elements) as HTMLElement[];
        console.log(`Found ${visibleElements.length} calendar elements using selector: ${selector}`);
        break;
      }
    }
    
    if (visibleElements.length === 0) {
      console.warn('Could not find calendar elements with standard selectors, trying fallback...');
      // Fallback: look for checkbox elements directly
      const checkboxes = document.querySelectorAll('input[type="checkbox"], [role="checkbox"]');
      visibleElements = Array.from(checkboxes).map(checkbox => {
        // Find the closest container that might be a calendar item
        let element = checkbox.parentElement;
        while (element && 
              !element.matches('li') && 
              !element.matches('[role="listitem"]') &&
              element !== document.body) {
          element = element.parentElement;
        }
        return element;
      }).filter(Boolean) as HTMLElement[];
    }
    
    console.log(`Found ${visibleElements.length} calendar elements total`);
    
    const calendarList = new CalendarList();
    
    for (const el of visibleElements) {
      const cal = new Calendar(el);
      if (cal.id && cal.name) {
        calendarList.push(cal);
      } else {
        console.warn('Skipping calendar with missing ID or name:', cal);
      }
    }
    
    console.log(`Created ${calendarList.length} Calendar objects`);
    
    await calendarList.discoverCalendarScrollPositions();
    return calendarList;
  }
}

// CalendarManager object
interface CM {
  __exclude_re: RegExp;
  calendars: CalendarList | null;
  groups: CalendarGroup;
  onGroupsChange?: () => void;
  operationsStatus: OperationStatus;
  Calendar: typeof Calendar;
  CalendarDOM: typeof CalendarDOM;
  CalendarList: typeof CalendarList;
  Overlay: typeof Overlay;
  
  setGroups(newGroups: CalendarGroup): void;
  exportGroups(includeInternal?: boolean, groups?: CalendarGroup | null): CalendarGroup;
  _updated(): void;
  
  isCalendarDrawerShown(): boolean;
  setCalendarDrawerShown(visible?: boolean): Promise<boolean>;
  
  getVisibleCalendarsElements(): HTMLElement[];
  getVisibleCalendars(): Calendar[];
  
  getCalendarsForGroupFilter(groupName: string): (cal: Calendar) => boolean;
  getCalendarsNotInGroupFilter(groupName: string): (cal: Calendar) => boolean;
  
  enableGroup(groupName: string): Promise<Calendar[]>;
  disableNonGroup(groupName: string): Promise<Calendar[]>;
  disableGroup(groupName: string): Promise<Calendar[]>;
  deleteGroup(groupName: string): string[] | undefined;
  
  performOperation<T>(op: () => Promise<T>, name?: string): Promise<T>;
  
  showGroup(groupName: string): Promise<void>;
  enableCalendar(name: string): Promise<void>;
  toggleCalendar(name: string): Promise<void>;
  disableCalendar(name: string): Promise<void>;
  disableAll(): Promise<void>;
  saveCalendarSelections(groupName: string): Promise<void>;
  restoreCalendarSelections(): void;
}

const CalendarManager: CM = {
  __exclude_re: /^(saved_|__)/,
  calendars: null, // to be set after everything is defined

  groups: {},
  // used for loading groups from storage without changing the groups reference above
  setGroups: function(newGroups: CalendarGroup): void {
    // Skip update if no actual change
    if (JSON.stringify(CalendarManager.groups) === JSON.stringify(newGroups)) {
      console.log('Groups unchanged, skipping update');
      return;
    }
    
    CalendarManager.groups = newGroups;
    CalendarManager._updated();
  },

  // returns a copy of the groups object
  exportGroups: function(includeInternal = false, groups = null): CalendarGroup {
    const _groups = groups || JSON.parse(JSON.stringify(CalendarManager.groups));

    if (!includeInternal) {
      for (const key in _groups) {
        if (CalendarManager.__exclude_re.test(key)) {
          delete _groups[key];
        }
      }
    }

    return _groups;
  },  // set CM.onGroupsChange function to get updates
  _updated: function(): void {
    // Skip updates if no changes were made
    if (!CalendarManager.groups) return;
    
    // Limit logging to reduce noise
    const groupCount = Object.keys(CalendarManager.groups)
      .filter(key => !key.startsWith('__')).length;
    
    console.log('CalendarManager groups updated:', {
      groupCount,
      lastSaved: CalendarManager.groups.__last_saved || []
    });
    
    // Use a single update approach to prevent loops
    let handled = false;
    
    // First try using onGroupsChange callback if available
    if (typeof CalendarManager.onGroupsChange === 'function') {
      try {
        CalendarManager.onGroupsChange();
        handled = true;
      } catch (error) {
        console.error('Error in onGroupsChange handler:', error);
      }
    }
    
    // Only dispatch event if onGroupsChange wasn't available
    if (!handled) {
      try {
        const event = new CustomEvent('calendar-groups-changed', { 
          detail: { groups: CalendarManager.exportGroups() }
        });
        document.dispatchEvent(event);
      } catch (error) {
        console.error('Error dispatching calendar-groups-changed event:', error);
      }
    }
  },

  isCalendarDrawerShown(): boolean {
    const drawer = document.querySelector('.drawer');
    return drawer ? getComputedStyle(drawer).display !== 'none' : false;
  },

  // Ensure that the calendar drawer on the left is visible.  If it
  // is not visible, make it visible and return the original
  // visibility state so that it can get restored later (with
  // visible=false invocation).
  async setCalendarDrawerShown(visible = true): Promise<boolean> {
    const wasVisible = CalendarManager.isCalendarDrawerShown();
    
    if (visible && !wasVisible) {
      const button = document.querySelector('button[aria-label="Show side panel"]');
      if (button) {
        (button as HTMLElement).click();
        // Wait for the animation to complete
        await sleep(500);
      }
    } else if (!visible && wasVisible) {
      const button = document.querySelector('button[aria-label="Hide side panel"]');
      if (button) {
        (button as HTMLElement).click();
        // Wait for the animation to complete
        await sleep(500);
      }
    }
    
    return wasVisible;
  },
  getVisibleCalendarsElements: function(): HTMLElement[] {
    // Try different selector combinations for calendar items
    const selectors = [
      "div[role='list'] li[role='listitem']",
      ".calendar-list li",
      "[data-is-list='true'] [role='listitem']",
      "[data-is-list='true'] li",
      ".cal-sidebar li",
      "aside li:has(input[type='checkbox'])"
    ];
    
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        return Array.from(elements) as HTMLElement[];
      }
    }
    
    // Log a warning if none are found
    console.warn('Could not find calendar elements using known selectors');
    
    // Fallback: try to find checkbox elements that might be calendar items
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    if (checkboxes.length > 0) {
      return Array.from(checkboxes).map(checkbox => {
        let element = checkbox.parentElement;
        // Look up the tree for a list item or suitable container
        while (element && !element.matches('li') && !element.matches('[role="listitem"]')) {
          element = element.parentElement;
        }
        return element || checkbox.parentElement;
      }).filter(Boolean) as HTMLElement[];
    }
    
    console.error('Could not find any calendar elements');
    return [];
  },

  // gets all 'my' and 'other' visible calendars
  getVisibleCalendars: function(): Calendar[] {
    return CalendarManager.getVisibleCalendarsElements().map(Calendar.create);
  },

  getCalendarsForGroupFilter: function(groupName: string): (cal: Calendar) => boolean {
    const ids = CalendarManager.groups[groupName.toLowerCase()];
    if (!ids) {
      console.error('No calendar group found with name:', groupName);
      return () => false;
    }

    return (c) => ids.indexOf(c.id) >= 0 || ids.indexOf(c.name) >= 0;
  },

  getCalendarsNotInGroupFilter: function(groupName: string): (cal: Calendar) => boolean {
    const ids = CalendarManager.groups[groupName.toLowerCase()];
    if (!ids) {
      console.error('No calendar group found with name:', groupName);
      return () => false;
    }

    return (c) => ids.indexOf(c.id) < 0 && ids.indexOf(c.name) < 0;
  },

  enableGroup: async function(groupName: string): Promise<Calendar[]> {
    return CalendarManager.calendars!.enable(CalendarManager.getCalendarsForGroupFilter(groupName));
  },

  disableNonGroup: async function(groupName: string): Promise<Calendar[]> {
    return CalendarManager.calendars!.disable(CalendarManager.getCalendarsNotInGroupFilter(groupName));
  },

  disableGroup: async function(groupName: string): Promise<Calendar[]> {
    return CalendarManager.calendars!.disable(CalendarManager.getCalendarsForGroupFilter(groupName));
  },

  deleteGroup: function(groupName: string): string[] | undefined {
    const groups = CalendarManager.groups = CalendarManager.groups || {};
    groups.__last_saved = groups.__last_saved || [];

    console.log('deleting calendar group:', groupName, '=>', groups[groupName]);

    groups.__last_saved = groups.__last_saved.filter(name => name !== groupName);
    const deletedGroup = groups[groupName];
    delete groups[groupName];

    CalendarManager._updated();

    return deletedGroup;
  },

  operationsStatus: {
    current: [],
    state: {}
  },
  
  // Performs an operation, which is a set of activities that
  // require manipulating the UI.  Ensures that the the UI is in a
  // good state (all necessary items like the calendar drawer are
  // visible), and restores UI state after the operation if it
  // needed to change.
  //
  // The operation itself must be performed the 'op' callback, which
  // is an async function
  performOperation: async function<T>(op: () => Promise<T>, name?: string): Promise<T> {
    const status = CalendarManager.operationsStatus;
    const outer = () => status.current.length === 0;
    const outerOperation = outer();

    // pre steps...
    // console.log("OPERATION - PRE", name ? name : '', 'outer:', outerOperation)

    status.current.push(name || 'unnamed operation');

    if (outerOperation) {
      status.state.drawerShown = await CalendarManager.setCalendarDrawerShown(true);
    }

    try {
      return await op();
    } finally {
      status.current.pop();
      
      // post clean
      if (outerOperation) {
        // console.log("OPERATION - POST", name, "outer:", outerOperation)
        if (!status.state.drawerShown) {
          await CalendarManager.setCalendarDrawerShown(false);
        }
      }
    }
  },

  /** Top level operations (called form the UI) **/

  showGroup: async function(groupName: string): Promise<void> {
    await CalendarManager.performOperation(async () => {
      await CalendarManager.enableGroup(groupName);
      await CalendarManager.disableNonGroup(groupName);
    }, `showGroup: ${groupName}`);
  },

  enableCalendar: async function(name: string): Promise<void> {
    await CalendarManager.performOperation(async () => {
      await CalendarManager.calendars!.enable(c => c.name === name);
    }, `enableCalendar: ${name}`);
  },

  toggleCalendar: async function(name: string): Promise<void> {
    await CalendarManager.performOperation(async () => {
      await CalendarManager.calendars!.toggle(c => c.name === name);
    }, `toggleCalendar: ${name}`);
  },

  disableCalendar: async function(name: string): Promise<void> {
    await CalendarManager.performOperation(async () => {
      await CalendarManager.calendars!.disable(c => c.name === name);
    }, `disableCalendar: ${name}`);
  },

  disableAll: async function(): Promise<void> {
    await CalendarManager.performOperation(async () => {
      await CalendarManager.calendars!.disable();
    }, 'disableAll');
  },  saveCalendarSelections: async function(groupName: string): Promise<void> {
    await CalendarManager.performOperation(async () => {
      if (!groupName || typeof groupName !== 'string' || groupName.trim() === '') {
        console.error('Invalid group name provided for saving calendar selections');
        return;
      }
      
      // Normalize the group name to lowercase
      const normalizedGroupName = groupName.toLowerCase().trim();
      
      // Initialize the groups object if necessary
      const groups = CalendarManager.groups = CalendarManager.groups || {};
      groups.__last_saved = groups.__last_saved || [];
      
      // Ensure calendars are refreshed with current state
      if (CalendarManager.calendars) {
        CalendarManager.calendars.refreshVisibleCalendarDOMs();
      }
      
      // Get the calendars that are currently checked
      const checkedCalendars = CalendarManager.calendars!.filter(cal => cal.isChecked());
      
      // Extract IDs for the new group
      const newCalendarIds = checkedCalendars.map(cal => cal.id);
      
      // Check if the group already exists with the same content
      const existingIds = groups[normalizedGroupName];
      if (existingIds && JSON.stringify(existingIds.sort()) === JSON.stringify(newCalendarIds.sort())) {
        console.log(`Group "${normalizedGroupName}" already contains the same calendars, no update needed`);
        
        // Just update the last_saved list
        if (groups.__last_saved.indexOf(normalizedGroupName) !== 0) {
          // Move this group to the top of the last_saved list
          groups.__last_saved = groups.__last_saved.filter(name => name !== normalizedGroupName);
          groups.__last_saved.unshift(normalizedGroupName);
          CalendarManager._updated();
        }
        
        return;
      }
      
      // Update last_saved array
      groups.__last_saved = groups.__last_saved.filter(name => name !== normalizedGroupName);
      groups.__last_saved.unshift(normalizedGroupName);
      
      // Save calendar IDs of checked calendars
      groups[normalizedGroupName] = newCalendarIds;
      
      console.log('Saved calendar group:', normalizedGroupName, '=>', {
        ids: groups[normalizedGroupName],
        calendars: checkedCalendars.length
      });
      
      // Notify about the change
      CalendarManager._updated();
    }, `saveCalendarSelections: ${groupName}`);
  },

  restoreCalendarSelections: function(): void {
    const groups = CalendarManager.groups;
    if (!groups || !groups.__last_saved || !groups.__last_saved[0]) {
      console.warn('No saved calendar selections to restore');
      return;
    }
    
    const lastSavedGroup = groups.__last_saved[0];
    CalendarManager.showGroup(lastSavedGroup);
  },

  Calendar,
  CalendarDOM,
  CalendarList,
  Overlay
};

// Helper functions

async function scan(el: HTMLElement, opts: any, scrollIncrementedCb?: () => boolean): Promise<void> {
  let savedPosition = el.scrollTop;
  await scrollElementTo(el, 0);

  await scrollThroughElement(el, opts, scrollIncrementedCb);
  // console.log('done scanning')

  // if true, revert to original scroll position after the scan
  if (opts.restoreOriginalScroll) {
    await scrollElementTo(el, savedPosition);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function scrollElementTo(el: HTMLElement, scrollTop: number, opts: any = {}): Promise<void> {
  opts = Object.assign({ animate: true, animateDuration: 500 }, opts);

  return new Promise((resolve) => {
    if (!opts.animate) {
      el.scrollTop = scrollTop;
      resolve();
      return;
    }
    
    const startPosition = el.scrollTop;
    const distance = scrollTop - startPosition;
    const startTime = performance.now();
    
    function step(currentTime: number) {
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / opts.animateDuration, 1);
      
      el.scrollTop = startPosition + distance * progress;
      
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        resolve();
      }
    }
    
    requestAnimationFrame(step);
  });
}

async function scrollThroughElement(
  el: HTMLElement, 
  opts: any = {}, 
  scrollIncrementedCb?: () => boolean
): Promise<void> {
  opts = Object.assign({ scrollIncrement: 50 }, opts);

  cmDebug('scrollThroughIncrement', {
    scrollTop: el.scrollTop, 
    scrollHeight: el.scrollHeight, 
    clientHeight: el.clientHeight, 
    'scrollHeight-clientHeight': el.scrollHeight - el.clientHeight
  });

  const delta = 0.000002;
  const eq = (a: number, b: number) => Math.abs(a - b) < delta;

  let lastScrollTop = -1;

  // stop scrolling when a 'scrollTo' results in no changes to the scroll position
  while (!eq(lastScrollTop, el.scrollTop)) {
    cmDebug('scrollThroughIncrement', 'looping', {
      scrollTop: el.scrollTop, 
      scrollHeight: el.scrollHeight, 
      clientHeight: el.clientHeight, 
      'scrollHeight-clientHeight': el.scrollHeight - el.clientHeight
    });

    cmDebug('scrollThroughIncrement', 'scrolling to', el.scrollTop + opts.scrollIncrement);

    await scrollElementTo(el, el.scrollTop + opts.scrollIncrement, { animate: false });

    cmDebug('scrollThroughIncrement', 'should equal "scroll to" above:', el.scrollTop);

    lastScrollTop = el.scrollTop;

    if (typeof scrollIncrementedCb === 'function') {
      const shouldStop = scrollIncrementedCb();
      if (shouldStop) break;
    }

    cmDebug('scrollThroughIncrement', 'scrollTop after increment callback: ', el.scrollTop);
  }

  // do one last scan
  cmDebug('scrollThroughIncrement', 'doing last scan');
  if (typeof scrollIncrementedCb === 'function') {
    scrollIncrementedCb();
  }
}

let cmDebugEnabled = false;
function cmDebug(...args: any[]): void {
  if (args[0]) {
    const prefix = typeof args[0] === 'string' ? args.shift() : '';
    if (cmDebugEnabled) {
      console.log(`%c[DEBUG:${prefix}]`, 'color:#099', ...args);
    }
  }
}

// Initialize CalendarManager and expose it globally
let calendarManagerInitialized = false;

async function initializeCalendarManager() {
  if (calendarManagerInitialized) return;

  try {
    // Enable debug logging if needed
    // cmDebugEnabled = true;
    console.log('Initializing CalendarManager...');
    
    // Wait a bit to make sure the Google Calendar UI is fully loaded
    await sleep(500);
    
    // First ensure the calendar drawer is shown
    await CalendarManager.setCalendarDrawerShown(true);
    
    // Get all calendars
    const calendars = await CalendarList.getInstance();
    
    // Store calendars in CalendarManager
    CalendarManager.calendars = calendars;
    
    console.log(`Discovered ${calendars.length} calendars`);
    
    // Expose CalendarManager globally
    (window as any).CalendarManager = (window as any).CalendarManager || CalendarManager;
    
    // Re-enable debug logging via console if needed
    (window as any).enableCalendarDebug = () => {
      cmDebugEnabled = true;
      console.log('Calendar debug logging enabled');
    };
    
    calendarManagerInitialized = true;
    console.log('CalendarManager loaded successfully');
    
    // Notify any listeners that the manager is ready
    document.dispatchEvent(new CustomEvent('calendar-manager-ready'));
  } catch (error) {
    console.error('Failed to initialize CalendarManager:', error);
  }
}

// Run initialization
(async function() {
  // Initial attempt
  await initializeCalendarManager();
  
  // If initializing immediately after page load, Google Calendar might not be ready yet
  // Try again after a short delay if needed
  setTimeout(async () => {
    if (!calendarManagerInitialized || (CalendarManager.calendars && CalendarManager.calendars.length === 0)) {
      console.log('Attempting to re-initialize CalendarManager...');
      await initializeCalendarManager();
    }
  }, 1500);
})();

// Also export the initialization function for explicit initialization
export { initializeCalendarManager };
export default CalendarManager;
