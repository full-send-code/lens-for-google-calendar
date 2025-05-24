/**
 * Calendar Manager - manages calendar operations and groups
 */
import { Calendar } from '../models/Calendar';
import { CalendarList } from '../models/CalendarList';
import { Overlay, createMutationObserver } from '../utils/domOperations';
import * as Logger from '../utils/logger';
import { 
  findHideSidePanelButton, 
  findShowSidePanelButton, 
  isCalendarDrawerShown,
  clearSelectorCache,
  findVisibleCalendarElements
} from '../utils/domSelectors';
import { CalendarGroup } from '../types/CalendarGroup';
import { OperationStatus } from '../types/OperationStatus';
import { sleep } from '../utils/domOperations';
import { throttle, debounce } from '../utils/common';

// Type definition for callbacks
type CalendarChangeCallback = () => void;

/**
 * Central manager for all calendar operations
 * Handles groups, visibility, and operations on calendars
 */
class CalendarManagerClass {
  /** Regular expression for internal group names to exclude from exports */
  private __exclude_re: RegExp = /^(saved_|__)/;
  
  /** List of all calendars */
  calendars: CalendarList | null = null;
  
  /** Calendar groups (presets) */
  groups: CalendarGroup = {};
  
  /** Callback when groups change */
  onGroupsChange?: CalendarChangeCallback;

  /** List of additional change listeners */
  private changeListeners: Set<CalendarChangeCallback> = new Set();
  
  /** Operation status tracking */
  operationsStatus: OperationStatus = {
    current: [],
    state: {}
  };
  
  /** DOM Mutation Observer cleanup function */
  private mutationObserverCleanup: (() => void) | null = null;
  
  /** References to Calendar-related classes */
  Calendar = Calendar;
  CalendarList = CalendarList;
  Overlay = Overlay;

  /** Memoized JSON representation of the groups for change detection */
  private groupsJSON: string = '{}';

  /**
   * Create a new CalendarManager instance
   */
  constructor() {
    // Setup debounced update method
    this._debouncedUpdate = debounce(() => {
      this._triggerChangeCallbacks();
    }, 50);
  }

  /**
   * Setup mutation observer to watch for calendar list changes
   */
  setupMutationObserver(): void {
    // Cleanup existing observer if any
    if (this.mutationObserverCleanup) {
      this.mutationObserverCleanup();
    }
    
    const targetNode = document.body;
    if (!targetNode) return;
    
    // Throttled handler for DOM changes
    const handleMutation = throttle(() => {
      Logger.debug('DOM mutation detected, refreshing calendars');
      this.refreshCalendars();
    }, 500);
    
    // Create and setup mutation observer
    this.mutationObserverCleanup = createMutationObserver(
      targetNode,
      handleMutation,
      { childList: true, subtree: true }
    );
    
    Logger.info('Calendar mutation observer set up');
  }
  
  /**
   * Add a listener for calendar/group changes
   * @param listener Function to call when changes occur
   * @returns Function to remove the listener
   */
  addChangeListener(listener: CalendarChangeCallback): () => void {
    this.changeListeners.add(listener);
    
    return () => {
      this.changeListeners.delete(listener);
    };
  }
    /**
   * Refresh the calendar list
   * Should be called when the DOM may have changed
   */
  refreshCalendars(): void {
    Logger.startPerformanceTracking('refreshCalendars');
    clearSelectorCache();
    
    const previousIds = this.calendars ? 
      new Set(this.calendars.map(cal => cal.id)) : 
      new Set<string>();
      
    // Initialize calendars list if needed
    if (!this.calendars) {
      this.calendars = new CalendarList();
      this.loadCalendarsFromDOM();
    } else {
      // Refresh existing calendars
      this.calendars.refreshVisibleCalendarDOMs();
      
      // Check if we need to scan for new calendars
      if (this.calendars.length === 0) {
        this.loadCalendarsFromDOM();
      }
    }
    
    // Compare calendar IDs to see if anything changed
    const currentIds = new Set(this.calendars.map(cal => cal.id));
    const hasChanges = currentIds.size !== previousIds.size || 
      Array.from(currentIds).some(id => !previousIds.has(id));
      
    if (hasChanges && this.calendars.length > 0) {
      Logger.info('Calendars changed:', {
        count: this.calendars.length,
        ids: Array.from(currentIds)
      });
      this._debouncedUpdate();
    }
    
    Logger.endPerformanceTracking('refreshCalendars');
  }
  
