/**
 * DOM selector utilities for Google Calendar integration
 * Centralizes all DOM selection logic for better maintainability
 */
import * as Logger from './logger';
import { getCachedElement, clearElementCache } from './domOperations';

/**
 * Selectors for different parts of the Google Calendar UI
 */
export const SELECTORS = {
  CALENDAR: {
    LIST_CONTAINER: [
      'div[role="list"]',
      '.cal-sidebar',
      '#calendars-list',
      '.calendar-list',
      '[data-is-list="true"]',
      'div[role="navigation"] div[role="list"]'
    ],
    LIST_ITEMS: [
      "div[role='list'] li[role='listitem']",
      ".calendar-list li",
      "[data-is-list='true'] [role='listitem']",
      "[data-is-list='true'] li",
      ".cal-sidebar li",
      "aside li:has(input[type='checkbox'])",
      "aside [role='listitem']"
    ],
    CHECKBOX: [
      'input[type="checkbox"]',
      '[role="checkbox"]',
      '[aria-checked]',
      '.calendar-checkbox',
      '.checkbox-container input'
    ],
    NAME_ELEMENTS: [
      'span', 
      'div[role="heading"]', 
      '[data-cal-name]',
      'label',
      '.cal-name',
      '[title]'
    ],
    CALENDAR_CONTAINER: [
      '#calendar-container',
      '[role="main"]',
      '#maincell'
    ]
  },
  HEADER: {
    CONTAINER: [
      'header > div:nth-child(2) > div:nth-child(2) > div:nth-child(1)'
    ],
    SIDE_PANEL_BUTTONS: {
      SHOW: ['button[aria-label="Show side panel"]'],
      HIDE: ['button[aria-label="Hide side panel"]']
    }
  }
};

// Element cache for selectors already found to be working
const workingSelectors = new Map<string, string>();

/**
 * Find an element using multiple possible selectors with caching
 * @param selectors Array of CSS selectors to try
 * @param parent Optional parent element to search within
 * @param cacheKey Optional key for caching
 * @returns First matching element or null if none found
 */
export function findElement<T extends HTMLElement = HTMLElement>(
  selectors: string[], 
  parent: Element | Document = document,
  cacheKey?: string
): T | null {
  // Generate a cache key if not provided
  const key = cacheKey || `selector:${selectors.join('|')}`;
  
  // Check if we already have a working selector for this key
  const cachedSelector = workingSelectors.get(key);
  if (cachedSelector) {
    const element = parent === document 
      ? getCachedElement(cachedSelector) as T
      : parent.querySelector<T>(cachedSelector);
      
    if (element) return element;
    
    // If selector no longer works, remove it from cache
    workingSelectors.delete(key);
  }
  
  // Try each selector
  for (const selector of selectors) {
    const element = parent === document
      ? getCachedElement(selector) as T || document.querySelector<T>(selector)
      : parent.querySelector<T>(selector);
      
    if (element) {
      // Remember this working selector
      workingSelectors.set(key, selector);
      return element;
    }
  }
  
  return null;
}

/**
 * Find all elements matching one of the provided selectors
 * @param selectors Array of CSS selectors to try
 * @param parent Optional parent element to search within
 * @param cacheKey Optional key for caching
 * @returns Array of matching elements from first successful selector, or empty array
 */
export function findElements<T extends HTMLElement = HTMLElement>(
  selectors: string[], 
  parent: Element | Document = document,
  cacheKey?: string
): T[] {
  const key = cacheKey || `selector-all:${selectors.join('|')}`;
  const cachedSelector = workingSelectors.get(key);
  
  // Try cached selector first if available
  if (cachedSelector) {
    const elements = Array.from(parent.querySelectorAll<T>(cachedSelector));
    if (elements.length > 0) return elements;
    workingSelectors.delete(key);
  }
  
  // Try each selector
  for (const selector of selectors) {
    Logger.startPerformanceTracking(`findElements:${selector}`);
    const elements = Array.from(parent.querySelectorAll<T>(selector));
    Logger.endPerformanceTracking(`findElements:${selector}`, 50);
    
    if (elements.length > 0) {
      workingSelectors.set(key, selector);
      return elements;
    }
  }
  
  return [];
}

/**
 * Clear selector caches when the DOM structure may have changed
 */
export function clearSelectorCache(): void {
  workingSelectors.clear();
  clearElementCache();
}

/**
 * Find the calendar container element
 * @returns Calendar container or null if not found
 */
export function findCalendarContainer(): HTMLElement | null {
  return findElement(SELECTORS.CALENDAR.CALENDAR_CONTAINER);
}

/**
 * Find the header element where we'll insert our controls
 * @returns Header element or null if not found
 */
export function findHeaderElement(): HTMLElement | null {
  return findElement(SELECTORS.HEADER.CONTAINER);
}

/**
 * Find the calendar list container element
 * @returns Calendar list container or null if not found
 */
export function findCalendarListContainer(): HTMLElement | null {
  return findElement(SELECTORS.CALENDAR.LIST_CONTAINER);
}

/**
 * Find all visible calendar elements in the sidebar
 * @returns Array of calendar elements
 */
export function findVisibleCalendarElements(): HTMLElement[] {
  return findElements(SELECTORS.CALENDAR.LIST_ITEMS);
}

/**
 * Find a checkbox element within a calendar element
 * @param parent The calendar element to search within
 * @returns Checkbox element or null if not found
 */
export function findCheckboxInCalendar(parent: HTMLElement): HTMLElement | null {
  return findElement(SELECTORS.CALENDAR.CHECKBOX, parent);
}

/**
 * Check if the side panel containing calendars is visible
 * @returns True if visible, false otherwise
 */
export function isCalendarDrawerShown(): boolean {
  const drawer = document.querySelector('.drawer');
  return drawer ? getComputedStyle(drawer).display !== 'none' : false;
}

/**
 * Find the "Show side panel" button
 * @returns Button element or null if not found
 */
export function findShowSidePanelButton(): HTMLElement | null {
  return findElement(SELECTORS.HEADER.SIDE_PANEL_BUTTONS.SHOW);
}

/**
 * Find the "Hide side panel" button
 * @returns Button element or null if not found
 */
export function findHideSidePanelButton(): HTMLElement | null {
  return findElement(SELECTORS.HEADER.SIDE_PANEL_BUTTONS.HIDE);
}
