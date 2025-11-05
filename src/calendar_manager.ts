import logger from './logger';

;(async function () {
  const $ = function (selector: string, startNode?: Document | Element): Element | null {
    return (startNode || document).querySelector(selector);
  };

  const $$ = function (selector: string, startNode?: Document | Element): NodeListOf<Element> {
    return (startNode || document).querySelectorAll(selector);
  };

  interface OverlayOptions {
    disabled?: boolean;
    widthAdjustment?: number;
  }

  interface OverlayCreateOptions {
    disabled?: boolean;
    el?: HTMLElement | null;
  }

  class Overlay {
    private targetEl: HTMLElement;
    private opts: Required<OverlayOptions>;
    private overlay: JQuery<HTMLElement> | null;
    private overlayElTemplate: JQuery<HTMLElement>;
    private showCount: number;
    private static __instance: Overlay;

    // 8 pixels is the width of the scrollbar
    constructor(targetEl: HTMLElement, opts: OverlayOptions = {}) {
      this.targetEl = targetEl;
      this.opts = Object.assign({ disabled: false, widthAdjustment: -8 }, opts);
      this.overlay = null;
      this.overlayElTemplate = jQuery("<div></div>");

      this.showCount = 0;
    }

    show(): JQuery<HTMLElement> | null {
      if (this.opts.disabled) {
        return this.overlay;
      }

      if (!this.overlay) {
        this.overlay = this.overlayElTemplate
          .width(jQuery(this.targetEl).width()! + this.opts.widthAdjustment)
          .height(jQuery(this.targetEl).height()!)
          .prependTo(this.targetEl)
          .addClass("cs-overlay")
          .css("z-index", 100);
      }

      this.overlay.show();
      this.showCount++;

      return this.overlay;
    }

    hide(): void {
      if (this.opts.disabled) {
        return;
      }

      this.showCount--;

      if (this.overlay && this.showCount <= 0) {
        this.overlay.hide();
        this.showCount = 0;
      }
    }

    // instance factory
    static createInstance(opts: OverlayCreateOptions = {}): Overlay {
      opts = Object.assign({ disabled: true, el: null }, opts);

      const overlay = new Overlay(opts.el || CalendarList.getScrollContainer(), {
        disabled: opts.disabled, // disable for now since we're doing animation
      });

      return overlay;
    }

    static getInstance(): Overlay {
      if (!Overlay.__instance) {
        Overlay.__instance = Overlay.createInstance({ disabled: true });
      }

      return Overlay.__instance;
    }
  }

  class CalendarDOM {
    el: Element;
    label_el: Element | null;
    checkbox_el: HTMLInputElement | null;
    calendar: Calendar;

    /* el: li_item */
    constructor(el: Element, calendar: Calendar) {
      this.el = el;
      // More specific selector - look for div with data-id attribute
      this.label_el = $("div[data-id]", el);
      // More specific selector - look for input with aria-label
      this.checkbox_el = $("input[type='checkbox'][aria-label]", el) as HTMLInputElement | null;

      this.calendar = calendar;
    }

    isAttached(): boolean {
      return document.body.contains(this.el);
    }

    getScrollContainer(): HTMLElement {
      return CalendarList.getScrollContainer();
    }

    async calculateScrollPosition(): Promise<number> {
      // ensure that the element is visible so we can reliably scroll
      // back to it
      // NOTE: once cal.el is offscreen, the scroll
      // container (using virtual scrolling), will destroy it so it
      // cannot be relied upon over time
      this.el.scrollIntoView({ behavior: "auto", block: "center" });

      // return the scroll position of the element
      return this.getScrollContainer().scrollTop;
    }

    async scrollTo(): Promise<void> {
      const scrollContainer = this.getScrollContainer();
      const scrollPosition = this.calendar.scrollPosition;

      logger.debug('jumping scroll position for', this.calendar.name, 'from', scrollContainer.scrollTop, 'to', scrollPosition)
      await scrollElementTo(scrollContainer, scrollPosition!);

      // give the virtual scroller some time to render
      await sleep(100);
    }
  }

  class Calendar {
    email!: string | null;
    name!: string | null;
    checked!: boolean;
    dom!: CalendarDOM;
    scrollPosition!: number | null;

    constructor(li_item: Element) {
      this.email = null;
      this.name = null;
      this.checked = false;
      this.dom = null as any; // Will be set immediately by setEl
      this.scrollPosition = null;

      this.setEl(li_item);
    }

    setEl(el: Element): void {
      this.dom = new CalendarDOM(el, this);

      Object.assign(this, {
        email: atob(this.dom.label_el!.attributes.getNamedItem("data-id")!.value),
        name: this.dom.checkbox_el!.attributes.getNamedItem("aria-label")!.value,
        checked: this.dom.checkbox_el!.checked,
      });
    }

    // property used to identify this calendar entry in save lists and preset lists
    get id(): string | null {
      return this.email;
    }

    get attached(): boolean {
      return this.dom.isAttached();
    }

    getEl(): Element {
      return this.dom.el;
    }

    async saveScrollPosition(): Promise<void> {
      this.scrollPosition = await this.dom.calculateScrollPosition();
      logger.debug('saved scroll position:', this.name, this.scrollPosition)
    }

    isChecked(): boolean {
      return this.checked;
    }

    /* NOTE: methods below assume that `this.dom.el` is a valid/existing DOM element */

    toggle(): boolean {
      (this.dom.label_el as HTMLElement).click();
      return this.isChecked();
    }

    enable(): boolean {
      const disabled = !this.isChecked();
      disabled && this.toggle();
      return disabled;
    }

    disable(): boolean {
      const enabled = this.isChecked();
      enabled && this.toggle();
      return enabled;
    }

    // helper so instances can be constructed
    static create(el: Element): Calendar {
      return new Calendar(el);
    }
  }

  interface CalendarMap {
    [key: string]: Calendar;
  }

  interface EnsureValidDOMOptions {
    restoreScroll?: boolean;
  }

  class CalendarList extends Array<Calendar> {
    byName: CalendarMap;
    byId: CalendarMap;
    initialized: boolean;
    private static __instance: CalendarList;

    constructor(...args: any[]) {
      super(...args);

      this.byName = {};
      this.byId = {};
      this.initialized = false;

      // it's not necessary to re-initialize a CalendarList that's a clone of another list (via map/filter)
      if (args.length === 1 && Number.isInteger(args[0])) {
        this.initialized = true;
      }
    }

    async initialize(): Promise<this> {
      if (!this.initialized) {
        await this.discoverCalendarScrollPositions();

        // add listener to re-sync dom when the user clicks on the calendar list manually
        CalendarList.getScrollContainer().addEventListener(
          "click",
          (event) => {
            if (event.isTrusted) {
              // timeout to give the original click event time to change state
              setTimeout(() => this.refreshVisibleCalendarDOMs(), 500);
            }
          },
          { passive: true }
        );

        // only set to intialized if the calendar drawer is shown
        // otherwise, we'll initialize the few calendar elements that
        // the DOM is present for, and won't reinitialize when the
        // full drawer is shown (for example after opening manually if
        // auto open fails)
        if (CM.isCalendarDrawerShown()) {
          this.initialized = true;
        }
      }

      return this;
    }

    push(...calendars: Calendar[]): number {
      for (const cal of calendars) {
        let existingCal = this.get(cal.id!);

        // only add elements we haven't seen already
        if (!existingCal) {
          super.push(cal);
          this.byName[cal.name!] = cal;
          this.byId[cal.id!] = cal;
          existingCal = cal;
        } else {
          // automatically update existing calendar with element from new one to
          // recalculate IF this element is not attached to the DOM tree already
          if (cal.dom.isAttached()) {
            existingCal.setEl(cal.getEl());
          }

          // TODO: it's hacky to try to keep maintaining state like that
          // a better solution is to keep state (scrollPosition) outside of the Calendar instances themselves
          // Rewrite CalendarList is just having id2calendar and id2scrollPosition maps
          if (cal.scrollPosition !== null) {
            existingCal.scrollPosition = cal.scrollPosition;
          }
        }
      }

      return this.length;
    }

    get(id: string): Calendar | undefined {
      return this.byId[id];
    }

    refreshVisibleCalendarDOMs(...cals: Calendar[]): CalendarList {
      let visible = CalendarManager.getVisibleCalendars();
      if (cals.length) {
        const idFilter = cals.map((c) => c.id);
        visible = visible.filter((c: Calendar) => idFilter.indexOf(c.id) >= 0) as any;
      }
      this.push(...visible); // will ensure that valid doms overwrite invalid doms
      return visible as any;
    }

    // a few helpers

    enabled(): CalendarList {
      return this.filter((c) => c.isChecked()) as CalendarList;
    }

    disabled(): CalendarList {
      return this.filter((c) => !c.isChecked()) as CalendarList;
    }

    // other first class methods...

    async ensureValidDOM(calendar: Calendar, opts: EnsureValidDOMOptions = { restoreScroll: true }): Promise<boolean> {
      // at this point we'll try to do some scrolling

      let scrollContainer: HTMLElement | undefined;
      let savedScrollPosition: number | undefined;
      if (opts.restoreScroll) {
        scrollContainer = CalendarList.getScrollContainer();
        savedScrollPosition = scrollContainer.scrollTop;
      }
      Overlay.getInstance().show();

      const result = await this._ensureValidDOM(calendar);

      if (opts.restoreScroll && scrollContainer && savedScrollPosition !== undefined) {
        // scroll back to where we came from
        await scrollElementTo(scrollContainer, savedScrollPosition);
      }
      Overlay.getInstance().hide();

      return result;
    }

    async _ensureValidDOM(calendar: Calendar, _opts: EnsureValidDOMOptions = { restoreScroll: true }): Promise<boolean> {
      // already have valid dom, do nothing
      if (calendar.dom.isAttached()) {
        return true;
      }

      // we might be scrolled to the element already, try to refresh
      this.refreshVisibleCalendarDOMs();
      if (calendar.dom.isAttached()) {
        return true;
      }

      // try scrolling to calendar, and refresh
      await calendar.dom.scrollTo();
      this.refreshVisibleCalendarDOMs();
      if (calendar.dom.isAttached()) {
        return true;
      }

      // our scroll position could be wrong, so rediscover all scroll positions,
      // rescroll, and refresh
      await this.discoverCalendarScrollPositions();
      await sleep(100);
      logger.debug('new cal scroll position:', calendar.scrollPosition)
      await calendar.dom.scrollTo();
      this.refreshVisibleCalendarDOMs();
      if (calendar.dom.isAttached()) {
        return true;
      }

      // if we get here, we can't find the calendar entry in the scroll list
      return false;
    }

    async toggleAll(cals: Calendar[], opts: EnsureValidDOMOptions = { restoreScroll: true }): Promise<{ [key: string]: boolean }> {
      await this.initialize();

      let scrollContainer: HTMLElement | undefined;
      let savedScrollPosition: number | undefined;
      if (opts.restoreScroll) {
        scrollContainer = CalendarList.getScrollContainer();
        savedScrollPosition = scrollContainer.scrollTop;
      }
      Overlay.getInstance().show();

      const results: { [key: string]: boolean } = {};

      for (const cal of cals) {
        const enabled = await this.toggleSingle(cal, { restoreScroll: false });
        results[cal.id!] = enabled!;
      }

      logger.debug('post-toggle states:', results)

      if (opts.restoreScroll && scrollContainer && savedScrollPosition !== undefined) {
        // scroll back to where we came from
        await scrollElementTo(scrollContainer, savedScrollPosition);
      }
      Overlay.getInstance().hide();

      return results;
    }

    async toggleSingle(cal: Calendar, opts: EnsureValidDOMOptions = { restoreScroll: true }): Promise<boolean | undefined> {
      await this.initialize();

      const valid = await this.ensureValidDOM(cal, opts);

      if (!valid) {
        logger.error("Could not find valid DOM node for calendar entry", cal.id, cal);
        return;
      }

      cal.toggle();

      await sleep(200); // wait for the checkbox to change state
      this.refreshVisibleCalendarDOMs(cal); // refresh internal checked state from the DOM

      return cal.isChecked();
    }

    async enable(filterFn: (cal: Calendar) => boolean): Promise<void> {
      if (typeof filterFn != "function") {
        throw new Error("filterFn must be a function");
      }

      await this.initialize();

      const cals = (this.filter(filterFn) as CalendarList).disabled();

      await this.toggleAll(cals);

      // check state of all calendars
      const failed = (this.filter(filterFn) as CalendarList).disabled();

      if (failed.length) {
        logger.error("failed to enable calendars:", failed);

        logger.info("retrying...");
        await this.enable(filterFn);
      }
    }

    async disable(filterFn: (cal: Calendar) => boolean): Promise<void> {
      if (typeof filterFn != "function") {
        throw new Error("filterFn must be a function");
      }

      await this.initialize();

      const cals = (this.filter(filterFn) as CalendarList).enabled();

      await this.toggleAll(cals);

      // check state of all calendars
      const failed = (this.filter(filterFn) as CalendarList).enabled();

      if (failed.length) {
        logger.error("failed to disable calendars:", failed);

        logger.info("retrying...");
        await this.disable(filterFn);
      }
    }

    async toggle(filterFn: (cal: Calendar) => boolean): Promise<void> {
      if (typeof filterFn != "function") {
        throw new Error("filterFn must be a function");
      }

      await this.initialize();

      const cals = this.filter(filterFn);

      await this.toggleAll(cals);
    }

    async toggleById(calIds: string | string[], opts?: EnsureValidDOMOptions): Promise<void> {
      if (!Array.isArray(calIds)) {
        calIds = [calIds];
      }

      const cals = this.filter((cal) => {
        // TODO: can be optimized by removing matched id from calIds
        return calIds.indexOf(cal.id!) >= 0;
      });

      await this.toggleAll(cals, opts);
    }

    async discoverCalendarScrollPositions(): Promise<CalendarList> {
      return await CalendarList.discoverCalendarScrollPositions(this);
    }

    static getScrollContainer(): HTMLElement {
      try {
        const element = $("div#drawerMiniMonthNavigator");
        if (!element || !element.parentElement) {
          throw new Error("Could not find calendar list scroll container via 'div#drawerMiniMonthNavigator'");
        }
        return element.parentElement as HTMLElement; // there's also a .parentNode
      } catch (e) {
        logger.error("Could not find calendar list scroll container via 'div#drawerMiniMonthNavigator'");
        throw e;
      }
    }

    static async discoverCalendarScrollPositions(
      calendars?: CalendarList,
      opts: { restoreOriginalScroll?: boolean; scrollIncrement?: number } = {}
    ): Promise<CalendarList> {
      opts = Object.assign({ restoreOriginalScroll: true, scrollIncrement: 50 }, opts);

      calendars = calendars || new CM.CalendarList();
      const scrollContainer = CalendarList.getScrollContainer();

      Overlay.getInstance().show();

      await scan(scrollContainer, opts, async function detect_calendars() {
        // wait for dom to render
        await sleep(100);

        const cals = CM.getVisibleCalendars();

        for (const cal of cals) {
          await cal.saveScrollPosition();
          calendars!.push(cal);
        }
      });

      Overlay.getInstance().hide();

      logger.debug('discovered calendars:', calendars.map(cal => cal.id))
      return calendars;
    }

    static async getInstance(): Promise<CalendarList> {
      if (!CalendarList.__instance) {
        CalendarList.__instance = new CalendarList();
      }

      return CalendarList.__instance;
    }
  }

  interface CalendarGroups {
    [groupName: string]: string[];
  }

  interface OperationStatus {
    current: string[];
    state: {
      drawerShown?: boolean;
    };
  }

  interface CalendarManagerType {
    __exclude_re: RegExp;
    calendars: CalendarList | null;
    groups: CalendarGroups;
    setGroups: (new_groups: CalendarGroups) => void;
    exportGroups: (include_internal?: boolean, groups?: CalendarGroups | null) => CalendarGroups;
    _updated: () => void;
    onGroupsChange?: (groups: CalendarGroups) => void;
    isCalendarDrawerShown: () => boolean;
    setCalendarDrawerShown: (visible?: boolean) => Promise<boolean>;
    getVisibleCalendarsElements: () => Element[];
    getVisibleCalendars: () => Calendar[];
    getCalendarsForGroupFilter: (group_name: string) => (c: Calendar) => boolean;
    getCalendarsNotInGroupFilter: (group_name: string) => (c: Calendar) => boolean;
    enableGroup: (group_name: string) => Promise<void>;
    disableNonGroup: (group_name: string) => Promise<void>;
    disableGroup: (group_name: string) => Promise<void>;
    deleteGroup: (group_name: string) => string[] | undefined;
    operationsStatus: OperationStatus;
    performOperation: (op: () => Promise<any>, name?: string) => Promise<any>;
    showGroup: (group_name: string) => Promise<void>;
    enableCalendar: (name: string) => Promise<void>;
    toggleCalendar: (name: string) => Promise<void>;
    disableCalendar: (name: string) => Promise<void>;
    disableAll: () => Promise<void>;
    saveCalendarSelections: (group_name?: string) => Promise<string[]>;
    restoreCalendarSelections: () => Promise<void>;
    Calendar: typeof Calendar;
    CalendarDOM: typeof CalendarDOM;
    CalendarList: typeof CalendarList;
    Overlay: typeof Overlay;
  }

  const CM: CalendarManagerType = {
    __exclude_re: /^(saved_|__)/,
    calendars: null, // to be set after everything is defined

    groups: {},

    // used for loading groups from storage without changing the groups reference above
    setGroups: function (new_groups: CalendarGroups) {
      CM.groups = new_groups;
      CM._updated();
    },

    // returns a copy of the groups object
    exportGroups: function (include_internal = false, groups: CalendarGroups | null = null): CalendarGroups {
      const _groups = groups || JSON.parse(JSON.stringify(CM.groups));

      if (!include_internal) {
        Object.keys(_groups)
          .filter((group_name) => group_name.match(CM.__exclude_re))
          .forEach((excluded_group_name) => {
            delete _groups[excluded_group_name];
          });
      }

      return _groups;
    },

    // set CM.onGroupsChange function to get updates
    _updated: function () {
      if (typeof CM.onGroupsChange === "function") {
        CM.onGroupsChange(CM.groups);
      }
    },

    isCalendarDrawerShown() {
      return CalendarList.getScrollContainer().offsetParent !== null;
    },

    // Ensure that the calendar drawer on the left is visible.  If it
    // is not visible, make it visible and return the original
    // visibility state so that it can get restored later (with
    // visible=false invocation).
    async setCalendarDrawerShown(visible = true): Promise<boolean> {
      const shown = CM.isCalendarDrawerShown;

      const drawerShown = shown();

      if (visible !== drawerShown) {
        logger.debug('toggling drawer')
        try {
          const element = $("#gb svg");
          if (element && element.parentElement) {
            (element.parentElement as HTMLElement).click();
          }
        } catch (e) {
          // CSS selector didn't find an element to click on, assume
          // that the HTML structure of the page changed significantly.
          // Bail from this function so that selection functionality
          // still works with the drawer opened manually.

          // TODO: fix scope for 'message' so we don't make
          // assumptions about it being a global function here
          (window as any).message(
            "Calendar Drawer opening failed, please open manually by clicking on the top left hamburger menu."
          );
          return visible;
        }

        // wait until the drawer gets to its expected state
        for (let i = 0; i < 100; i++) {
          await sleep(300);

          if (shown() === visible) {
            break;
          }
        }
      }

      return drawerShown;
    },

    getVisibleCalendarsElements: function (): Element[] {
      return Array.from($$("div[role='list'] li[role='listitem']"));
    },

    // gets all 'my' and 'other' visible alendars
    getVisibleCalendars: function (): Calendar[] {
      return CM.getVisibleCalendarsElements().map(Calendar.create);
    },

    getCalendarsForGroupFilter: function (group_name: string): (c: Calendar) => boolean {
      const ids = CM.groups[group_name.toLowerCase()];
      if (!ids) {
        logger.error("group not found:", group_name);
        return () => false;
      }

      return (c) => ids.indexOf(c.id!) >= 0 || ids.indexOf(c.name!) >= 0; // support both ids and names in saved groups
    },

    getCalendarsNotInGroupFilter: function (group_name: string): (c: Calendar) => boolean {
      const ids = CM.groups[group_name.toLowerCase()];
      if (!ids) {
        logger.error("group not found:", group_name);
        return () => false;
      }

      return (c) => ids.indexOf(c.id!) < 0 && ids.indexOf(c.name!) < 0; // support both ids and names in saved groups
    },

    enableGroup: async function (group_name: string): Promise<void> {
      return CM.calendars!.enable(CM.getCalendarsForGroupFilter(group_name));
    },

    disableNonGroup: async function (group_name: string): Promise<void> {
      return CM.calendars!.disable(CM.getCalendarsNotInGroupFilter(group_name));
    },

    disableGroup: async function (group_name: string): Promise<void> {
      return CM.calendars!.disable(CM.getCalendarsForGroupFilter(group_name));
    },

    deleteGroup: function (group_name: string): string[] | undefined {
      const groups = (CM.groups = CM.groups || {});
      groups.__last_saved = groups.__last_saved || [];

      logger.info("deleting calendar group:", group_name, "=>", groups[group_name]);

      groups.__last_saved = groups.__last_saved.filter((name) => name !== group_name);
      delete groups[group_name];

      CM._updated();

      return groups[group_name];
    },

    operationsStatus: {
      current: [],
      state: {},
    },
    // Performs an operation, which is a set of activities that
    // require manipulting the UI.  Ensures that the the UI is in a
    // good state (all necessary items like the calendar drawer are
    // visible), and restores UI state after the operation if it
    // needed to change.
    //
    // The operation itself must be performed the 'op' callback, which
    // is an aysnc function
    performOperation: async function (op: () => Promise<any>, name?: string): Promise<any> {
      const status = CM.operationsStatus;
      const outer = () => status.current.length === 0;
      const outerOperation = outer();

      // pre steps...
      status.current.push(name || "");

      if (outerOperation) {
        status.state.drawerShown = await CM.setCalendarDrawerShown(true);
      }

      try {
        return await op();
      } finally {
        // after steps...
        status.current.pop();

        const outerOperation = outer();

        if (outerOperation && !status.state.drawerShown) {
          await CM.setCalendarDrawerShown(status.state.drawerShown);
          // delete status.state.drawerShown
        }
      }
    },

    /** Top level operations (called form the UI) **/

    showGroup: async function (group_name: string): Promise<void> {
      CM.performOperation(async () => {
        await CM.enableGroup(group_name);
        await CM.disableNonGroup(group_name);
      }, "showGroup");
    },

    enableCalendar: async function (name: string): Promise<void> {
      CM.performOperation(async () => {
        // name is a regex string
        const re = RegExp(name, "i");
        await CM.calendars!.enable((c) => c.name!.match(re) !== null);
      }, "enableCalendar");
    },

    toggleCalendar: async function (name: string): Promise<void> {
      CM.performOperation(async () => {
        // name is a regex string
        const re = RegExp(name, "i");
        await CM.calendars!.toggle((c) => c.name!.match(re) !== null);
      }, "toggleCalendar");
    },

    disableCalendar: async function (name: string): Promise<void> {
      CM.performOperation(async () => {
        // name is a regex string
        const re = RegExp(name, "i");
        await CM.calendars!.disable((c) => c.name!.match(re) !== null);
      }, "disableCalendar");
    },

    disableAll: async function (): Promise<void> {
      CM.performOperation(async () => {
        await CM.disableCalendar(".");
      }, "disableAll");
    },

    saveCalendarSelections: async function (group_name?: string): Promise<string[]> {
      return CM.performOperation(async () => {
        await CM.calendars!.initialize();
        const active = CM.calendars!.enabled();

        group_name = (group_name || "saved_" + Date.now()).toLowerCase();
        const groups = (CM.groups = CM.groups || {});

        groups[group_name] = active.map((c) => c.id!);

        groups.__last_saved = groups.__last_saved || [];
        groups.__last_saved.push(group_name);

        logger.info("saved calendars:", group_name, "=>", groups[group_name]);
        CM._updated();
        return groups[group_name];
      }, "saveCalendarSelections");
    },

    restoreCalendarSelections: function (): Promise<void> {
      return CM.performOperation(async () => {
        if (!CM.groups.__last_saved) {
          logger.error("no saved groups");
          return;
        }

        const group_name = CM.groups.__last_saved.pop();

        if (group_name) {
          await CM.showGroup(group_name);
        } else {
          logger.error("nothing to restore");
        }
      }, "restoreCalendarSelections");
    },

    Calendar: Calendar,
    CalendarDOM: CalendarDOM,
    CalendarList: CalendarList,
    Overlay: Overlay,
  };

  (window as any).CalendarManager = (window as any).CalendarManager || CM;

  // Assign CalendarManager from window to make it available
  const CalendarManager = (window as any).CalendarManager;
  
  const calendars = await CalendarManager.CalendarList.getInstance();
  CalendarManager.calendars = calendars;

  logger.info("CalendarManager loaded");
})();