  /**
   * Load calendars from DOM elements
   */
  private loadCalendarsFromDOM(): void {
    const calendarElements = findVisibleCalendarElements();
    
    if (calendarElements.length === 0) {
      Logger.warn('No calendar elements found in DOM');
      return;
    }
    
    Logger.debug(`Found ${calendarElements.length} calendar elements`);
    
    // Clear existing calendars if any
    if (!this.calendars) {
      this.calendars = new CalendarList();
    }
    
    // Create calendar objects for each element
    for (const el of calendarElements) {
      const calendar = new Calendar(el);
      if (calendar.isValid()) {
        this.calendars.push(calendar);
      }
    }
  }

  // Debounced update method reference - defined in constructor
  private _debouncedUpdate: () => void;

  /**
   * Set calendar groups
   * @param newGroups Groups to set
   */
  setGroups(newGroups: CalendarGroup): void {
    const newGroupsJSON = JSON.stringify(newGroups);
    
    // Skip update if no actual change
    if (this.groupsJSON === newGroupsJSON) {
      Logger.debug('Groups unchanged, skipping update');
      return;
    }
    
    this.groups = newGroups;
    this.groupsJSON = newGroupsJSON;
    this._updated();
  }

  /**
   * Export calendar groups
   * @param includeInternal Whether to include internal groups
   * @param groups Optional groups to export from
   * @returns Exported groups
   */
  exportGroups(includeInternal = false, groups = null): CalendarGroup {
    const _groups = groups || JSON.parse(JSON.stringify(this.groups));

    if (!includeInternal) {
      for (const key in _groups) {
        if (this.__exclude_re.test(key)) {
          delete _groups[key];
        }
      }
    }

    return _groups;
  }
  
  /**
   * Notify that groups have been updated
   * Internal method used after groups change
   */
  private _updated(): void {
    // Skip updates if no changes were made
    if (!this.groups) return;
    
    // Limit logging to reduce noise
    const groupCount = Object.keys(this.groups)
      .filter(key => !key.startsWith('__')).length;
    
    Logger.info('Calendar groups updated:', {
      groupCount,
      lastSaved: this.groups.__last_saved || []
    });
    
    this._debouncedUpdate();
  }
  
