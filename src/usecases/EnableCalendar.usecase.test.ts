import { EnableCalendarUseCase } from './EnableCalendar.usecase';
import { CalendarNotFoundError, CalendarRepository, Calendar } from '../core';

// Mock repository
const mockCalendarRepository = (): jest.Mocked<CalendarRepository> => ({
  discoverCalendars: jest.fn(),
  applyCalendarVisibility: jest.fn(),
  getCurrentCalendarStates: jest.fn(),
  getCurrentCalendarStatesFresh: jest.fn()
});

describe('EnableCalendarUseCase', () => {
  let useCase: EnableCalendarUseCase;
  let calendarRepo: jest.Mocked<CalendarRepository>;

  beforeEach(() => {
    calendarRepo = mockCalendarRepository();
    useCase = new EnableCalendarUseCase(calendarRepo);
  });

  describe('execute', () => {
    it('should enable specific calendar by email', async () => {
      // Arrange
      const mockCalendars = [
        new Calendar({ email: 'work@example.com', name: 'Work Calendar', isVisible: false }),
        new Calendar({ email: 'personal@example.com', name: 'Personal Calendar', isVisible: false }),
        new Calendar({ email: 'team@example.com', name: 'Team Calendar', isVisible: true })
      ];
      calendarRepo.getCurrentCalendarStates.mockResolvedValue(mockCalendars);

      // Act
      await useCase.execute('work@example.com');

      // Assert
      expect(calendarRepo.getCurrentCalendarStates).toHaveBeenCalledTimes(1);
      expect(calendarRepo.applyCalendarVisibility).toHaveBeenCalledTimes(1);
      
      const appliedCalendars = calendarRepo.applyCalendarVisibility.mock.calls[0][0];
      expect(appliedCalendars).toHaveLength(1);
      expect(appliedCalendars[0].email).toBe('work@example.com');
      expect(appliedCalendars[0].isVisible).toBe(true);
    });

    it('should enable already visible calendar', async () => {
      // Arrange
      const mockCalendars = [
        new Calendar({ email: 'test@example.com', name: 'Test Calendar', isVisible: true })
      ];
      calendarRepo.getCurrentCalendarStates.mockResolvedValue(mockCalendars);

      // Act
      await useCase.execute('test@example.com');

      // Assert
      const appliedCalendars = calendarRepo.applyCalendarVisibility.mock.calls[0][0];
      expect(appliedCalendars[0].isVisible).toBe(true);
    });

    it('should throw CalendarNotFoundError when calendar email does not exist', async () => {
      // Arrange
      const mockCalendars = [
        new Calendar({ email: 'existing@example.com', name: 'Existing Calendar', isVisible: false })
      ];
      calendarRepo.getCurrentCalendarStates.mockResolvedValue(mockCalendars);

      // Act & Assert
      await expect(useCase.execute('nonexistent@example.com')).rejects.toThrow(CalendarNotFoundError);
      await expect(useCase.execute('nonexistent@example.com')).rejects.toThrow(
        "Calendar with email 'nonexistent@example.com' not found"
      );
      expect(calendarRepo.applyCalendarVisibility).not.toHaveBeenCalled();
    });

    it('should throw error when calendar email is empty', async () => {
      // Act & Assert
      await expect(useCase.execute('')).rejects.toThrow(
        'Calendar email is required and must be a string'
      );
      expect(calendarRepo.getCurrentCalendarStates).not.toHaveBeenCalled();
    });

    it('should throw error when calendar email is null', async () => {
      // Act & Assert
      await expect(useCase.execute(null as any)).rejects.toThrow(
        'Calendar email is required and must be a string'
      );
      expect(calendarRepo.getCurrentCalendarStates).not.toHaveBeenCalled();
    });

    it('should throw error when calendar email is not a string', async () => {
      // Act & Assert
      await expect(useCase.execute(123 as any)).rejects.toThrow(
        'Calendar email is required and must be a string'
      );
      expect(calendarRepo.getCurrentCalendarStates).not.toHaveBeenCalled();
    });

    it('should handle empty calendar list', async () => {
      // Arrange
      calendarRepo.getCurrentCalendarStates.mockResolvedValue([]);

      // Act & Assert
      await expect(useCase.execute('test@example.com')).rejects.toThrow(CalendarNotFoundError);
      expect(calendarRepo.applyCalendarVisibility).not.toHaveBeenCalled();
    });

    it('should preserve original calendar objects (immutability)', async () => {
      // Arrange
      const mockCalendars = [
        new Calendar({ email: 'test@example.com', name: 'Test Calendar', isVisible: false })
      ];
      calendarRepo.getCurrentCalendarStates.mockResolvedValue(mockCalendars);

      // Act
      await useCase.execute('test@example.com');

      // Assert
      // Original calendar should remain unchanged
      expect(mockCalendars[0].isVisible).toBe(false);
      
      // Applied calendar should be enabled
      const appliedCalendars = calendarRepo.applyCalendarVisibility.mock.calls[0][0];
      expect(appliedCalendars[0].isVisible).toBe(true);
      expect(appliedCalendars[0]).not.toBe(mockCalendars[0]); // Different instances
    });

    it('should throw error when getCurrentCalendarStates fails', async () => {
      // Arrange
      const error = new Error('Repository error');
      calendarRepo.getCurrentCalendarStates.mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.execute('test@example.com')).rejects.toThrow(
        "Failed to enable calendar 'test@example.com': Repository error"
      );
      expect(calendarRepo.applyCalendarVisibility).not.toHaveBeenCalled();
    });

    it('should throw error when applyCalendarVisibility fails', async () => {
      // Arrange
      const mockCalendars = [
        new Calendar({ email: 'test@example.com', name: 'Test Calendar', isVisible: false })
      ];
      calendarRepo.getCurrentCalendarStates.mockResolvedValue(mockCalendars);
      const error = new Error('Apply error');
      calendarRepo.applyCalendarVisibility.mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.execute('test@example.com')).rejects.toThrow(
        "Failed to enable calendar 'test@example.com': Apply error"
      );
      expect(calendarRepo.getCurrentCalendarStates).toHaveBeenCalledTimes(1);
    });

    it('should handle unknown errors gracefully', async () => {
      // Arrange
      calendarRepo.getCurrentCalendarStates.mockRejectedValue('string error');

      // Act & Assert
      await expect(useCase.execute('test@example.com')).rejects.toThrow(
        "Failed to enable calendar 'test@example.com': Unknown error"
      );
    });

    it('should propagate CalendarNotFoundError without wrapping', async () => {
      // Arrange
      const mockCalendars = [
        new Calendar({ email: 'other@example.com', name: 'Other Calendar', isVisible: false })
      ];
      calendarRepo.getCurrentCalendarStates.mockResolvedValue(mockCalendars);

      // Act & Assert
      const error = await useCase.execute('missing@example.com').catch(e => e);
      expect(error).toBeInstanceOf(CalendarNotFoundError);
      expect(error.name).toBe('CalendarNotFoundError');
      expect(error.message).toBe("Calendar with email 'missing@example.com' not found");
    });

    it('should handle case-sensitive email matching', async () => {
      // Arrange
      const mockCalendars = [
        new Calendar({ email: 'Test@Example.Com', name: 'Test Calendar', isVisible: false })
      ];
      calendarRepo.getCurrentCalendarStates.mockResolvedValue(mockCalendars);

      // Act & Assert - different case should not match
      await expect(useCase.execute('test@example.com')).rejects.toThrow(CalendarNotFoundError);
      
      // Act & Assert - exact case should match
      await useCase.execute('Test@Example.Com');
      expect(calendarRepo.applyCalendarVisibility).toHaveBeenCalled();
    });

    it('should work with special characters in email', async () => {
      // Arrange
      const specialEmail = 'user+tag@example-domain.co.uk';
      const mockCalendars = [
        new Calendar({ email: specialEmail, name: 'Special Calendar', isVisible: false })
      ];
      calendarRepo.getCurrentCalendarStates.mockResolvedValue(mockCalendars);

      // Act
      await useCase.execute(specialEmail);

      // Assert
      const appliedCalendars = calendarRepo.applyCalendarVisibility.mock.calls[0][0];
      expect(appliedCalendars[0].email).toBe(specialEmail);
      expect(appliedCalendars[0].isVisible).toBe(true);
    });

    it('should handle whitespace in email input', async () => {
      // Arrange
      const mockCalendars = [
        new Calendar({ email: 'test@example.com', name: 'Test Calendar', isVisible: false })
      ];
      calendarRepo.getCurrentCalendarStates.mockResolvedValue(mockCalendars);

      // Act & Assert - should not match due to whitespace
      await expect(useCase.execute('  test@example.com  ')).rejects.toThrow(CalendarNotFoundError);
    });
  });

  describe('CalendarNotFoundError', () => {
    it('should create error with correct message and name', () => {
      const error = new CalendarNotFoundError('test@example.com');
      
      expect(error.message).toBe("Calendar with email 'test@example.com' not found");
      expect(error.name).toBe('CalendarNotFoundError');
      expect(error).toBeInstanceOf(Error);
    });
  });
});