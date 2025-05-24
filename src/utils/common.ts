/**
 * Common utility functions shared across the application
 */

/**
 * Debounces a function to limit how often it can be called
 * @param fn The function to debounce
 * @param ms Milliseconds to wait before executing
 * @returns Debounced function
 */
export const debounce = <T extends (...args: any[]) => any>(fn: T, ms = 300): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function(this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
};

/**
 * Throttles a function to execute at most once per specified time period
 * @param fn The function to throttle
 * @param ms Milliseconds to wait between executions
 * @returns Throttled function
 */
export const throttle = <T extends (...args: any[]) => any>(fn: T, ms = 300): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;

  return function(this: any, ...args: Parameters<T>) {
    const now = Date.now();
    lastArgs = args;
    
    if (now - lastCall >= ms) {
      // Enough time has passed since last execution, invoke immediately
      lastCall = now;
      fn.apply(this, args);
    } else if (!timeoutId) {
      // Schedule a delayed execution for the remainder of the throttle period
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        timeoutId = null;
        if (lastArgs) {
          fn.apply(this, lastArgs);
          lastArgs = null;
        }
      }, ms - (now - lastCall));
    }
  };
};

/**
 * Get element by selector with appropriate type casting
 * @param selector CSS selector
 * @returns HTMLElement or null if not found
 */
export const getElement = <T extends HTMLElement = HTMLElement>(selector: string): T | null => {
  return document.querySelector<T>(selector);
};

/**
 * Get elements by selector with appropriate type casting
 * @param selector CSS selector
 * @returns Array of HTMLElements
 */
export const getElements = <T extends HTMLElement = HTMLElement>(selector: string): T[] => {
  return Array.from(document.querySelectorAll<T>(selector));
};

/**
 * Safely tries multiple selectors until one returns an element
 * @param selectors Array of CSS selectors to try
 * @returns First matching element or null if none found
 */
export const trySelectors = <T extends HTMLElement = HTMLElement>(selectors: string[]): T | null => {
  for (const selector of selectors) {
    const element = getElement<T>(selector);
    if (element) return element;
  }
  return null;
};

/**
 * Safely tries multiple selectors until one returns elements
 * @param selectors Array of CSS selectors to try
 * @returns Array of elements from first successful selector, or empty array
 */
export const trySelectorArrays = <T extends HTMLElement = HTMLElement>(selectors: string[]): T[] => {
  for (const selector of selectors) {
    const elements = getElements<T>(selector);
    if (elements.length > 0) return elements;
  }
  return [];
};

/**
 * Create a typed logger with prefixes for better debugging
 * @param enabled Whether logging is enabled
 * @param prefix Prefix for log messages
 * @returns Logger object
 */
export const createLogger = (enabled = false, prefix = '') => {
  return {
    log: (...args: any[]) => {
      if (enabled) console.log(`[${prefix}]`, ...args);
    },
    warn: (...args: any[]) => {
      if (enabled) console.warn(`[${prefix}]`, ...args);
    },
    error: (...args: any[]) => {
      console.error(`[${prefix}]`, ...args);
    },
    enable: () => enabled = true,
    disable: () => enabled = false
  };
};