  /**
   * Trigger all change callbacks
   */
  private _triggerChangeCallbacks(): void {
    // Use specific performance tracking labels
    Logger.startPerformanceTracking('calendarManager:triggerCallbacks');
    
    // First try using onGroupsChange callback if available
    if (typeof this.onGroupsChange === 'function') {
      try {
        this.onGroupsChange();
      } catch (error) {
        Logger.error('Error in onGroupsChange callback:', error);
      }
    }
    
    // Then notify all registered listeners
    this.changeListeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        Logger.error('Error in calendar change listener:', error);
      }
    });
    
    Logger.endPerformanceTracking('calendarManager:triggerCallbacks');
  }

  /**
   * Check if the calendar drawer is shown
   * @returns Whether drawer is visible
   */
  isCalendarDrawerShown(): boolean {
    return isCalendarDrawerShown();
  }

  /**
   * Set the calendar drawer visibility
   * @param visible Whether drawer should be visible
   * @returns Whether drawer was previously visible
   */
  async setCalendarDrawerShown(visible = true): Promise<boolean> {
    const wasVisible = this.isCalendarDrawerShown();
    
    if (visible && !wasVisible) {
      const button = findShowSidePanelButton();
      if (button) {
        button.click();
        // Wait for the animation to complete
        await sleep(500);
      }
    } else if (!visible && wasVisible) {
      const button = findHideSidePanelButton();
      if (button) {
        button.click();
        // Wait for the animation to complete
        await sleep(500);
      }
    }
    
    return wasVisible;
  }

  /**
   * Get visible calendar DOM elements
   * @returns Array of calendar DOM elements
   */
  getVisibleCalendarsElements(): HTMLElement[] {
    // This is now delegated to the domSelectors utility
    return CalendarList.getVisibleCalendarElements?.() || [];
  }

  /**
   * Get all visible calendars
   * @returns Array of Calendar objects
   */
  getVisibleCalendars(): Calendar[] {
    return this.getVisibleCalendarsElements().map(Calendar.create);
  }

  /**
   * Get a filter function for calendars in a group
   * @param groupName Group name
   * @returns Filter function
   */
  getCalendarsForGroupFilter(groupName: string): (cal: Calendar) => boolean {
    const ids = this.groups[groupName.toLowerCase()];
    if (!ids) {
      Logger.error('No calendar group found with name:', groupName);
      return () => false;
    }

    return (c) => ids.indexOf(c.id) >= 0 || ids.indexOf(c.name) >= 0;
  }

  /**
   * Get a filter function for calendars not in a group
   * @param groupName Group name
   * @returns Filter function
   */
  getCalendarsNotInGroupFilter(groupName: string): (cal: Calendar) => boolean {
    const ids = this.groups[groupName.toLowerCase()];
    if (!ids) {
      Logger.error('No calendar group found with name:', groupName);
      return () => false;
    }

    return (c) => ids.indexOf(c.id) < 0 && ids.indexOf(c.name) < 0;
  }

  /**
   * Enable all calendars in a group
   * @param groupName Group name
   * @returns Enabled calendars
   */
  async enableGroup(groupName: string): Promise<Calendar[]> {
    return this.calendars!.enable(this.getCalendarsForGroupFilter(groupName));
  }

  /**
   * Disable all calendars not in a group
   * @param groupName Group name
   * @returns Disabled calendars
   */
  async disableNonGroup(groupName: string): Promise<Calendar[]> {
    return this.calendars!.disable(this.getCalendarsNotInGroupFilter(groupName));
  }

  /**
   * Disable all calendars in a group
   * @param groupName Group name
   * @returns Disabled calendars
   */
  async disableGroup(groupName: string): Promise<Calendar[]> {
    return this.calendars!.disable(this.getCalendarsForGroupFilter(groupName));
  }

  /**
   * Delete a calendar group
   * @param groupName Group name
   * @returns Deleted group calendar IDs
   */
  deleteGroup(groupName: string): string[] | undefined {
    const groups = this.groups = this.groups || {};
    groups.__last_saved = groups.__last_saved || [];

    Logger.info('Deleting calendar group', { groupName, group: groups[groupName] });

    groups.__last_saved = groups.__last_saved.filter(name => name !== groupName);
    const deletedGroup = groups[groupName];
    delete groups[groupName];

    this._updated();

    return deletedGroup;
  }

  /**
   * Perform an operation that requires UI manipulation
   * @param op Operation function
   * @param name Operation name for logging
   * @returns Operation result
   */
  async performOperation<T>(op: () => Promise<T>, name?: string): Promise<T> {
    const status = this.operationsStatus;
    const outer = () => status.current.length === 0;
    const outerOperation = outer();

    status.current.push(name || 'unnamed operation');

    if (outerOperation) {
      status.state.drawerShown = await this.setCalendarDrawerShown(true);
    }

    try {
      return await op();
    } finally {
      status.current.pop();
      
      // Restore previous state
      if (outerOperation) {
        if (!status.state.drawerShown) {
          await this.setCalendarDrawerShown(false);
        }
      }
    }
  }

  /** 
   * Top level operations 
   */

  /**
   * Show a calendar group
   * @param groupName Group name
   */
  async showGroup(groupName: string): Promise<void> {
    await this.performOperation(async () => {
      await this.enableGroup(groupName);
      await this.disableNonGroup(groupName);
    }, `showGroup: ${groupName}`);
  }

  /**
   * Enable a calendar by name
   * @param name Calendar name
   */
  async enableCalendar(name: string): Promise<void> {
    await this.performOperation(async () => {
      await this.calendars!.enable(c => c.name === name);
    }, `enableCalendar: ${name}`);
  }

  /**
   * Toggle a calendar by name
   * @param name Calendar name
   */
  async toggleCalendar(name: string): Promise<void> {
    await this.performOperation(async () => {
      await this.calendars!.toggle(c => c.name === name);
    }, `toggleCalendar: ${name}`);
  }

  /**
   * Disable a calendar by name
   * @param name Calendar name
   */
  async disableCalendar(name: string): Promise<void> {
    await this.performOperation(async () => {
      await this.calendars!.disable(c => c.name === name);
    }, `disableCalendar: ${name}`);
  }

  /**
   * Disable all calendars
   */
  async disableAll(): Promise<void> {
    await this.performOperation(async () => {
      await this.calendars!.disable();
    }, 'disableAll');
  }
  
  /**
   * Save current calendar selections as a group
   * @param groupName Group name
   */
  async saveCalendarSelections(groupName: string): Promise<void> {
    await this.performOperation(async () => {
      if (!groupName || typeof groupName !== 'string' || groupName.trim() === '') {
        Logger.error('Invalid group name provided for saving calendar selections');
        return;
      }
      
      // Normalize the group name to lowercase
      const normalizedGroupName = groupName.toLowerCase().trim();
      
      // Initialize the groups object if necessary
      const groups = this.groups = this.groups || {};
      groups.__last_saved = groups.__last_saved || [];
      
      // Ensure calendars are refreshed with current state
      if (this.calendars) {
        this.calendars.refreshVisibleCalendarDOMs();
      }
      
      // Get the calendars that are currently checked
      const checkedCalendars = this.calendars!.filter(cal => cal.isChecked());
      
      // Extract IDs for the new group
      const newCalendarIds = checkedCalendars.map(cal => cal.id);
      
      // Check if the group already exists with the same content
      const existingIds = groups[normalizedGroupName];
      if (existingIds && JSON.stringify(existingIds.sort()) === JSON.stringify(newCalendarIds.sort())) {
        Logger.info(`Group "${normalizedGroupName}" already contains the same calendars, no update needed`);
        
        // Just update the last_saved list
        if (groups.__last_saved.indexOf(normalizedGroupName) !== 0) {
          // Move this group to the top of the last_saved list
          groups.__last_saved = groups.__last_saved.filter(name => name !== normalizedGroupName);
          groups.__last_saved.unshift(normalizedGroupName);
          this._updated();
        }
        
        return;
      }
      
      // Update last_saved array
      groups.__last_saved = groups.__last_saved.filter(name => name !== normalizedGroupName);
      groups.__last_saved.unshift(normalizedGroupName);
      
      // Save calendar IDs of checked calendars
      groups[normalizedGroupName] = newCalendarIds;
      
      Logger.info('Saved calendar group', {
        group: normalizedGroupName,
        ids: groups[normalizedGroupName],
        calendars: checkedCalendars.length
      });
      
      // Notify about the change
      this._updated();
    }, `saveCalendarSelections: ${groupName}`);
  }

  /**
   * Restore last saved calendar selections
   */
  restoreCalendarSelections(): void {
    const groups = this.groups;
    if (!groups || !groups.__last_saved || !groups.__last_saved[0]) {
      Logger.warn('No saved calendar selections to restore');
      return;
    }
    
    const lastSavedGroup = groups.__last_saved[0];
    this.showGroup(lastSavedGroup);
  }
}

