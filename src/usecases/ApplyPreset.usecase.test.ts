import { ApplyPresetUseCase } from './ApplyPreset.usecase';
import { PresetNotFoundError, CalendarRepository, PresetRepository, Calendar, CalendarPreset } from '../core';

// Mock repositories
const mockCalendarRepository = (): jest.Mocked<CalendarRepository> => ({
  discoverCalendars: jest.fn(),
  applyCalendarVisibility: jest.fn(),
  getCurrentCalendarStates: jest.fn(),
  getCurrentCalendarStatesFresh: jest.fn()
});

const mockPresetRepository = (): jest.Mocked<PresetRepository> => ({
  savePreset: jest.fn(),
  loadPreset: jest.fn(),
  getAllPresets: jest.fn(),
  deletePreset: jest.fn(),
  presetExists: jest.fn()
});

describe('ApplyPresetUseCase', () => {
  let useCase: ApplyPresetUseCase;
  let calendarRepo: jest.Mocked<CalendarRepository>;
  let presetRepo: jest.Mocked<PresetRepository>;

  beforeEach(() => {
    calendarRepo = mockCalendarRepository();
    presetRepo = mockPresetRepository();
    useCase = new ApplyPresetUseCase(calendarRepo, presetRepo);
  });

  describe('execute', () => {
    it('should apply preset correctly showing included calendars and hiding others', async () => {
      // Arrange
      const workPreset = new CalendarPreset('work', ['work@company.com', 'team@company.com']);
      const mockCalendars = [
        new Calendar({ email: 'work@company.com', name: 'Work Calendar', isVisible: false }),
        new Calendar({ email: 'personal@gmail.com', name: 'Personal Calendar', isVisible: true }),
        new Calendar({ email: 'team@company.com', name: 'Team Calendar', isVisible: false }),
        new Calendar({ email: 'family@gmail.com', name: 'Family Calendar', isVisible: true })
      ];

      presetRepo.loadPreset.mockResolvedValue(workPreset);
      calendarRepo.getCurrentCalendarStates.mockResolvedValue(mockCalendars);

      // Act
      await useCase.execute('work');

      // Assert
      expect(presetRepo.loadPreset).toHaveBeenCalledWith('work');
      expect(calendarRepo.getCurrentCalendarStates).toHaveBeenCalledTimes(1);
      expect(calendarRepo.applyCalendarVisibility).toHaveBeenCalledTimes(1);

      const appliedCalendars = calendarRepo.applyCalendarVisibility.mock.calls[0][0];
      expect(appliedCalendars).toHaveLength(4);

      // Work calendars should be visible
      const workCalendar = appliedCalendars.find(cal => cal.email === 'work@company.com');
      const teamCalendar = appliedCalendars.find(cal => cal.email === 'team@company.com');
      expect(workCalendar?.isVisible).toBe(true);
      expect(teamCalendar?.isVisible).toBe(true);

      // Non-work calendars should be hidden
      const personalCalendar = appliedCalendars.find(cal => cal.email === 'personal@gmail.com');
      const familyCalendar = appliedCalendars.find(cal => cal.email === 'family@gmail.com');
      expect(personalCalendar?.isVisible).toBe(false);
      expect(familyCalendar?.isVisible).toBe(false);
    });

    it('should mark preset as used after successful application', async () => {
      // Arrange
      const originalPreset = new CalendarPreset('test', ['test@example.com']);
      const mockCalendars = [
        new Calendar({ email: 'test@example.com', name: 'Test Calendar', isVisible: false })
      ];

      presetRepo.loadPreset.mockResolvedValue(originalPreset);
      calendarRepo.getCurrentCalendarStates.mockResolvedValue(mockCalendars);

      // Act
      await useCase.execute('test');

      // Assert
      expect(presetRepo.savePreset).toHaveBeenCalledTimes(1);
      const savedPreset = presetRepo.savePreset.mock.calls[0][0];
      expect(savedPreset.lastUsedAt).toBeDefined();
      expect(savedPreset.name).toBe('test');
    });

    it('should throw PresetNotFoundError when preset does not exist', async () => {
      // Arrange
      presetRepo.loadPreset.mockResolvedValue(undefined);

      // Act & Assert
      await expect(useCase.execute('nonexistent')).rejects.toThrow(PresetNotFoundError);
      await expect(useCase.execute('nonexistent')).rejects.toThrow(
        "Preset 'nonexistent' not found"
      );
      expect(calendarRepo.getCurrentCalendarStates).not.toHaveBeenCalled();
      expect(calendarRepo.applyCalendarVisibility).not.toHaveBeenCalled();
      expect(presetRepo.savePreset).not.toHaveBeenCalled();
    });

    it('should throw error when preset name is empty', async () => {
      // Act & Assert
      await expect(useCase.execute('')).rejects.toThrow(
        'Preset name is required and must be a string'
      );
      expect(presetRepo.loadPreset).not.toHaveBeenCalled();
    });

    it('should throw error when preset name is null', async () => {
      // Act & Assert
      await expect(useCase.execute(null as any)).rejects.toThrow(
        'Preset name is required and must be a string'
      );
      expect(presetRepo.loadPreset).not.toHaveBeenCalled();
    });

    it('should throw error when preset name is not a string', async () => {
      // Act & Assert
      await expect(useCase.execute(123 as any)).rejects.toThrow(
        'Preset name is required and must be a string'
      );
      expect(presetRepo.loadPreset).not.toHaveBeenCalled();
    });

    it('should handle empty preset (no calendars)', async () => {
      // Arrange
      const emptyPreset = new CalendarPreset('empty', []);
      const mockCalendars = [
        new Calendar({ email: 'cal1@example.com', name: 'Calendar 1', isVisible: true }),
        new Calendar({ email: 'cal2@example.com', name: 'Calendar 2', isVisible: true })
      ];

      presetRepo.loadPreset.mockResolvedValue(emptyPreset);
      calendarRepo.getCurrentCalendarStates.mockResolvedValue(mockCalendars);

      // Act
      await useCase.execute('empty');

      // Assert - all calendars should be hidden
      const appliedCalendars = calendarRepo.applyCalendarVisibility.mock.calls[0][0];
      appliedCalendars.forEach(calendar => {
        expect(calendar.isVisible).toBe(false);
      });
    });

    it('should handle calendars not in current state', async () => {
      // Arrange
      const preset = new CalendarPreset('mixed', ['existing@example.com', 'missing@example.com']);
      const mockCalendars = [
        new Calendar({ email: 'existing@example.com', name: 'Existing Calendar', isVisible: false }),
        new Calendar({ email: 'other@example.com', name: 'Other Calendar', isVisible: true })
      ];

      presetRepo.loadPreset.mockResolvedValue(preset);
      calendarRepo.getCurrentCalendarStates.mockResolvedValue(mockCalendars);

      // Act
      await useCase.execute('mixed');

      // Assert
      const appliedCalendars = calendarRepo.applyCalendarVisibility.mock.calls[0][0];
      const existingCalendar = appliedCalendars.find(cal => cal.email === 'existing@example.com');
      const otherCalendar = appliedCalendars.find(cal => cal.email === 'other@example.com');
      
      expect(existingCalendar?.isVisible).toBe(true); // In preset
      expect(otherCalendar?.isVisible).toBe(false); // Not in preset
    });

    it('should preserve original objects (immutability)', async () => {
      // Arrange
      const originalPreset = new CalendarPreset('test', ['test@example.com']);
      const mockCalendars = [
        new Calendar({ email: 'test@example.com', name: 'Test Calendar', isVisible: false })
      ];

      presetRepo.loadPreset.mockResolvedValue(originalPreset);
      calendarRepo.getCurrentCalendarStates.mockResolvedValue(mockCalendars);

      // Act
      await useCase.execute('test');

      // Assert
      // Original preset should remain unchanged
      expect(originalPreset.lastUsedAt).toBeUndefined();
      
      // Saved preset should be different instance with lastUsedAt
      const savedPreset = presetRepo.savePreset.mock.calls[0][0];
      expect(savedPreset).not.toBe(originalPreset);
      expect(savedPreset.lastUsedAt).toBeDefined();

      // Original calendars should remain unchanged
      expect(mockCalendars[0].isVisible).toBe(false);
      
      // Applied calendars should be different instances
      const appliedCalendars = calendarRepo.applyCalendarVisibility.mock.calls[0][0];
      expect(appliedCalendars[0]).not.toBe(mockCalendars[0]);
    });

    it('should throw error when loadPreset fails', async () => {
      // Arrange
      const error = new Error('Storage error');
      presetRepo.loadPreset.mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.execute('test')).rejects.toThrow(
        "Failed to apply preset 'test': Storage error"
      );
      expect(calendarRepo.getCurrentCalendarStates).not.toHaveBeenCalled();
    });

    it('should throw error when getCurrentCalendarStates fails', async () => {
      // Arrange
      const preset = new CalendarPreset('test', ['test@example.com']);
      presetRepo.loadPreset.mockResolvedValue(preset);
      const error = new Error('Calendar error');
      calendarRepo.getCurrentCalendarStates.mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.execute('test')).rejects.toThrow(
        "Failed to apply preset 'test': Calendar error"
      );
      expect(presetRepo.savePreset).not.toHaveBeenCalled();
    });

    it('should throw error when applyCalendarVisibility fails', async () => {
      // Arrange
      const preset = new CalendarPreset('test', ['test@example.com']);
      const mockCalendars = [
        new Calendar({ email: 'test@example.com', name: 'Test Calendar', isVisible: false })
      ];

      presetRepo.loadPreset.mockResolvedValue(preset);
      calendarRepo.getCurrentCalendarStates.mockResolvedValue(mockCalendars);
      const error = new Error('Apply error');
      calendarRepo.applyCalendarVisibility.mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.execute('test')).rejects.toThrow(
        "Failed to apply preset 'test': Apply error"
      );
      expect(presetRepo.savePreset).not.toHaveBeenCalled();
    });

    it('should throw error when savePreset fails', async () => {
      // Arrange
      const preset = new CalendarPreset('test', ['test@example.com']);
      const mockCalendars = [
        new Calendar({ email: 'test@example.com', name: 'Test Calendar', isVisible: false })
      ];

      presetRepo.loadPreset.mockResolvedValue(preset);
      calendarRepo.getCurrentCalendarStates.mockResolvedValue(mockCalendars);
      calendarRepo.applyCalendarVisibility.mockResolvedValue(undefined);
      const error = new Error('Save error');
      presetRepo.savePreset.mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.execute('test')).rejects.toThrow(
        "Failed to apply preset 'test': Save error"
      );
    });

    it('should handle unknown errors gracefully', async () => {
      // Arrange
      presetRepo.loadPreset.mockRejectedValue('string error');

      // Act & Assert
      await expect(useCase.execute('test')).rejects.toThrow(
        "Failed to apply preset 'test': Unknown error"
      );
    });

    it('should propagate PresetNotFoundError without wrapping', async () => {
      // Arrange
      presetRepo.loadPreset.mockResolvedValue(undefined);

      // Act & Assert
      const error = await useCase.execute('missing').catch(e => e);
      expect(error).toBeInstanceOf(PresetNotFoundError);
      expect(error.name).toBe('PresetNotFoundError');
      expect(error.message).toBe("Preset 'missing' not found");
    });

    it('should work with large preset', async () => {
      // Arrange
      const largeEmails = Array.from({ length: 50 }, (_, i) => `cal${i}@example.com`);
      const largePreset = new CalendarPreset('large', largeEmails);
      const mockCalendars = Array.from({ length: 100 }, (_, i) => 
        new Calendar({ 
          email: `cal${i}@example.com`, 
          name: `Calendar ${i}`, 
          isVisible: false 
        })
      );

      presetRepo.loadPreset.mockResolvedValue(largePreset);
      calendarRepo.getCurrentCalendarStates.mockResolvedValue(mockCalendars);

      // Act
      await useCase.execute('large');

      // Assert
      const appliedCalendars = calendarRepo.applyCalendarVisibility.mock.calls[0][0];
      expect(appliedCalendars).toHaveLength(100);
      
      // First 50 should be visible, rest hidden
      for (let i = 0; i < 50; i++) {
        const calendar = appliedCalendars.find(cal => cal.email === `cal${i}@example.com`);
        expect(calendar?.isVisible).toBe(true);
      }
      for (let i = 50; i < 100; i++) {
        const calendar = appliedCalendars.find(cal => cal.email === `cal${i}@example.com`);
        expect(calendar?.isVisible).toBe(false);
      }
    });
  });

  describe('PresetNotFoundError', () => {
    it('should create error with correct message and name', () => {
      const error = new PresetNotFoundError('test-preset');
      
      expect(error.message).toBe("Preset 'test-preset' not found");
      expect(error.name).toBe('PresetNotFoundError');
      expect(error).toBeInstanceOf(Error);
    });
  });
});