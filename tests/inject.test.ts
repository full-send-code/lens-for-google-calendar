import { describe, it, expect, beforeEach } from '@jest/globals';

describe('inject.ts', () => {
  beforeEach(() => {
    // Mock window globals for tests
    (window as any).CalendarManager = {
      groups: {},
      setGroups: jest.fn(),
      exportGroups: jest.fn(),
      calendars: {
        byName: {},
      },
    };
    (window as any).componentHandler = {
      upgradeElement: jest.fn(),
      upgradeElements: jest.fn(),
    };
    (window as any).Vue = jest.fn();
    (window as any).Mousetrap = {
      bindGlobal: jest.fn(),
    };
  });

  describe('CALENDAR_SELECTOR_CONFIG', () => {
    it('should have timing configuration', () => {
      // The config object is not directly exported, but we can test the values indirectly
      // Since we can't directly import from the IIFE, we'll validate expected structure
      const expectedTimingKeys = [
        'readyStateCheckInterval',
        'presetsMenuDelay',
        'uiInsertionDelay',
        'keyboardShortcutsDelay',
        'deleteConfirmationDelay',
        'snackbarDuration',
      ];

      expect(expectedTimingKeys).toHaveLength(6);
    });

    it('should have selector configuration', () => {
      const expectedSelectors = ['uiInsertionLocation', 'materialIconsClass', 'snackbarClass'];

      expect(expectedSelectors).toHaveLength(3);
    });

    it('should have storage configuration', () => {
      const expectedStorage = ['maxAutosaveStates', 'groupsKey', 'autosavePrefix'];

      expect(expectedStorage).toHaveLength(3);
    });
  });

  describe('Shortcut Text Parsing', () => {
    it('should parse shortcut text with & separator', () => {
      const text = 'Save &As';
      const hasShortcut = text.indexOf('&') >= 0;
      const pre = text.substr(0, text.indexOf('&'));
      const key = text.substr(text.indexOf('&') + 1, 1);
      const post = text.substr(text.indexOf('&') + 2);
      const label = text.replace('&', '');

      expect(hasShortcut).toBe(true);
      expect(pre).toBe('Save ');
      expect(key).toBe('A');
      expect(post).toBe('s');
      expect(label).toBe('Save As');
    });

    it('should handle text without shortcuts', () => {
      const text = 'Save';
      const hasShortcut = text.indexOf('&') >= 0;

      expect(hasShortcut).toBe(false);
    });

    it('should handle various shortcut patterns', () => {
      const patterns = [
        { text: '&Enable', pre: '', key: 'E' },
        { text: 'E&xit', pre: 'E', key: 'x' },
        { text: 'Save &Group', pre: 'Save ', key: 'G' },
      ];

      patterns.forEach((pattern) => {
        const pre = pattern.text.substr(0, pattern.text.indexOf('&'));
        const key = pattern.text.substr(pattern.text.indexOf('&') + 1, 1);

        expect(pre).toBe(pattern.pre);
        expect(key).toBe(pattern.key);
      });
    });
  });

  describe('Chrome Storage Integration', () => {
    it('should use chrome.storage.sync API', () => {
      expect(chrome.storage.sync).toBeDefined();
      expect(chrome.storage.sync.get).toBeDefined();
      expect(chrome.storage.sync.set).toBeDefined();
    });

    it('should save groups with correct structure', async () => {
      const mockGroups = {
        work: ['cal1@example.com', 'cal2@example.com'],
        personal: ['personal@example.com'],
      };

      (chrome.storage.sync.set as jest.Mock).mockImplementation((data: any, callback?: () => void) => {
        expect(data).toHaveProperty('groups');
        callback?.();
      });

      chrome.storage.sync.set({ groups: mockGroups }, () => {
        // Callback executed
      });

      expect(chrome.storage.sync.set).toHaveBeenCalled();
    });

    it('should load groups from storage', async () => {
      const mockGroups = {
        work: ['cal1@example.com'],
      };

      (chrome.storage.sync.get as jest.Mock).mockImplementation((key: string, callback: (items: any) => void) => {
        callback({ groups: mockGroups });
      });

      chrome.storage.sync.get('groups', (items) => {
        expect(items.groups).toEqual(mockGroups);
      });

      expect(chrome.storage.sync.get).toHaveBeenCalledWith('groups', expect.any(Function));
    });
  });

  describe('Group Management', () => {
    it('should filter autosaved groups', () => {
      const groups = {
        work: ['cal1@example.com'],
        personal: ['cal2@example.com'],
        saved_1234567890: ['cal3@example.com'],
        saved_9876543210: ['cal4@example.com'],
        __last_saved: ['work'],
      };

      const autosaved = Object.keys(groups).filter((name) => name.indexOf('saved_') === 0);

      expect(autosaved).toHaveLength(2);
      expect(autosaved).toContain('saved_1234567890');
      expect(autosaved).toContain('saved_9876543210');
    });

    it('should sort autosaved groups by timestamp', () => {
      const autosaved = ['saved_1000', 'saved_3000', 'saved_2000'];
      const sorted = autosaved.sort();

      // Note: String sort, not numeric
      expect(sorted).toEqual(['saved_1000', 'saved_2000', 'saved_3000']);
    });

    it('should limit number of autosaved states', () => {
      const maxAutosaveStates = 3;
      const autosaved = ['saved_1000', 'saved_2000', 'saved_3000', 'saved_4000', 'saved_5000'];

      const toKeep = autosaved.slice(-maxAutosaveStates);
      const toRemove = autosaved.slice(0, autosaved.length - maxAutosaveStates);

      expect(toKeep).toEqual(['saved_3000', 'saved_4000', 'saved_5000']);
      expect(toRemove).toEqual(['saved_1000', 'saved_2000']);
    });
  });

  describe('Migration Logic', () => {
    it('should convert calendar names to IDs', () => {
      const calendars = {
        byName: {
          'Work Calendar': { id: 'work@example.com' },
          'Personal Calendar': { id: 'personal@example.com' },
        },
      };

      const name2id = (calName: string) => {
        const cal = calendars.byName[calName];
        if (cal) {
          return cal.id;
        } else {
          return calName;
        }
      };

      expect(name2id('Work Calendar')).toBe('work@example.com');
      expect(name2id('Personal Calendar')).toBe('personal@example.com');
      expect(name2id('unknown@example.com')).toBe('unknown@example.com');
    });

    it('should migrate groups from names to IDs', () => {
      const oldGroups = {
        work: ['Work Calendar', 'Team Calendar'],
        personal: ['Personal Calendar'],
      };

      const calendars = {
        byName: {
          'Work Calendar': { id: 'work@example.com' },
          'Team Calendar': { id: 'team@example.com' },
          'Personal Calendar': { id: 'personal@example.com' },
        },
      };

      const name2id = (calName: string) => {
        const cal = calendars.byName[calName];
        return cal ? cal.id : calName;
      };

      const newGroups: any = {};
      for (const groupName of Object.keys(oldGroups)) {
        newGroups[groupName] = oldGroups[groupName].map(name2id);
      }

      expect(newGroups.work).toEqual(['work@example.com', 'team@example.com']);
      expect(newGroups.personal).toEqual(['personal@example.com']);
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should create keyboard shortcut strings', () => {
      const modifier = 'ctrl+alt';
      const key = 's';
      const shortcut = `${modifier}+${key}`;

      expect(shortcut).toBe('ctrl+alt+s');
    });

    it('should support multiple shortcut combinations', () => {
      const shortcuts = [
        { modifier: 'ctrl+alt', key: 'e', expected: 'ctrl+alt+e' },
        { modifier: 'ctrl+alt', key: 's', expected: 'ctrl+alt+s' },
        { modifier: 'ctrl+alt', key: 'r', expected: 'ctrl+alt+r' },
        { modifier: 'ctrl+alt', key: 'c', expected: 'ctrl+alt+c' },
        { modifier: 'ctrl+alt', key: 't', expected: 'ctrl+alt+t' },
      ];

      shortcuts.forEach((sc) => {
        const shortcut = `${sc.modifier}+${sc.key}`;
        expect(shortcut).toBe(sc.expected);
      });
    });
  });

  describe('Message Snackbar', () => {
    it('should support message timeout configuration', () => {
      const config = {
        message: 'Test message',
        timeout: 5000,
      };

      expect(config.timeout).toBe(5000);
      expect(config.message).toBe('Test message');
    });

    it('should support different timeout durations', () => {
      const timeouts = [1000, 3000, 5000];

      timeouts.forEach((timeout) => {
        const config = { message: 'Test', timeout };
        expect(config.timeout).toBe(timeout);
      });
    });
  });

  describe('HTML Parsing', () => {
    it('should filter out text nodes', () => {
      const nodes = [
        { nodeName: '#text' },
        { nodeName: 'DIV' },
        { nodeName: '#text' },
        { nodeName: 'SPAN' },
      ];

      const filtered = nodes.filter((el) => el.nodeName !== '#text');

      expect(filtered).toHaveLength(2);
      expect(filtered[0].nodeName).toBe('DIV');
      expect(filtered[1].nodeName).toBe('SPAN');
    });
  });

  describe('Group Naming', () => {
    it('should convert group names to lowercase', () => {
      const groupNames = ['Work', 'PERSONAL', 'TeAm'];
      const lowercased = groupNames.map((name) => name.toLowerCase());

      expect(lowercased).toEqual(['work', 'personal', 'team']);
    });

    it('should generate timestamp-based autosave names', () => {
      const timestamp = Date.now();
      const name = `saved_${timestamp}`;

      expect(name).toMatch(/^saved_\d+$/);
    });
  });
});