interface ScanOptions {
  restoreOriginalScroll?: boolean;
  scrollIncrement?: number;
}

async function scan(el: HTMLElement, opts: ScanOptions, scrollIncrementedCb: () => Promise<void>): Promise<void> {
  const savedPosition = el.scrollTop;
  await scrollElementTo(el, 0);

  await scrollThroughElement(el, opts, scrollIncrementedCb);

  // if true, revert to original scroll position after the scan
  if (opts.restoreOriginalScroll) {
    await scrollElementTo(el, savedPosition);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve, _reject) => {
    setTimeout(resolve, ms);
  });
}

interface ScrollElementToOptions {
  animate?: boolean;
  animateDuration?: number;
}

async function scrollElementTo(el: HTMLElement, scrollTop: number, opts: ScrollElementToOptions = {}): Promise<void> {
  opts = Object.assign({ animate: true, animateDuration: 500 }, opts);

  return new Promise((resolve, _reject) => {
    cm_debug("scrollIncrementTo", "scrolling to:", scrollTop);

    jQuery(el).animate(
      {
        scrollTop: scrollTop,
      },
      {
        duration: opts.animate ? opts.animateDuration : 0,
        complete: () => {
          resolve();
        },
      }
    );

    // non-animated version:
    /*
    if(el.scrollTop === scrollTop) return resolve()

    el.scrollTop = scrollTop
    el.addEventListener('scroll', function(){
      setTimeout(function() {
        resolve()
      }, 10)
    }, {once: true, passive: false})
    */
  });
}

