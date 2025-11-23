import { ExportPresetsUseCase, PresetExportData } from './ExportPresets.usecase';
import { PresetRepository, CalendarPreset } from '../core';

// Mock repository
const mockPresetRepository = (): jest.Mocked<PresetRepository> => ({
  savePreset: jest.fn(),
  loadPreset: jest.fn(),
  getAllPresets: jest.fn(),
  deletePreset: jest.fn(),
  presetExists: jest.fn()
});

describe('ExportPresetsUseCase', () => {
  let useCase: ExportPresetsUseCase;
  let presetRepo: jest.Mocked<PresetRepository>;

  beforeEach(() => {
    presetRepo = mockPresetRepository();
    useCase = new ExportPresetsUseCase(presetRepo);
  });

  describe('execute', () => {
    it('should export presets to formatted JSON string', async () => {
      // Arrange
      const presets = [
        new CalendarPreset('work', ['work@company.com', 'team@company.com']),
        new CalendarPreset('personal', ['personal@gmail.com', 'family@gmail.com'])
      ];
      presetRepo.getAllPresets.mockResolvedValue(presets);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(presetRepo.getAllPresets).toHaveBeenCalledTimes(1);
      
      const parsedResult = JSON.parse(result);
      expect(parsedResult).toEqual({
        'work': ['work@company.com', 'team@company.com'],
        'personal': ['personal@gmail.com', 'family@gmail.com']
      });
      
      // Check JSON formatting (should be pretty-printed)
      expect(result).toContain('\n'); // Should have newlines for formatting
      expect(result).toContain('  '); // Should have indentation
    });

    it('should export empty object when no presets exist', async () => {
      // Arrange
      presetRepo.getAllPresets.mockResolvedValue([]);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toBe('{}');
    });

    it('should export single preset correctly', async () => {
      // Arrange
      const presets = [
        new CalendarPreset('minimal', ['single@example.com'])
      ];
      presetRepo.getAllPresets.mockResolvedValue(presets);

      // Act
      const result = await useCase.execute();

      // Assert
      const parsedResult = JSON.parse(result);
      expect(parsedResult).toEqual({
        'minimal': ['single@example.com']
      });
    });

    it('should export preset with empty calendar list', async () => {
      // Arrange
      const presets = [
        new CalendarPreset('empty', [])
      ];
      presetRepo.getAllPresets.mockResolvedValue(presets);

      // Act
      const result = await useCase.execute();

      // Assert
      const parsedResult = JSON.parse(result);
      expect(parsedResult).toEqual({
        'empty': []
      });
    });

    it('should handle special characters in preset names and emails', async () => {
      // Arrange
      const presets = [
        new CalendarPreset('work-2024 (updated)', ['user+tag@example-domain.co.uk', 'test@münchen.de'])
      ];
      presetRepo.getAllPresets.mockResolvedValue(presets);

      // Act
      const result = await useCase.execute();

      // Assert
      const parsedResult = JSON.parse(result);
      expect(parsedResult).toEqual({
        'work-2024 (updated)': ['user+tag@example-domain.co.uk', 'test@münchen.de']
      });
    });

    it('should export large number of presets', async () => {
      // Arrange
      const presets = Array.from({ length: 100 }, (_, i) => 
        new CalendarPreset(`preset${i}`, [`cal${i}@example.com`])
      );
      presetRepo.getAllPresets.mockResolvedValue(presets);

      // Act
      const result = await useCase.execute();

      // Assert
      const parsedResult = JSON.parse(result);
      expect(Object.keys(parsedResult)).toHaveLength(100);
      
      for (let i = 0; i < 100; i++) {
        expect(parsedResult[`preset${i}`]).toEqual([`cal${i}@example.com`]);
      }
    });

    it('should preserve preset order from repository', async () => {
      // Arrange
      const presets = [
        new CalendarPreset('z-last', ['z@example.com']),
        new CalendarPreset('a-first', ['a@example.com']),
        new CalendarPreset('m-middle', ['m@example.com'])
      ];
      presetRepo.getAllPresets.mockResolvedValue(presets);

      // Act
      const result = await useCase.execute();

      // Assert
      const parsedResult = JSON.parse(result);
      const keys = Object.keys(parsedResult);
      expect(keys).toEqual(['z-last', 'a-first', 'm-middle']);
    });

    it('should throw error when getAllPresets fails', async () => {
      // Arrange
      const error = new Error('Repository error');
      presetRepo.getAllPresets.mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.execute()).rejects.toThrow('Failed to export presets: Repository error');
    });

    it('should handle unknown errors gracefully', async () => {
      // Arrange
      presetRepo.getAllPresets.mockRejectedValue('string error');

      // Act & Assert
      await expect(useCase.execute()).rejects.toThrow('Failed to export presets: Unknown error');
    });

    it('should handle preset with duplicate calendar emails', async () => {
      // Arrange - Create preset manually to test edge case
      const presetWithDuplicates = new CalendarPreset('test', ['cal@example.com', 'cal@example.com']);
      presetRepo.getAllPresets.mockResolvedValue([presetWithDuplicates]);

      // Act
      const result = await useCase.execute();

      // Assert
      const parsedResult = JSON.parse(result);
      expect(parsedResult).toEqual({
        'test': ['cal@example.com', 'cal@example.com'] // Should preserve what's in the preset
      });
    });

    it('should generate valid JSON that can be round-tripped', async () => {
      // Arrange
      const presets = [
        new CalendarPreset('work', ['work@company.com', 'team@company.com']),
        new CalendarPreset('personal', ['personal@gmail.com'])
      ];
      presetRepo.getAllPresets.mockResolvedValue(presets);

      // Act
      const result = await useCase.execute();

      // Assert - Should be able to parse and stringify again
      const parsed = JSON.parse(result);
      const reStringified = JSON.stringify(parsed);
      expect(() => JSON.parse(reStringified)).not.toThrow();
    });
  });

  describe('executeRaw', () => {
    it('should return raw data object instead of JSON string', async () => {
      // Arrange
      const presets = [
        new CalendarPreset('work', ['work@company.com', 'team@company.com']),
        new CalendarPreset('personal', ['personal@gmail.com'])
      ];
      presetRepo.getAllPresets.mockResolvedValue(presets);

      // Act
      const result = await useCase.executeRaw();

      // Assert
      expect(typeof result).toBe('object');
      expect(result).toEqual({
        'work': ['work@company.com', 'team@company.com'],
        'personal': ['personal@gmail.com']
      });
    });

    it('should return empty object when no presets exist', async () => {
      // Arrange
      presetRepo.getAllPresets.mockResolvedValue([]);

      // Act
      const result = await useCase.executeRaw();

      // Assert
      expect(result).toEqual({});
    });

    it('should throw error when getAllPresets fails', async () => {
      // Arrange
      const error = new Error('Repository error');
      presetRepo.getAllPresets.mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.executeRaw()).rejects.toThrow('Failed to export presets: Repository error');
    });

    it('should handle unknown errors gracefully', async () => {
      // Arrange
      presetRepo.getAllPresets.mockRejectedValue('string error');

      // Act & Assert
      await expect(useCase.executeRaw()).rejects.toThrow('Failed to export presets: Unknown error');
    });

    it('should return data structure that matches execute() parsed result', async () => {
      // Arrange
      const presets = [
        new CalendarPreset('test', ['test@example.com'])
      ];
      presetRepo.getAllPresets.mockResolvedValue(presets);

      // Act
      const jsonResult = await useCase.execute();
      const rawResult = await useCase.executeRaw();

      // Assert
      expect(rawResult).toEqual(JSON.parse(jsonResult));
    });

    it('should handle large datasets efficiently', async () => {
      // Arrange
      const presets = Array.from({ length: 1000 }, (_, i) => 
        new CalendarPreset(`preset${i}`, [`cal${i}@example.com`])
      );
      presetRepo.getAllPresets.mockResolvedValue(presets);

      // Act
      const startTime = Date.now();
      const result = await useCase.executeRaw();
      const endTime = Date.now();

      // Assert
      expect(Object.keys(result)).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete quickly
    });

    it('should return object that can be modified without affecting future calls', async () => {
      // Arrange
      const presets = [
        new CalendarPreset('test', ['test@example.com'])
      ];
      presetRepo.getAllPresets.mockResolvedValue(presets);

      // Act
      const result1 = await useCase.executeRaw();
      result1['modified'] = ['modified@example.com']; // Modify result
      const result2 = await useCase.executeRaw();

      // Assert
      expect(result2).not.toHaveProperty('modified');
      expect(result2).toEqual({
        'test': ['test@example.com']
      });
    });
  });

  describe('integration between execute and executeRaw', () => {
    it('should produce equivalent data in both formats', async () => {
      // Arrange
      const presets = [
        new CalendarPreset('work', ['work@company.com']),
        new CalendarPreset('personal', ['personal@gmail.com', 'family@gmail.com']),
        new CalendarPreset('empty', [])
      ];
      presetRepo.getAllPresets.mockResolvedValue(presets);

      // Act
      const jsonResult = await useCase.execute();
      const rawResult = await useCase.executeRaw();

      // Assert
      expect(JSON.parse(jsonResult)).toEqual(rawResult);
      expect(JSON.stringify(rawResult, null, 2)).toBe(jsonResult);
    });
  });
});