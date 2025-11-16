import { ChromeStorageRepository } from './ChromeStorageRepository.repository';
import { CalendarPreset } from '../core';

// Mock Chrome APIs
const mockChrome = {
  storage: {
    sync: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      getBytesInUse: jest.fn(),
      QUOTA_BYTES: 102400 // 100KB
    },
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      getBytesInUse: jest.fn(),
      QUOTA_BYTES: 5242880 // 5MB
    }
  },
  runtime: {
    lastError: undefined as { message: string } | undefined
  }
};

// Mock global chrome object
Object.defineProperty(global, 'chrome', {
  value: mockChrome,
  writable: true
});

describe('ChromeStorageRepository', () => {
  let repository: ChromeStorageRepository;
  
  beforeEach(() => {
    repository = new ChromeStorageRepository();
    jest.clearAllMocks();
    mockChrome.runtime.lastError = undefined;
  });

  describe('savePreset', () => {
    it('should save preset to Chrome storage', async () => {
      const preset = new CalendarPreset('work', ['work@example.com']);

      mockChrome.storage.sync.getBytesInUse.mockImplementation((keys, callback) => {
        callback(1000);
      });

      mockChrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback({}); // Preset doesn't exist yet
      });

      mockChrome.storage.sync.set.mockImplementation((data, callback) => {
        callback();
      });

      await repository.savePreset(preset);

      expect(mockChrome.storage.sync.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'lens_preset_work': expect.objectContaining({
            name: 'work',
            calendarEmails: ['work@example.com']
          })
        }),
        expect.any(Function)
      );
    });

    it('should handle Chrome storage errors', async () => {
      const preset = new CalendarPreset('test', ['test@example.com']);

      mockChrome.storage.sync.getBytesInUse.mockImplementation((keys, callback) => {
        callback(1000);
      });

      mockChrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback({});
      });

      mockChrome.storage.sync.set.mockImplementation((data, callback) => {
        mockChrome.runtime.lastError = { message: 'Storage quota exceeded' };
        callback();
      });

      await expect(repository.savePreset(preset)).rejects.toThrow("Failed to save preset 'test'");
    });
  });

  describe('loadPreset', () => {
    it('should load preset from Chrome storage', async () => {
      const presetData = {
        name: 'work',
        calendarEmails: ['work@example.com'],
        createdAt: new Date().toISOString(),
        lastUsedAt: null
      };

      mockChrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback({ 'lens_preset_work': presetData });
      });

      const preset = await repository.loadPreset('work');
      
      expect(preset).toBeInstanceOf(CalendarPreset);
      expect(preset?.name).toBe('work');
      expect(preset?.calendarEmails).toEqual(['work@example.com']);
    });

    it('should return undefined if preset not found', async () => {
      mockChrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback({});
      });

      const preset = await repository.loadPreset('nonexistent');
      expect(preset).toBeUndefined();
    });

    it('should handle Chrome storage errors', async () => {
      mockChrome.storage.sync.get.mockImplementation((keys, callback) => {
        mockChrome.runtime.lastError = { message: 'Storage error' };
        callback({});
      });

      await expect(repository.loadPreset('test')).rejects.toThrow("Failed to load preset 'test'");
    });
  });

  describe('getAllPresets', () => {
    it('should return all presets from Chrome storage', async () => {
      const storageData = {
        'lens_preset_work': {
          name: 'work',
          calendarEmails: ['work@example.com'],
          createdAt: new Date().toISOString(),
          lastUsedAt: null
        },
        'lens_preset_personal': {
          name: 'personal',
          calendarEmails: ['personal@example.com'],
          createdAt: new Date().toISOString(),
          lastUsedAt: null
        },
        'other_data': 'should_be_ignored'
      };

      mockChrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback(storageData);
      });

      const presets = await repository.getAllPresets();
      
      expect(presets).toHaveLength(2);
      expect(presets[0]).toBeInstanceOf(CalendarPreset);
      expect(presets.find(p => p.name === 'work')).toBeTruthy();
      expect(presets.find(p => p.name === 'personal')).toBeTruthy();
    });

    it('should handle invalid preset data gracefully', async () => {
      const storageData = {
        'lens_preset_valid': {
          name: 'valid',
          calendarEmails: ['email@example.com'],
          createdAt: new Date().toISOString(),
          lastUsedAt: null
        },
        'lens_preset_invalid': 'invalid_data'
      };

      mockChrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback(storageData);
      });

      const presets = await repository.getAllPresets();
      
      expect(presets).toHaveLength(1);
      expect(presets[0].name).toBe('valid');
    });
  });

  describe('deletePreset', () => {
    it('should delete existing preset', async () => {
      // Mock preset exists
      mockChrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback({ 'lens_preset_test': { name: 'test', calendarEmails: [] } });
      });

      mockChrome.storage.sync.remove.mockImplementation((keys, callback) => {
        callback();
      });

      await repository.deletePreset('test');

      expect(mockChrome.storage.sync.remove).toHaveBeenCalledWith(
        ['lens_preset_test'],
        expect.any(Function)
      );
    });

    it('should throw error if preset does not exist', async () => {
      mockChrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback({});
      });

      await expect(repository.deletePreset('nonexistent')).rejects.toThrow("Preset 'nonexistent' does not exist");
    });
  });

  describe('presetExists', () => {
    it('should return true for existing preset', async () => {
      mockChrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback({ 'lens_preset_test': { name: 'test' } });
      });

      const exists = await repository.presetExists('test');
      expect(exists).toBe(true);
    });

    it('should return false for non-existing preset', async () => {
      mockChrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback({});
      });

      const exists = await repository.presetExists('nonexistent');
      expect(exists).toBe(false);
    });
  });

  describe('clearAllPresets', () => {
    it('should clear all presets', async () => {
      const storageData = {
        'lens_preset_work': { name: 'work', calendarEmails: [] },
        'lens_preset_personal': { name: 'personal', calendarEmails: [] },
        'other_data': 'should_remain'
      };

      mockChrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback(storageData);
      });

      mockChrome.storage.sync.remove.mockImplementation((keys, callback) => {
        callback();
      });

      await repository.clearAllPresets();

      expect(mockChrome.storage.sync.remove).toHaveBeenCalledWith(
        ['lens_preset_work', 'lens_preset_personal'],
        expect.any(Function)
      );
    });

    it('should handle case when no presets exist', async () => {
      mockChrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback({ 'other_data': 'no_presets' });
      });

      await repository.clearAllPresets();

      // Should not call remove if no preset keys found
      expect(mockChrome.storage.sync.remove).not.toHaveBeenCalled();
    });
  });

  describe('getStorageStats', () => {
    it('should return storage statistics', async () => {
      mockChrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback({
          'lens_preset_test': {
            name: 'test',
            calendarEmails: ['test@example.com'],
            createdAt: new Date().toISOString(),
            lastUsedAt: null
          }
        });
      });

      mockChrome.storage.sync.getBytesInUse.mockImplementation((keys, callback) => {
        callback(1024);
      });

      const stats = await repository.getStorageStats();

      expect(stats).toEqual({
        presetCount: 1,
        bytesInUse: 1024,
        quota: 102400,
        percentUsed: 1
      });
    });
  });

  describe('private methods', () => {
    it('should generate proper storage keys', () => {
      const key = (repository as any).getPresetKey('Test With Spaces!@#');
      expect(key).toBe('lens_preset_test_with_spaces___');
    });

    it('should extract preset names from keys', () => {
      const name = (repository as any).getPresetNameFromKey('lens_preset_work');
      expect(name).toBe('work');
    });

    it('should identify preset keys correctly', () => {
      expect((repository as any).isPresetKey('lens_preset_work')).toBe(true);
      expect((repository as any).isPresetKey('other_key')).toBe(false);
    });

    it('should validate preset data structure', () => {
      const validData = {
        name: 'test',
        calendarEmails: ['test@example.com'],
        createdAt: new Date().toISOString(),
        lastUsedAt: null
      };

      expect(() => {
        (repository as any).validatePresetData(validData, 'test');
      }).not.toThrow();

      const invalidData = {
        name: 'test',
        calendarEmails: 'not_an_array', // Invalid
        createdAt: new Date().toISOString()
      };

      expect(() => {
        (repository as any).validatePresetData(invalidData, 'test');
      }).toThrow("Invalid calendarEmails field for preset 'test'");
    });

    it('should handle invalid date fields gracefully', () => {
      // Test missing createdAt
      const missingCreatedAt = {
        name: 'test',
        calendarEmails: ['email@test.com']
      };
      
      expect(() => (repository as any).validatePresetData(missingCreatedAt, 'test')).not.toThrow();
      expect(missingCreatedAt.createdAt).toBeInstanceOf(Date);

      // Test invalid date string
      const invalidDateString = {
        name: 'test',
        calendarEmails: ['email@test.com'],
        createdAt: 'invalid-date-string'
      };
      
      expect(() => (repository as any).validatePresetData(invalidDateString, 'test')).not.toThrow();
      expect(invalidDateString.createdAt).toBeInstanceOf(Date);

      // Test timestamp number
      const timestampDate = {
        name: 'test',
        calendarEmails: ['email@test.com'],
        createdAt: 1640995200000
      };
      
      expect(() => (repository as any).validatePresetData(timestampDate, 'test')).not.toThrow();
      expect(timestampDate.createdAt).toBeInstanceOf(Date);
      expect(timestampDate.createdAt.getTime()).toBe(1640995200000);

      // Test valid date string
      const validDateString = {
        name: 'test',
        calendarEmails: ['email@test.com'],
        createdAt: '2022-01-01T00:00:00.000Z'
      };
      
      expect(() => (repository as any).validatePresetData(validDateString, 'test')).not.toThrow();
      expect(validDateString.createdAt).toBeInstanceOf(Date);

      // Test invalid lastUsedAt
      const invalidLastUsedAt = {
        name: 'test',
        calendarEmails: ['email@test.com'],
        createdAt: new Date(),
        lastUsedAt: 'invalid-date'
      };
      
      expect(() => (repository as any).validatePresetData(invalidLastUsedAt, 'test')).not.toThrow();
      expect(invalidLastUsedAt.lastUsedAt).toBeUndefined();
    });
  });

  describe('configuration', () => {
    it('should use custom configuration', () => {
      const customRepo = new ChromeStorageRepository({
        storageArea: 'local',
        keyPrefix: 'custom_',
        maxPresets: 50
      });

      const key = (customRepo as any).getPresetKey('test');
      expect(key).toBe('custom_test');
    });

    it('should use default configuration when not provided', () => {
      const defaultRepo = new ChromeStorageRepository();
      const key = (defaultRepo as any).getPresetKey('test');
      expect(key).toBe('lens_preset_test');
    });
  });
});