async function scrollThroughElement(el: HTMLElement, opts: ScanOptions = {}, scrollIncrementedCb?: () => Promise<void>): Promise<void> {
  opts = Object.assign({ scrollIncrement: 50 }, opts);

  cm_debug("scrollThroughIncrement", {
    scrollTop: el.scrollTop,
    scrollHeight: el.scrollHeight,
    clientHeight: el.clientHeight,
    "scrollHeight-clientHeight": el.scrollHeight - el.clientHeight,
  });

  const delta = 0.000002; // pixels
  const eq = (a: number, b: number) => {
    return Math.abs(a - b) < delta;
  };

  let lastScrollTop = -1;

  // stop scrolling when a 'scrollTo' results in no changes to the scroll position
  while (!eq(lastScrollTop, el.scrollTop)) {
    cm_debug("scrollThroughIncrement", "looping", {
      scrollTop: el.scrollTop,
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
      "scrollHeight-clientHeight": el.scrollHeight - el.clientHeight,
    });

    cm_debug("scrollThroughIncrement", "scrolling to", el.scrollTop + opts.scrollIncrement!);

    await scrollElementTo(el, el.scrollTop + opts.scrollIncrement!, { animate: false });

    cm_debug("scrollThroughIncrement", 'should equal "scroll to" above:', el.scrollTop);

    lastScrollTop = el.scrollTop;

    if (typeof scrollIncrementedCb == "function") {
      // NOTE: this function can further scroll the element when
      // centering the calendar in the visible window
      await scrollIncrementedCb();
    }

    cm_debug("scrollThroughIncrement", "scrollTop after increment callback: ", el.scrollTop);
  }

  // do one last scan
  cm_debug("scrollThroughIncrement", "doing last scan");
  if (typeof scrollIncrementedCb == "function") {
    await scrollIncrementedCb();
  }
}

let cm_debug_enabled = false;
function cm_debug(...args: any[]): void {
  if (args[0]) {
    args[0] = `[${args[0]}]`;
  }
  if (cm_debug_enabled) {
    logger.debug(args.join(' '));
  }
}

// Extend window interface for CalendarManager
declare global {
  interface Window {
    CalendarManager: any;
  }
}

// Export CalendarManager for testing
const CalendarManager = (window as any).CalendarManager;
export { CalendarManager };
