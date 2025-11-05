import { DOMUtils } from './DOMUtils.util';

describe('DOMUtils', () => {
  beforeEach(() => {
    // Reset DOM before each test
    document.body.innerHTML = '';
  });

  describe('query', () => {
    it('should find element by selector', () => {
      const div = document.createElement('div');
      div.id = 'test';
      document.body.appendChild(div);

      const result = DOMUtils.query('#test');
      expect(result).toBe(div);
    });

    it('should return null if element not found', () => {
      const result = DOMUtils.query('#nonexistent');
      expect(result).toBeNull();
    });

    it('should search within parent element', () => {
      const parent = document.createElement('div');
      const child = document.createElement('span');
      child.className = 'child';
      parent.appendChild(child);
      document.body.appendChild(parent);

      const result = DOMUtils.query('.child', parent);
      expect(result).toBe(child);
    });

    it('should return typed element', () => {
      const input = document.createElement('input');
      input.type = 'text';
      document.body.appendChild(input);

      const result = DOMUtils.query<HTMLInputElement>('input');
      expect(result).toBe(input);
      expect(result?.type).toBe('text');
    });
  });

  describe('queryAll', () => {
    it('should find all matching elements', () => {
      const div1 = document.createElement('div');
      const div2 = document.createElement('div');
      div1.className = 'test';
      div2.className = 'test';
      document.body.appendChild(div1);
      document.body.appendChild(div2);

      const result = DOMUtils.queryAll('.test');
      expect(result).toHaveLength(2);
      expect(result).toContain(div1);
      expect(result).toContain(div2);
    });

    it('should return empty array if no elements found', () => {
      const result = DOMUtils.queryAll('.nonexistent');
      expect(result).toEqual([]);
    });

    it('should search within parent element', () => {
      const parent = document.createElement('div');
      const child1 = document.createElement('span');
      const child2 = document.createElement('span');
      child1.className = 'child';
      child2.className = 'child';
      parent.appendChild(child1);
      parent.appendChild(child2);
      document.body.appendChild(parent);

      const result = DOMUtils.queryAll('.child', parent);
      expect(result).toHaveLength(2);
    });
  });

  describe('waitForElement', () => {
    it('should resolve immediately if element exists', async () => {
      const div = document.createElement('div');
      div.id = 'existing';
      document.body.appendChild(div);

      const result = await DOMUtils.waitForElement('#existing');
      expect(result).toBe(div);
    });

    it('should wait for element to appear', async () => {
      const promise = DOMUtils.waitForElement('#delayed', { timeout: 1000, checkInterval: 50 });

      // Add element after a delay
      setTimeout(() => {
        const div = document.createElement('div');
        div.id = 'delayed';
        document.body.appendChild(div);
      }, 100);

      const result = await promise;
      expect(result.id).toBe('delayed');
    });

    it('should timeout if element never appears', async () => {
      await expect(
        DOMUtils.waitForElement('#never-appears', { timeout: 100, checkInterval: 50 })
      ).rejects.toThrow('Element #never-appears not found within 100ms');
    });

    it('should respect custom timeout', async () => {
      const start = Date.now();
      
      await expect(
        DOMUtils.waitForElement('#timeout-test', { timeout: 200, checkInterval: 50 })
      ).rejects.toThrow();

      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThan(190);
      expect(elapsed).toBeLessThan(300);
    });
  });

  describe('waitForElementMutation', () => {
    it('should resolve immediately if element exists', async () => {
      const div = document.createElement('div');
      div.id = 'existing-mutation';
      document.body.appendChild(div);

      const result = await DOMUtils.waitForElementMutation('#existing-mutation');
      expect(result).toBe(div);
    });

    it('should wait for element to appear using MutationObserver', async () => {
      const promise = DOMUtils.waitForElementMutation('#mutation-delayed', { timeout: 1000 });

      // Add element after a delay
      setTimeout(() => {
        const div = document.createElement('div');
        div.id = 'mutation-delayed';
        document.body.appendChild(div);
      }, 100);

      const result = await promise;
      expect(result.id).toBe('mutation-delayed');
    });

    it('should timeout if element never appears', async () => {
      await expect(
        DOMUtils.waitForElementMutation('#mutation-never', { timeout: 200 })
      ).rejects.toThrow('Element #mutation-never not found within 200ms');
    });
  });

  describe('isElementVisible', () => {
    it('should return true for visible element', () => {
      const div = document.createElement('div');
      div.style.width = '100px';
      div.style.height = '100px';
      div.style.position = 'absolute';
      div.style.top = '0px';
      div.style.left = '0px';
      document.body.appendChild(div);

      // Mock getBoundingClientRect
      const rect = { top: 0, left: 0, bottom: 100, right: 100 };
      jest.spyOn(div, 'getBoundingClientRect').mockReturnValue(rect as DOMRect);

      const result = DOMUtils.isElementVisible(div);
      expect(result).toBe(true);
    });

    it('should return false for element outside viewport', () => {
      const div = document.createElement('div');
      document.body.appendChild(div);

      // Mock getBoundingClientRect for element outside viewport
      const rect = { top: -100, left: -100, bottom: -50, right: -50 };
      jest.spyOn(div, 'getBoundingClientRect').mockReturnValue(rect as DOMRect);

      const result = DOMUtils.isElementVisible(div);
      expect(result).toBe(false);
    });
  });

  describe('scrollIntoViewIfNeeded', () => {
    it('should call scrollIntoView for invisible element', () => {
      const div = document.createElement('div');
      document.body.appendChild(div);

      // Mock scrollIntoView method
      div.scrollIntoView = jest.fn();

      // Mock as invisible
      jest.spyOn(DOMUtils, 'isElementVisible').mockReturnValue(false);

      DOMUtils.scrollIntoViewIfNeeded(div);
      expect(div.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'nearest' });
    });

    it('should not call scrollIntoView for visible element', () => {
      const div = document.createElement('div');
      document.body.appendChild(div);

      // Mock scrollIntoView method
      div.scrollIntoView = jest.fn();

      // Mock as visible
      jest.spyOn(DOMUtils, 'isElementVisible').mockReturnValue(true);

      DOMUtils.scrollIntoViewIfNeeded(div);
      expect(div.scrollIntoView).not.toHaveBeenCalled();
    });
  });

  describe('getComputedStyle', () => {
    it('should return computed style property', () => {
      const div = document.createElement('div');
      document.body.appendChild(div);

      // Mock getComputedStyle
      const mockStyle = { getPropertyValue: jest.fn().mockReturnValue('red') };
      jest.spyOn(window, 'getComputedStyle').mockReturnValue(mockStyle as any);

      const result = DOMUtils.getComputedStyle(div, 'color');
      expect(result).toBe('red');
      expect(mockStyle.getPropertyValue).toHaveBeenCalledWith('color');
    });
  });

  describe('addEventListener', () => {
    it('should add event listener and return cleanup function', () => {
      const div = document.createElement('div');
      const handler = jest.fn();

      const cleanup = DOMUtils.addEventListener(div, 'click', handler);

      // Trigger event
      div.click();
      expect(handler).toHaveBeenCalledTimes(1);

      // Cleanup
      cleanup();
      div.click();
      expect(handler).toHaveBeenCalledTimes(1); // Should not be called again
    });
  });

  describe('createElement', () => {
    it('should create element with basic options', () => {
      const div = DOMUtils.createElement('div', {
        className: 'test-class',
        textContent: 'Hello World'
      });

      expect(div.tagName).toBe('DIV');
      expect(div.className).toBe('test-class');
      expect(div.textContent).toBe('Hello World');
    });

    it('should create element with attributes', () => {
      const input = DOMUtils.createElement('input', {
        attributes: {
          type: 'text',
          placeholder: 'Enter text'
        }
      });

      expect(input.type).toBe('text');
      expect(input.placeholder).toBe('Enter text');
    });

    it('should create element with innerHTML', () => {
      const div = DOMUtils.createElement('div', {
        innerHTML: '<span>Test</span>'
      });

      expect(div.innerHTML).toBe('<span>Test</span>');
      expect(div.querySelector('span')).toBeTruthy();
    });

    it('should append to parent if provided', () => {
      const parent = document.createElement('div');
      const child = DOMUtils.createElement('span', {
        parent: parent
      });

      expect(parent.contains(child)).toBe(true);
    });
  });

  describe('removeElement', () => {
    it('should remove element from DOM', () => {
      const div = document.createElement('div');
      document.body.appendChild(div);

      expect(document.body.contains(div)).toBe(true);
      DOMUtils.removeElement(div);
      expect(document.body.contains(div)).toBe(false);
    });

    it('should handle element without parent', () => {
      const div = document.createElement('div');
      expect(() => DOMUtils.removeElement(div)).not.toThrow();
    });
  });

  describe('toggleClass', () => {
    it('should toggle class on element', () => {
      const div = document.createElement('div');
      
      const added = DOMUtils.toggleClass(div, 'test');
      expect(added).toBe(true);
      expect(div.classList.contains('test')).toBe(true);

      const removed = DOMUtils.toggleClass(div, 'test');
      expect(removed).toBe(false);
      expect(div.classList.contains('test')).toBe(false);
    });

    it('should force class state when specified', () => {
      const div = document.createElement('div');
      
      DOMUtils.toggleClass(div, 'test', true);
      expect(div.classList.contains('test')).toBe(true);

      DOMUtils.toggleClass(div, 'test', true);
      expect(div.classList.contains('test')).toBe(true);

      DOMUtils.toggleClass(div, 'test', false);
      expect(div.classList.contains('test')).toBe(false);
    });
  });

  describe('getOffset', () => {
    it('should return element offset position', () => {
      const div = document.createElement('div');
      document.body.appendChild(div);

      // Mock getBoundingClientRect and scroll position
      jest.spyOn(div, 'getBoundingClientRect').mockReturnValue({
        top: 100,
        left: 50
      } as DOMRect);

      Object.defineProperty(window, 'pageYOffset', { value: 200, writable: true });
      Object.defineProperty(window, 'pageXOffset', { value: 30, writable: true });

      const offset = DOMUtils.getOffset(div);
      expect(offset).toEqual({ top: 300, left: 80 });
    });
  });

  describe('triggerEvent', () => {
    it('should trigger custom event on element', () => {
      const div = document.createElement('div');
      const handler = jest.fn();
      div.addEventListener('custom', handler);

      const result = DOMUtils.triggerEvent(div, 'custom', { data: 'test' });
      
      expect(result).toBe(true);
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0][0].detail).toEqual({ data: 'test' });
    });

    it('should handle cancelled events', () => {
      const div = document.createElement('div');
      div.addEventListener('custom', (e) => e.preventDefault());

      const result = DOMUtils.triggerEvent(div, 'custom');
      expect(result).toBe(false);
    });
  });

  describe('closest', () => {
    it('should find closest parent matching selector', () => {
      const parent = document.createElement('div');
      parent.className = 'parent';
      const child = document.createElement('span');
      parent.appendChild(child);
      document.body.appendChild(parent);

      const result = DOMUtils.closest(child, '.parent');
      expect(result).toBe(parent);
    });

    it('should return null if no match found', () => {
      const div = document.createElement('div');
      document.body.appendChild(div);

      const result = DOMUtils.closest(div, '.nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('getParents', () => {
    it('should return all parent elements', () => {
      const grandparent = document.createElement('div');
      const parent = document.createElement('div');
      const child = document.createElement('span');
      
      grandparent.appendChild(parent);
      parent.appendChild(child);
      document.body.appendChild(grandparent);

      const parents = DOMUtils.getParents(child);
      expect(parents).toContain(parent);
      expect(parents).toContain(grandparent);
      expect(parents).toContain(document.body);
    });

    it('should filter parents by selector', () => {
      const grandparent = document.createElement('div');
      grandparent.className = 'container';
      const parent = document.createElement('div');
      const child = document.createElement('span');
      
      grandparent.appendChild(parent);
      parent.appendChild(child);
      document.body.appendChild(grandparent);

      const parents = DOMUtils.getParents(child, '.container');
      expect(parents).toHaveLength(1);
      expect(parents[0]).toBe(grandparent);
    });
  });

  describe('debounce', () => {
    it('should debounce function calls', (done) => {
      const fn = jest.fn();
      const debounced = DOMUtils.debounce(fn, 100);

      debounced();
      debounced();
      debounced();

      // Should not be called immediately
      expect(fn).not.toHaveBeenCalled();

      setTimeout(() => {
        expect(fn).toHaveBeenCalledTimes(1);
        done();
      }, 150);
    });

    it('should reset debounce timer on new calls', (done) => {
      const fn = jest.fn();
      const debounced = DOMUtils.debounce(fn, 100);

      debounced();
      
      setTimeout(() => {
        debounced(); // Reset timer
      }, 50);

      setTimeout(() => {
        expect(fn).not.toHaveBeenCalled();
      }, 120);

      setTimeout(() => {
        expect(fn).toHaveBeenCalledTimes(1);
        done();
      }, 180);
    });
  });

  describe('throttle', () => {
    it('should throttle function calls', (done) => {
      const fn = jest.fn();
      const throttled = DOMUtils.throttle(fn, 100);

      throttled();
      throttled();
      throttled();

      // Should be called immediately once
      expect(fn).toHaveBeenCalledTimes(1);

      setTimeout(() => {
        throttled();
        expect(fn).toHaveBeenCalledTimes(2);
        done();
      }, 150);
    });

    it('should ignore calls during throttle period', () => {
      const fn = jest.fn();
      const throttled = DOMUtils.throttle(fn, 100);

      throttled();
      throttled();
      throttled();

      expect(fn).toHaveBeenCalledTimes(1);
    });
  });
});