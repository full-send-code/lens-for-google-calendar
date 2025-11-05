import { ClearCalendarsUseCase } from './ClearCalendars.usecase';
import { CalendarRepository, Calendar } from '../core';

// Mock repository
const mockCalendarRepository = (): jest.Mocked<CalendarRepository> => ({
  discoverCalendars: jest.fn(),
  applyCalendarVisibility: jest.fn(),
  getCurrentCalendarStates: jest.fn()
});

describe('ClearCalendarsUseCase', () => {
  let useCase: ClearCalendarsUseCase;
  let calendarRepo: jest.Mocked<CalendarRepository>;

  beforeEach(() => {
    calendarRepo = mockCalendarRepository();
    useCase = new ClearCalendarsUseCase(calendarRepo);
  });

  describe('execute', () => {
    it('should clear all calendars when multiple calendars exist', async () => {
      // Arrange
      const mockCalendars = [
        new Calendar({ email: 'work@example.com', name: 'Work Calendar', isVisible: true }),
        new Calendar({ email: 'personal@example.com', name: 'Personal Calendar', isVisible: true }),
        new Calendar({ email: 'team@example.com', name: 'Team Calendar', isVisible: false })
      ];
      calendarRepo.getCurrentCalendarStates.mockResolvedValue(mockCalendars);

      // Act
      await useCase.execute();

      // Assert
      expect(calendarRepo.getCurrentCalendarStates).toHaveBeenCalledTimes(1);
      expect(calendarRepo.applyCalendarVisibility).toHaveBeenCalledTimes(1);
      
      const appliedCalendars = calendarRepo.applyCalendarVisibility.mock.calls[0][0];
      expect(appliedCalendars).toHaveLength(3);
      appliedCalendars.forEach(calendar => {
        expect(calendar.isVisible).toBe(false);
      });
    });

    it('should handle empty calendar list', async () => {
      // Arrange
      calendarRepo.getCurrentCalendarStates.mockResolvedValue([]);

      // Act
      await useCase.execute();

      // Assert
      expect(calendarRepo.getCurrentCalendarStates).toHaveBeenCalledTimes(1);
      expect(calendarRepo.applyCalendarVisibility).toHaveBeenCalledWith([]);
    });

    it('should handle calendars that are already hidden', async () => {
      // Arrange
      const mockCalendars = [
        new Calendar({ email: 'cal1@example.com', name: 'Calendar 1', isVisible: false }),
        new Calendar({ email: 'cal2@example.com', name: 'Calendar 2', isVisible: false })
      ];
      calendarRepo.getCurrentCalendarStates.mockResolvedValue(mockCalendars);

      // Act
      await useCase.execute();

      // Assert
      const appliedCalendars = calendarRepo.applyCalendarVisibility.mock.calls[0][0];
      appliedCalendars.forEach(calendar => {
        expect(calendar.isVisible).toBe(false);
      });
    });

    it('should preserve original calendar objects (immutability)', async () => {
      // Arrange
      const mockCalendars = [
        new Calendar({ email: 'test@example.com', name: 'Test Calendar', isVisible: true })
      ];
      calendarRepo.getCurrentCalendarStates.mockResolvedValue(mockCalendars);

      // Act
      await useCase.execute();

      // Assert
      // Original calendars should remain unchanged
      expect(mockCalendars[0].isVisible).toBe(true);
      
      // Applied calendars should be hidden
      const appliedCalendars = calendarRepo.applyCalendarVisibility.mock.calls[0][0];
      expect(appliedCalendars[0].isVisible).toBe(false);
      expect(appliedCalendars[0]).not.toBe(mockCalendars[0]); // Different instances
    });

    it('should throw error when getCurrentCalendarStates fails', async () => {
      // Arrange
      const error = new Error('Repository error');
      calendarRepo.getCurrentCalendarStates.mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.execute()).rejects.toThrow('Failed to clear calendars: Repository error');
      expect(calendarRepo.applyCalendarVisibility).not.toHaveBeenCalled();
    });

    it('should throw error when applyCalendarVisibility fails', async () => {
      // Arrange
      const mockCalendars = [
        new Calendar({ email: 'test@example.com', name: 'Test Calendar', isVisible: true })
      ];
      calendarRepo.getCurrentCalendarStates.mockResolvedValue(mockCalendars);
      const error = new Error('Apply error');
      calendarRepo.applyCalendarVisibility.mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.execute()).rejects.toThrow('Failed to clear calendars: Apply error');
      expect(calendarRepo.getCurrentCalendarStates).toHaveBeenCalledTimes(1);
    });

    it('should handle unknown errors gracefully', async () => {
      // Arrange
      calendarRepo.getCurrentCalendarStates.mockRejectedValue('string error');

      // Act & Assert
      await expect(useCase.execute()).rejects.toThrow('Failed to clear calendars: Unknown error');
    });

    it('should work with single calendar', async () => {
      // Arrange
      const mockCalendars = [
        new Calendar({ email: 'single@example.com', name: 'Single Calendar', isVisible: true })
      ];
      calendarRepo.getCurrentCalendarStates.mockResolvedValue(mockCalendars);

      // Act
      await useCase.execute();

      // Assert
      expect(calendarRepo.applyCalendarVisibility).toHaveBeenCalledTimes(1);
      const appliedCalendars = calendarRepo.applyCalendarVisibility.mock.calls[0][0];
      expect(appliedCalendars).toHaveLength(1);
      expect(appliedCalendars[0].isVisible).toBe(false);
      expect(appliedCalendars[0].email).toBe('single@example.com');
    });

    it('should handle large number of calendars', async () => {
      // Arrange
      const mockCalendars = Array.from({ length: 100 }, (_, i) => 
        new Calendar({ 
          email: `calendar${i}@example.com`, 
          name: `Calendar ${i}`, 
          isVisible: i % 2 === 0 
        })
      );
      calendarRepo.getCurrentCalendarStates.mockResolvedValue(mockCalendars);

      // Act
      await useCase.execute();

      // Assert
      const appliedCalendars = calendarRepo.applyCalendarVisibility.mock.calls[0][0];
      expect(appliedCalendars).toHaveLength(100);
      appliedCalendars.forEach(calendar => {
        expect(calendar.isVisible).toBe(false);
      });
    });
  });
});