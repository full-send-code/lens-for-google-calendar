/**
 * Utilities for DOM scrolling and UI manipulation
 */
import * as Logger from './logger';
import { throttle } from './common';

// Cache for DOM elements to reduce repeated queries
const elementCache = new Map<string, HTMLElement>();

/**
 * Get a cached element or query and cache it
 * @param selector CSS selector for the element
 * @param context Optional context element to search within
 * @returns The found element or null
 */
export function getCachedElement(selector: string, context?: Element): HTMLElement | null {
  if (elementCache.has(selector)) {
    return elementCache.get(selector) || null;
  }
  
  const element = context 
    ? context.querySelector<HTMLElement>(selector) 
    : document.querySelector<HTMLElement>(selector);
    
  if (element) {
    elementCache.set(selector, element);
  }
  
  return element;
}

/**
 * Clear the element cache or a specific entry
 * @param selector Optional selector to clear only one cache entry
 */
export function clearElementCache(selector?: string): void {
  if (selector) {
    elementCache.delete(selector);
  } else {
    elementCache.clear();
  }
}

/**
 * Sleep for a specified number of milliseconds
 * @param ms Milliseconds to sleep
 * @returns Promise that resolves after the specified time
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Options for scrolling an element
 */
export interface ScrollOptions {
  animate?: boolean;
  animateDuration?: number;
}

/**
 * Scroll an element to a specific position with optimal animation
 * @param el Element to scroll
 * @param scrollTop Target scroll position
 * @param opts Scrolling options
 * @returns Promise that resolves when scrolling is complete
 */
export async function scrollElementTo(
  el: HTMLElement, 
  scrollTop: number, 
  opts: ScrollOptions = {}
): Promise<void> {
  const options = {
    animate: true,
    animateDuration: 300,
    ...opts
  };

  return new Promise((resolve) => {
    if (!options.animate) {
      el.scrollTop = scrollTop;
      resolve();
      return;
    }
    
    const startPosition = el.scrollTop;
    const distance = scrollTop - startPosition;
    const startTime = performance.now();
    
    // If distance is very small, don't animate
    if (Math.abs(distance) < 10) {
      el.scrollTop = scrollTop;
      resolve();
      return;
    }
    
    // Use cubic easing for smoother animation
    const easeInOutCubic = (t: number): number => 
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    
    function step(currentTime: number) {
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / options.animateDuration!, 1);
      
      el.scrollTop = startPosition + distance * easeInOutCubic(progress);
      
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        // Ensure we end exactly at the target position
        el.scrollTop = scrollTop;
        resolve();
      }
    }
    
    requestAnimationFrame(step);
  });
}

/**
 * Options for scanning through scrollable content
 */
export interface ScanOptions {
  scrollIncrement?: number;
  restoreOriginalScroll?: boolean;
}

/**
 * Scan through a scrollable element's contents, looking for something
 * @param el Element to scan
 * @param opts Scanning options
 * @param scrollIncrementedCb Callback after each increment, return true to stop scanning
 * @returns Promise that resolves when scanning is complete
 */
export async function scanElement(
  el: HTMLElement, 
  opts: ScanOptions = {}, 
  scrollIncrementedCb?: () => boolean
): Promise<void> {
  Logger.startPerformanceTracking('scanElement');
  const options = {
    scrollIncrement: 50,
    restoreOriginalScroll: false,
    ...opts
  };

  // Save original position
  const savedPosition = el.scrollTop;
  
  // Start from the top
  await scrollElementTo(el, 0, { animate: false });

  // Small value for floating point comparison
  const epsilon = 0.000002;
  const areEqual = (a: number, b: number) => Math.abs(a - b) < epsilon;

  let lastScrollTop = -1;

  // Continue scrolling until we've reached the bottom or callback returns true
  while (!areEqual(lastScrollTop, el.scrollTop)) {
    Logger.debug('scanning', {
      scrollTop: el.scrollTop, 
      scrollHeight: el.scrollHeight, 
      clientHeight: el.clientHeight,
      maxScroll: el.scrollHeight - el.clientHeight
    });

    await scrollElementTo(el, el.scrollTop + options.scrollIncrement, { animate: false });
    
    lastScrollTop = el.scrollTop;

    if (scrollIncrementedCb && scrollIncrementedCb()) {
      break; // Stop if callback returns true
    }
  }

  // One last check at the current position
  if (scrollIncrementedCb) {
    scrollIncrementedCb();
  }

  // Restore original position if requested
  if (options.restoreOriginalScroll) {
    await scrollElementTo(el, savedPosition);
  }
  
  Logger.endPerformanceTracking('scanElement');
}

/**
 * Class for creating an overlay on top of elements
 */
export class Overlay {
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

  /**
   * Create a new overlay
   * @param targetEl Target element to overlay
   * @param opts Overlay options
   */
  constructor(targetEl?: HTMLElement, opts: Partial<Overlay['options']> = {}) {
    this.options = {
      width: opts.width || 0,
      height: opts.height || 0,
      top: opts.top || 0,
      left: opts.left || 0,
      target: targetEl || null,
      scrollBarOffset: opts.scrollBarOffset || 8
    };
  }

  /**
   * Show the overlay
   */
  show(): void {
    if (!this.element) {
      this.element = document.createElement('div');
      this.element.className = 'cs-overlay';
      document.body.appendChild(this.element);
    }

    if (!this.element) {
      Logger.error('Failed to create overlay element');
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

  /**
   * Hide the overlay
   */
  hide(): void {
    if (this.element) {
      this.element.style.display = 'none';
    }
  }

  /**
   * Create or get the singleton instance
   * @param opts Overlay options
   * @returns Overlay instance
   */
  static createInstance(opts: Partial<Overlay['options']> = {}): Overlay {
    Overlay.instance = new Overlay(undefined, opts);
    return Overlay.instance;
  }

  /**
   * Get the singleton instance
   * @returns Overlay instance
   */
  static getInstance(): Overlay {
    if (!Overlay.instance) {
      Overlay.instance = new Overlay();
    }
    return Overlay.instance;
  }
}

/**
 * Creates an optimized scroll listener with throttling
 * @param element Element to attach scroll listener to
 * @param callback Function to call on scroll
 * @param ms Throttle delay in milliseconds
 * @returns Cleanup function to remove the listener
 */
export function createScrollListener(
  element: HTMLElement | Window,
  callback: (e: Event) => void,
  ms: number = 100
): () => void {
  const throttledCallback = throttle(callback, ms);
  
  element.addEventListener('scroll', throttledCallback, { passive: true });
  
  return () => {
    element.removeEventListener('scroll', throttledCallback);
  };
}

// Optimize mutation observer creation
const mutationObservers = new Set<MutationObserver>();

/**
 * Create a mutation observer with enhanced performance
 * @param target Element to observe
 * @param callback Callback function
 * @param options MutationObserver options
 * @returns Cleanup function
 */
export function createMutationObserver(
  target: Node,
  callback: MutationCallback,
  options: MutationObserverInit = { 
    childList: true, 
    subtree: true 
  }
): () => void {
  const observer = new MutationObserver(callback);
  observer.observe(target, options);
  mutationObservers.add(observer);
  
  return () => {
    observer.disconnect();
    mutationObservers.delete(observer);
  };
}

/**
 * Disconnect all mutation observers
 */
export function disconnectAllObservers(): void {
  mutationObservers.forEach(observer => observer.disconnect());
  mutationObservers.clear();
}
