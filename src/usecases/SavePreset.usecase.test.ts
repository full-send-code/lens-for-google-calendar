/**
 * Save Preset Use Case Tests
 */

import { SavePresetUseCase } from './SavePreset.usecase';
import { Calendar, CalendarPreset } from '../core/entities';
import type { CalendarRepository, PresetRepository } from '../core/repositories';

describe('SavePresetUseCase', () => {
  let useCase: SavePresetUseCase;
  let mockCalendarRepository: jest.Mocked<CalendarRepository>;
  let mockPresetRepository: jest.Mocked<PresetRepository>;

  beforeEach(() => {
    mockCalendarRepository = {
      discoverCalendars: jest.fn(),
      applyCalendarVisibility: jest.fn(),
      getCurrentCalendarStates: jest.fn(),
      getCurrentCalendarStatesFresh: jest.fn()
    };

    mockPresetRepository = {
      savePreset: jest.fn(),
      loadPreset: jest.fn(),
      getAllPresets: jest.fn(),
      deletePreset: jest.fn(),
      presetExists: jest.fn()
    };

    useCase = new SavePresetUseCase(mockCalendarRepository, mockPresetRepository);
  });

  describe('execute', () => {
    it('should save a new preset with visible calendars', async () => {
      // Arrange
      const visibleCalendars = [
        new Calendar({ email: 'work@example.com', name: 'Work', isVisible: true }),
        new Calendar({ email: 'personal@example.com', name: 'Personal', isVisible: true })
      ];
      const hiddenCalendars = [
        new Calendar({ email: 'hidden@example.com', name: 'Hidden', isVisible: false })
      ];

      mockPresetRepository.loadPreset.mockResolvedValue(undefined);
      mockCalendarRepository.getCurrentCalendarStates.mockResolvedValue([...visibleCalendars, ...hiddenCalendars]);
      mockPresetRepository.savePreset.mockResolvedValue();

      // Act
      const result = await useCase.execute({ name: 'work-setup' });

      // Assert
      expect(mockPresetRepository.loadPreset).toHaveBeenCalledWith('work-setup');
      expect(mockCalendarRepository.getCurrentCalendarStates).toHaveBeenCalled();
      expect(mockPresetRepository.savePreset).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'work-setup',
          calendarEmails: ['work@example.com', 'personal@example.com']
        })
      );
      expect(result.name).toBe('work-setup');
      expect(result.calendarEmails).toEqual(['work@example.com', 'personal@example.com']);
    });

    it('should throw error if preset name is empty', async () => {
      // Act & Assert
      await expect(useCase.execute({ name: '' })).rejects.toThrow('Preset name cannot be empty');
      await expect(useCase.execute({ name: '   ' })).rejects.toThrow('Preset name cannot be empty');
    });

    it('should throw error if preset exists and overwrite is false', async () => {
      // Arrange
      const existingPreset = new CalendarPreset('existing', ['test@example.com']);
      mockPresetRepository.loadPreset.mockResolvedValue(existingPreset);

      // Act & Assert
      await expect(useCase.execute({ name: 'existing', overwrite: false })).rejects.toThrow(
        'Preset "existing" already exists. Use overwrite option to update it.'
      );
    });

    it('should overwrite existing preset when overwrite is true', async () => {
      // Arrange
      const existingPreset = new CalendarPreset('existing', ['old@example.com']);
      const visibleCalendars = [
        new Calendar({ email: 'new@example.com', name: 'New', isVisible: true })
      ];

      mockPresetRepository.loadPreset.mockResolvedValue(existingPreset);
      mockCalendarRepository.getCurrentCalendarStates.mockResolvedValue(visibleCalendars);
      mockPresetRepository.savePreset.mockResolvedValue();

      // Act
      const result = await useCase.execute({ name: 'existing', overwrite: true });

      // Assert
      expect(mockPresetRepository.savePreset).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'existing',
          calendarEmails: ['new@example.com']
        })
      );
      expect(result.calendarEmails).toEqual(['new@example.com']);
    });

    it('should throw error if no calendars are visible', async () => {
      // Arrange
      const hiddenCalendars = [
        new Calendar({ email: 'hidden@example.com', name: 'Hidden', isVisible: false })
      ];

      mockPresetRepository.loadPreset.mockResolvedValue(undefined);
      mockCalendarRepository.getCurrentCalendarStates.mockResolvedValue(hiddenCalendars);

      // Act & Assert
      await expect(useCase.execute({ name: 'empty-preset' })).rejects.toThrow(
        'Cannot save preset: no calendars are currently visible'
      );
    });

    it('should handle repository errors', async () => {
      // Arrange
      mockPresetRepository.loadPreset.mockRejectedValue(new Error('Repository error'));

      // Act & Assert
      await expect(useCase.execute({ name: 'test' })).rejects.toThrow('Repository error');
    });
  });
});