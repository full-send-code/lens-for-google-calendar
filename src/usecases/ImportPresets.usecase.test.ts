import { ImportPresetsUseCase, PresetImportData } from './ImportPresets.usecase';
import { InvalidPresetDataError, PresetRepository, CalendarPreset } from '../core';

// Mock repository
const mockPresetRepository = (): jest.Mocked<PresetRepository> => ({
  savePreset: jest.fn(),
  loadPreset: jest.fn(),
  getAllPresets: jest.fn(),
  deletePreset: jest.fn(),
  presetExists: jest.fn()
});

describe('ImportPresetsUseCase', () => {
  let useCase: ImportPresetsUseCase;
  let presetRepo: jest.Mocked<PresetRepository>;

  beforeEach(() => {
    presetRepo = mockPresetRepository();
    useCase = new ImportPresetsUseCase(presetRepo);
  });

  describe('execute', () => {
    it('should import valid preset data successfully', async () => {
      // Arrange
      const importData: PresetImportData = {
        'work': ['work@company.com', 'team@company.com'],
        'personal': ['personal@gmail.com', 'family@gmail.com']
      };
      const jsonData = JSON.stringify(importData);
      presetRepo.loadPreset.mockResolvedValue(undefined); // No existing presets

      // Act
      const result = await useCase.execute(jsonData);

      // Assert
      expect(result).toEqual(['work', 'personal']);
      expect(presetRepo.savePreset).toHaveBeenCalledTimes(2);
      
      const savedPresets = presetRepo.savePreset.mock.calls.map(call => call[0]);
      expect(savedPresets[0].name).toBe('work');
      expect(savedPresets[0].calendarEmails).toEqual(['work@company.com', 'team@company.com']);
      expect(savedPresets[1].name).toBe('personal');
      expect(savedPresets[1].calendarEmails).toEqual(['personal@gmail.com', 'family@gmail.com']);
    });

    it('should skip existing presets when overwriteExisting is false', async () => {
      // Arrange
      const importData: PresetImportData = {
        'existing': ['cal1@example.com'],
        'new': ['cal2@example.com']
      };
      const jsonData = JSON.stringify(importData);
      
      presetRepo.loadPreset.mockImplementation((name) => {
        if (name === 'existing') {
          return Promise.resolve(new CalendarPreset('existing', ['old@example.com']));
        }
        return Promise.resolve(undefined);
      });

      // Act
      const result = await useCase.execute(jsonData, false);

      // Assert
      expect(result).toEqual(['new']); // Only new preset imported
      expect(presetRepo.savePreset).toHaveBeenCalledTimes(1);
      expect(presetRepo.savePreset.mock.calls[0][0].name).toBe('new');
    });

    it('should overwrite existing presets when overwriteExisting is true', async () => {
      // Arrange
      const importData: PresetImportData = {
        'existing': ['new-cal@example.com'],
        'new': ['cal2@example.com']
      };
      const jsonData = JSON.stringify(importData);
      
      presetRepo.loadPreset.mockImplementation((name) => {
        if (name === 'existing') {
          return Promise.resolve(new CalendarPreset('existing', ['old@example.com']));
        }
        return Promise.resolve(undefined);
      });

      // Act
      const result = await useCase.execute(jsonData, true);

      // Assert
      expect(result).toEqual(['existing', 'new']);
      expect(presetRepo.savePreset).toHaveBeenCalledTimes(2);
      
      const existingPreset = presetRepo.savePreset.mock.calls.find(call => call[0].name === 'existing')?.[0];
      expect(existingPreset?.calendarEmails).toEqual(['new-cal@example.com']);
    });

    it('should handle empty preset data', async () => {
      // Arrange
      const jsonData = JSON.stringify({});

      // Act
      const result = await useCase.execute(jsonData);

      // Assert
      expect(result).toEqual([]);
      expect(presetRepo.savePreset).not.toHaveBeenCalled();
    });

    it('should import preset with single calendar', async () => {
      // Arrange
      const importData: PresetImportData = {
        'minimal': ['single@example.com']
      };
      const jsonData = JSON.stringify(importData);
      presetRepo.loadPreset.mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute(jsonData);

      // Assert
      expect(result).toEqual(['minimal']);
      expect(presetRepo.savePreset).toHaveBeenCalledTimes(1);
      expect(presetRepo.savePreset.mock.calls[0][0].calendarEmails).toEqual(['single@example.com']);
    });

    it('should handle preset with empty calendar array', async () => {
      // Arrange
      const importData: PresetImportData = {
        'empty': []
      };
      const jsonData = JSON.stringify(importData);
      presetRepo.loadPreset.mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute(jsonData);

      // Assert
      expect(result).toEqual(['empty']);
      expect(presetRepo.savePreset).toHaveBeenCalledTimes(1);
      expect(presetRepo.savePreset.mock.calls[0][0].calendarEmails).toEqual([]);
    });

    it('should throw InvalidPresetDataError for invalid JSON', async () => {
      // Arrange
      const invalidJson = '{ invalid json ';

      // Act & Assert
      await expect(useCase.execute(invalidJson)).rejects.toThrow(InvalidPresetDataError);
      await expect(useCase.execute(invalidJson)).rejects.toThrow('Invalid JSON format');
      expect(presetRepo.savePreset).not.toHaveBeenCalled();
    });

    it('should throw error when jsonData is empty', async () => {
      // Act & Assert
      await expect(useCase.execute('')).rejects.toThrow(InvalidPresetDataError);
      await expect(useCase.execute('')).rejects.toThrow('JSON data is required and must be a string');
    });

    it('should throw error when jsonData is null', async () => {
      // Act & Assert
      await expect(useCase.execute(null as any)).rejects.toThrow(InvalidPresetDataError);
      await expect(useCase.execute(null as any)).rejects.toThrow('JSON data is required and must be a string');
    });

    it('should throw error when jsonData is not a string', async () => {
      // Act & Assert
      await expect(useCase.execute(123 as any)).rejects.toThrow(InvalidPresetDataError);
      await expect(useCase.execute(123 as any)).rejects.toThrow('JSON data is required and must be a string');
    });

    it('should throw InvalidPresetDataError for array JSON', async () => {
      // Arrange
      const arrayJson = JSON.stringify(['not', 'an', 'object']);

      // Act & Assert
      await expect(useCase.execute(arrayJson)).rejects.toThrow(InvalidPresetDataError);
      await expect(useCase.execute(arrayJson)).rejects.toThrow('Expected an object with preset names as keys');
    });

    it('should throw InvalidPresetDataError for null JSON', async () => {
      // Arrange
      const nullJson = JSON.stringify(null);

      // Act & Assert
      await expect(useCase.execute(nullJson)).rejects.toThrow(InvalidPresetDataError);
      await expect(useCase.execute(nullJson)).rejects.toThrow('Expected an object with preset names as keys');
    });

    it('should throw InvalidPresetDataError for string JSON', async () => {
      // Arrange
      const stringJson = JSON.stringify('not an object');

      // Act & Assert
      await expect(useCase.execute(stringJson)).rejects.toThrow(InvalidPresetDataError);
      await expect(useCase.execute(stringJson)).rejects.toThrow('Expected an object with preset names as keys');
    });

    it('should throw InvalidPresetDataError for invalid preset name', async () => {
      // Arrange
      const importData = {
        '': ['cal@example.com'] // Empty preset name
      };
      const jsonData = JSON.stringify(importData);

      // Act & Assert
      await expect(useCase.execute(jsonData)).rejects.toThrow(InvalidPresetDataError);
      await expect(useCase.execute(jsonData)).rejects.toThrow('Invalid preset name');
    });

    it('should throw InvalidPresetDataError for non-array calendar emails', async () => {
      // Arrange
      const importData = {
        'test': 'not-an-array' as any
      };
      const jsonData = JSON.stringify(importData);

      // Act & Assert
      await expect(useCase.execute(jsonData)).rejects.toThrow(InvalidPresetDataError);
      await expect(useCase.execute(jsonData)).rejects.toThrow("Preset 'test' must have an array of calendar emails");
    });

    it('should throw InvalidPresetDataError for invalid email in array', async () => {
      // Arrange
      const importData = {
        'test': ['valid@example.com', null, 'another@example.com'] as any
      };
      const jsonData = JSON.stringify(importData);

      // Act & Assert
      await expect(useCase.execute(jsonData)).rejects.toThrow(InvalidPresetDataError);
      await expect(useCase.execute(jsonData)).rejects.toThrow("Invalid email in preset 'test'");
    });

    it('should throw InvalidPresetDataError for non-string email', async () => {
      // Arrange
      const importData = {
        'test': ['valid@example.com', 123, 'another@example.com'] as any
      };
      const jsonData = JSON.stringify(importData);

      // Act & Assert
      await expect(useCase.execute(jsonData)).rejects.toThrow(InvalidPresetDataError);
      await expect(useCase.execute(jsonData)).rejects.toThrow("Invalid email in preset 'test'");
    });

    it('should handle repository errors gracefully', async () => {
      // Arrange
      const importData: PresetImportData = {
        'test': ['test@example.com']
      };
      const jsonData = JSON.stringify(importData);
      presetRepo.loadPreset.mockResolvedValue(undefined);
      const error = new Error('Repository error');
      presetRepo.savePreset.mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.execute(jsonData)).rejects.toThrow('Failed to import presets: Repository error');
    });

    it('should handle unknown errors gracefully', async () => {
      // Arrange
      const importData: PresetImportData = {
        'test': ['test@example.com']
      };
      const jsonData = JSON.stringify(importData);
      presetRepo.loadPreset.mockRejectedValue('string error');

      // Act & Assert
      await expect(useCase.execute(jsonData)).rejects.toThrow('Failed to import presets: Unknown error');
    });

    it('should propagate InvalidPresetDataError without wrapping', async () => {
      // Arrange
      const invalidJson = '{ invalid }';

      // Act & Assert
      const error = await useCase.execute(invalidJson).catch(e => e);
      expect(error).toBeInstanceOf(InvalidPresetDataError);
      expect(error.name).toBe('InvalidPresetDataError');
    });

    it('should handle large import data', async () => {
      // Arrange
      const largeImportData: PresetImportData = {};
      for (let i = 0; i < 100; i++) {
        largeImportData[`preset${i}`] = [`cal${i}@example.com`];
      }
      const jsonData = JSON.stringify(largeImportData);
      presetRepo.loadPreset.mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute(jsonData);

      // Assert
      expect(result).toHaveLength(100);
      expect(presetRepo.savePreset).toHaveBeenCalledTimes(100);
    });

    it('should handle special characters in preset names and emails', async () => {
      // Arrange
      const importData: PresetImportData = {
        'work-2024 (updated)': ['user+tag@example-domain.co.uk', 'test@münchen.de']
      };
      const jsonData = JSON.stringify(importData);
      presetRepo.loadPreset.mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute(jsonData);

      // Assert
      expect(result).toEqual(['work-2024 (updated)']);
      expect(presetRepo.savePreset).toHaveBeenCalledTimes(1);
      const savedPreset = presetRepo.savePreset.mock.calls[0][0];
      expect(savedPreset.name).toBe('work-2024 (updated)');
      expect(savedPreset.calendarEmails).toEqual(['user+tag@example-domain.co.uk', 'test@münchen.de']);
    });

    it('should preserve order of presets in import data', async () => {
      // Arrange
      const importData: PresetImportData = {
        'z-last': ['z@example.com'],
        'a-first': ['a@example.com'],
        'm-middle': ['m@example.com']
      };
      const jsonData = JSON.stringify(importData);
      presetRepo.loadPreset.mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute(jsonData);

      // Assert - Order should match object property order
      expect(result).toEqual(['z-last', 'a-first', 'm-middle']);
    });

    it('should handle default overwriteExisting parameter', async () => {
      // Arrange
      const importData: PresetImportData = {
        'existing': ['new@example.com']
      };
      const jsonData = JSON.stringify(importData);
      presetRepo.loadPreset.mockResolvedValue(new CalendarPreset('existing', ['old@example.com']));

      // Act - not passing overwriteExisting (should default to false)
      const result = await useCase.execute(jsonData);

      // Assert
      expect(result).toEqual([]); // Should skip existing preset
      expect(presetRepo.savePreset).not.toHaveBeenCalled();
    });
  });

  describe('InvalidPresetDataError', () => {
    it('should create error with correct message and name', () => {
      const error = new InvalidPresetDataError('test reason');
      
      expect(error.message).toBe('Invalid preset data: test reason');
      expect(error.name).toBe('InvalidPresetDataError');
      expect(error).toBeInstanceOf(Error);
    });
  });
});