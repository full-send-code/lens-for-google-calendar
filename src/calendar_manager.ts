// calendar_manager.ts
import { CalendarGroup, OperationStatus } from './types';

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
    // Look for input type checkbox
    const checkbox = el.querySelector('input[type="checkbox"]');
    if (checkbox) {
      this.id = (checkbox as HTMLInputElement).value;
    }
    
    // Get calendar name from the first span element
    const nameEl = el.querySelector('span');
    if (nameEl) {
      this.name = nameEl.textContent || '';
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

  isChecked(): boolean {
    if (!this.dom?.el) return false;
    
    const checkbox = this.dom.el.querySelector('input[type="checkbox"]');
    return checkbox ? (checkbox as HTMLInputElement).checked : false;
  }

  /* NOTE: methods below assume that `this.dom.el` is a valid/existing DOM element */

  toggle(): void {
    if (!this.dom?.el) return;
    
    const checkbox = this.dom.el.querySelector('input[type="checkbox"]');
    if (checkbox) {
      (checkbox as HTMLInputElement).click();
    }
  }

  enable(): void {
    if (!this.isChecked() && this.dom?.el) {
      this.toggle();
    }
  }

  disable(): void {
    if (this.isChecked() && this.dom?.el) {
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
    
    // Get all visible calendar elements
    const visibleCalendarElements = Array.from(
      document.querySelectorAll("div[role='list'] li[role='listitem']")
    ) as HTMLElement[];
    
    for (const cal of calendars) {
      if (!cal.attached) {
        // Find matching element by id
        for (const el of visibleCalendarElements) {
          const checkbox = el.querySelector('input[type="checkbox"]');
          if (checkbox && (checkbox as HTMLInputElement).value === cal.id) {
            cal.setEl(el);
            break;
          }
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
    return document.querySelector('div[role="list"]');
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
    // Create a calendar list from all visible calendar elements
    const visibleElements = Array.from(
      document.querySelectorAll("div[role='list'] li[role='listitem']")
    ) as HTMLElement[];
    
    const calendarList = new CalendarList();
    
    for (const el of visibleElements) {
      const cal = new Calendar(el);
      calendarList.push(cal);
    }
    
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
  },

  // set CM.onGroupsChange function to get updates
  _updated: function(): void {
    if (typeof CalendarManager.onGroupsChange === 'function') {
      CalendarManager.onGroupsChange();
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
    return Array.from(document.querySelectorAll('div[role="list"] li[role="listitem"]'));
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
  },

  saveCalendarSelections: async function(groupName: string): Promise<void> {
    await CalendarManager.performOperation(async () => {
      const groups = CalendarManager.groups = CalendarManager.groups || {};
      groups.__last_saved = groups.__last_saved || [];
      
      // track with most recently saved groups
      const idx = groups.__last_saved.indexOf(groupName);
      if (idx >= 0) {
        groups.__last_saved.splice(idx, 1);
      }
      groups.__last_saved.unshift(groupName);
      
      // Save calendar IDs of checked calendars
      groups[groupName.toLowerCase()] = CalendarManager.calendars!
        .filter(cal => cal.isChecked())
        .map(cal => cal.id);
      
      console.log('saved calendar group:', groupName, '=>', groups[groupName.toLowerCase()]);
      
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
(async function() {
  const calendars = await CalendarList.getInstance();
  CalendarManager.calendars = calendars;

  // Expose CalendarManager globally
  (window as any).CalendarManager = (window as any).CalendarManager || CalendarManager;

  console.log('CalendarManager loaded');
})();

export default CalendarManager;
