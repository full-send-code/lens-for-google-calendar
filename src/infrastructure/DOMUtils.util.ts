/**
 * Native DOM Utilities
 * Replaces jQuery with modern native DOM APIs for better performance and smaller bundle size
 */

/**
 * Utility class for DOM operations using native browser APIs
 */
export class DOMUtils {
  /**
   * Query a single element by selector
   */
  static query<T extends Element = Element>(selector: string, parent: Document | Element = document): T | null {
    return (parent.querySelector(selector) as T) || null;
  }

  /**
   * Query multiple elements by selector
   */
  static queryAll<T extends Element = Element>(selector: string, parent: Document | Element = document): T[] {
    return Array.from(parent.querySelectorAll(selector) as NodeListOf<T>);
  }

  /**
   * Wait for an element to appear in the DOM
   */
  static waitForElement<T extends Element = Element>(
    selector: string, 
    options: {
      timeout?: number;
      parent?: Document | Element;
      checkInterval?: number;
    } = {}
  ): Promise<T> {
    const { timeout = 5000, parent = document, checkInterval = 100 } = options;

    return new Promise((resolve, reject) => {
      // Check if element already exists
      const existingElement = DOMUtils.query<T>(selector, parent);
      if (existingElement) {
        resolve(existingElement);
        return;
      }

      let attempts = 0;
      const maxAttempts = Math.floor(timeout / checkInterval);

      const interval = setInterval(() => {
        attempts++;
        const element = DOMUtils.query<T>(selector, parent);
        
        if (element) {
          clearInterval(interval);
          resolve(element);
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          reject(new Error(`Element ${selector} not found within ${timeout}ms`));
        }
      }, checkInterval);
    });
  }

  /**
   * Wait for an element to appear using MutationObserver (more efficient)
   */
  static waitForElementMutation<T extends Element = Element>(
    selector: string,
    options: {
      timeout?: number;
      parent?: Document | Element;
    } = {}
  ): Promise<T> {
    const { timeout = 5000, parent = document } = options;

    return new Promise((resolve, reject) => {
      // Check if element already exists
      const existingElement = DOMUtils.query<T>(selector, parent);
      if (existingElement) {
        resolve(existingElement);
        return;
      }

      let observer: MutationObserver | null = null;
      const timeoutId = setTimeout(() => {
        if (observer) {
          observer.disconnect();
        }
        reject(new Error(`Element ${selector} not found within ${timeout}ms`));
      }, timeout);

      observer = new MutationObserver(() => {
        const element = DOMUtils.query<T>(selector, parent);
        if (element) {
          clearTimeout(timeoutId);
          observer!.disconnect();
          resolve(element);
        }
      });

      observer.observe(parent as Node, {
        childList: true,
        subtree: true
      });
    });
  }

  /**
   * Check if element is visible in viewport
   */
  static isElementVisible(element: Element): boolean {
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const windowWidth = window.innerWidth || document.documentElement.clientWidth;

    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= windowHeight &&
      rect.right <= windowWidth
    );
  }

  /**
   * Scroll element into view if not visible
   */
  static scrollIntoViewIfNeeded(
    element: Element, 
    options: ScrollIntoViewOptions = { behavior: 'smooth', block: 'nearest' }
  ): void {
    if (!DOMUtils.isElementVisible(element)) {
      element.scrollIntoView(options);
    }
  }

  /**
   * Get element's computed style property
   */
  static getComputedStyle(element: Element, property: string): string {
    return window.getComputedStyle(element).getPropertyValue(property);
  }

  /**
   * Add event listener with automatic cleanup
   */
  static addEventListener<K extends keyof HTMLElementEventMap>(
    element: Element,
    type: K,
    listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): () => void {
    element.addEventListener(type, listener as EventListener, options);
    
    // Return cleanup function
    return () => {
      element.removeEventListener(type, listener as EventListener, options);
    };
  }

  /**
   * Create element with attributes and content
   */
  static createElement<K extends keyof HTMLElementTagNameMap>(
    tagName: K,
    options: {
      attributes?: Record<string, string>;
      className?: string;
      textContent?: string;
      innerHTML?: string;
      parent?: Element;
    } = {}
  ): HTMLElementTagNameMap[K] {
    const element = document.createElement(tagName);

    if (options.attributes) {
      Object.entries(options.attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
      });
    }

    if (options.className) {
      element.className = options.className;
    }

    if (options.textContent) {
      element.textContent = options.textContent;
    }

    if (options.innerHTML) {
      element.innerHTML = options.innerHTML;
    }

    if (options.parent) {
      options.parent.appendChild(element);
    }

    return element;
  }

  /**
   * Remove element from DOM
   */
  static removeElement(element: Element): void {
    if (element.parentNode) {
      element.parentNode.removeChild(element);
    }
  }

  /**
   * Toggle element class
   */
  static toggleClass(element: Element, className: string, force?: boolean): boolean {
    return element.classList.toggle(className, force);
  }

  /**
   * Get element's offset position relative to document
   */
  static getOffset(element: Element): { top: number; left: number } {
    const rect = element.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    return {
      top: rect.top + scrollTop,
      left: rect.left + scrollLeft
    };
  }

  /**
   * Trigger custom event on element
   */
  static triggerEvent(
    element: Element,
    eventType: string,
    detail?: any,
    options: EventInit = {}
  ): boolean {
    const event = new CustomEvent(eventType, {
      detail,
      bubbles: true,
      cancelable: true,
      ...options
    });

    return element.dispatchEvent(event);
  }

  /**
   * Find closest parent element matching selector
   */
  static closest<T extends Element = Element>(element: Element, selector: string): T | null {
    return (element.closest(selector) as T) || null;
  }

  /**
   * Get all parent elements up to document
   */
  static getParents(element: Element, selector?: string): Element[] {
    const parents: Element[] = [];
    let currentElement = element.parentElement;

    while (currentElement && currentElement !== document.documentElement) {
      if (!selector || currentElement.matches(selector)) {
        parents.push(currentElement);
      }
      currentElement = currentElement.parentElement;
    }

    return parents;
  }

  /**
   * Debounce function execution
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    return (...args: Parameters<T>) => {
      if (timeout) {
        clearTimeout(timeout);
      }
      
      timeout = setTimeout(() => {
        func.apply(null, args);
      }, wait);
    };
  }

  /**
   * Throttle function execution
   */
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle = false;

    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func.apply(null, args);
        inThrottle = true;
        setTimeout(() => {
          inThrottle = false;
        }, limit);
      }
    };
  }
}