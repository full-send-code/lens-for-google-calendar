import { CalendarNotFoundError, PresetNotFoundError, InvalidPresetDataError } from './index';

describe('Core Domain Errors', () => {
  describe('CalendarNotFoundError', () => {
    it('should create error with correct message and name', () => {
      const calendarEmail = 'test@example.com';
      const error = new CalendarNotFoundError(calendarEmail);
      
      expect(error.message).toBe(`Calendar with email '${calendarEmail}' not found`);
      expect(error.name).toBe('CalendarNotFoundError');
      expect(error).toBeInstanceOf(Error);
    });

    it('should handle special characters in email', () => {
      const calendarEmail = 'user+tag@example-domain.co.uk';
      const error = new CalendarNotFoundError(calendarEmail);
      
      expect(error.message).toBe(`Calendar with email '${calendarEmail}' not found`);
    });

    it('should handle empty email', () => {
      const error = new CalendarNotFoundError('');
      
      expect(error.message).toBe("Calendar with email '' not found");
    });
  });

  describe('PresetNotFoundError', () => {
    it('should create error with correct message and name', () => {
      const presetName = 'work';
      const error = new PresetNotFoundError(presetName);
      
      expect(error.message).toBe(`Preset '${presetName}' not found`);
      expect(error.name).toBe('PresetNotFoundError');
      expect(error).toBeInstanceOf(Error);
    });

    it('should handle special characters in preset name', () => {
      const presetName = 'work-2024 (updated)';
      const error = new PresetNotFoundError(presetName);
      
      expect(error.message).toBe(`Preset '${presetName}' not found`);
    });

    it('should handle empty preset name', () => {
      const error = new PresetNotFoundError('');
      
      expect(error.message).toBe("Preset '' not found");
    });
  });

  describe('InvalidPresetDataError', () => {
    it('should create error with correct message and name', () => {
      const reason = 'Invalid JSON format';
      const error = new InvalidPresetDataError(reason);
      
      expect(error.message).toBe(`Invalid preset data: ${reason}`);
      expect(error.name).toBe('InvalidPresetDataError');
      expect(error).toBeInstanceOf(Error);
    });

    it('should handle complex reason strings', () => {
      const reason = 'Preset "work" must have an array of calendar emails';
      const error = new InvalidPresetDataError(reason);
      
      expect(error.message).toBe(`Invalid preset data: ${reason}`);
    });

    it('should handle empty reason', () => {
      const error = new InvalidPresetDataError('');
      
      expect(error.message).toBe('Invalid preset data: ');
    });
  });

  describe('Error inheritance', () => {
    it('should maintain Error prototype chain for CalendarNotFoundError', () => {
      const error = new CalendarNotFoundError('test@example.com');
      
      expect(error instanceof Error).toBe(true);
      expect(error instanceof CalendarNotFoundError).toBe(true);
      expect(error.constructor.name).toBe('CalendarNotFoundError');
    });

    it('should maintain Error prototype chain for PresetNotFoundError', () => {
      const error = new PresetNotFoundError('test');
      
      expect(error instanceof Error).toBe(true);
      expect(error instanceof PresetNotFoundError).toBe(true);
      expect(error.constructor.name).toBe('PresetNotFoundError');
    });

    it('should maintain Error prototype chain for InvalidPresetDataError', () => {
      const error = new InvalidPresetDataError('test reason');
      
      expect(error instanceof Error).toBe(true);
      expect(error instanceof InvalidPresetDataError).toBe(true);
      expect(error.constructor.name).toBe('InvalidPresetDataError');
    });
  });

  describe('Error serialization', () => {
    it('should have correct properties for CalendarNotFoundError', () => {
      const error = new CalendarNotFoundError('test@example.com');
      
      expect(error.message).toBe("Calendar with email 'test@example.com' not found");
      expect(error.name).toBe('CalendarNotFoundError');
      expect(error.toString()).toContain('CalendarNotFoundError');
      expect(error.toString()).toContain('test@example.com');
    });

    it('should have correct properties for PresetNotFoundError', () => {
      const error = new PresetNotFoundError('work');
      
      expect(error.message).toBe("Preset 'work' not found");
      expect(error.name).toBe('PresetNotFoundError');
      expect(error.toString()).toContain('PresetNotFoundError');
      expect(error.toString()).toContain('work');
    });

    it('should have correct properties for InvalidPresetDataError', () => {
      const error = new InvalidPresetDataError('invalid format');
      
      expect(error.message).toBe('Invalid preset data: invalid format');
      expect(error.name).toBe('InvalidPresetDataError');
      expect(error.toString()).toContain('InvalidPresetDataError');
      expect(error.toString()).toContain('invalid format');
    });
  });
});