// Create singleton instance
const CalendarManager = new CalendarManagerClass();

/**
 * Initialize the CalendarManager
 * Sets up calendars and exposes global interface
 */
let initialized = false;
export async function initializeCalendarManager(): Promise<void> {
  if (initialized) return;

  try {
    Logger.info('Initializing CalendarManager...');
    
    // Wait a bit to make sure the Google Calendar UI is fully loaded
    await sleep(300);
    
    // First ensure the calendar drawer is shown
    await CalendarManager.setCalendarDrawerShown(true);
    
    // Get all calendars
    const calendars = await CalendarList.getInstance();
    
    // Store calendars in CalendarManager
    CalendarManager.calendars = calendars;
    
    Logger.info(`Discovered ${calendars.length} calendars`);
    
    // Expose CalendarManager globally for debugging
    (window as any).CalendarManager = (window as any).CalendarManager || CalendarManager;
    
    // Enable debug logging via console if needed
    (window as any).enableCalendarDebug = () => {
      Logger.enableDebugMode();
      Logger.info('Calendar debug logging enabled');
    };
    
    initialized = true;
    Logger.info('CalendarManager loaded successfully');
    
    // Notify any listeners that the manager is ready
    document.dispatchEvent(new CustomEvent('calendar-manager-ready'));
  } catch (error) {
    Logger.error('Failed to initialize CalendarManager:', error);
  }
}

// Run initialization
(async function() {
  // Initial attempt
  await initializeCalendarManager();
  
  // If initializing immediately after page load, Google Calendar might not be ready yet
  // Try again after a short delay if needed
  setTimeout(async () => {
    if (!CalendarManager.calendars || CalendarManager.calendars.length === 0) {
      Logger.info('Attempting to re-initialize CalendarManager...');
      await initializeCalendarManager();
    }
  }, 1500);
})();

export default CalendarManager;
