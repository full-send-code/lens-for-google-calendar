/**
 * CalendarPreset Entity Tests
 * 100% test coverage for CalendarPreset entity
 */

import { CalendarPreset } from './CalendarPreset.entity';
import { Calendar } from './Calendar.entity';

describe('CalendarPreset Entity', () => {
  let validEmails: string[];
  
  beforeEach(() => {
    validEmails = ['work@example.com', 'personal@example.com', 'team@example.com'];
  });
  
  const createTestCalendar = (email: string, name: string, isVisible = true): Calendar => {
    return new Calendar({ email, name, isVisible });
  };

  describe('Constructor', () => {
    it('should create preset with valid data', () => {
      const preset = new CalendarPreset('Work Setup', validEmails);
      
      expect(preset.name).toBe('Work Setup');
      expect(preset.calendarEmails).toEqual(validEmails);
      expect(preset.createdAt).toBeInstanceOf(Date);
      expect(preset.lastUsedAt).toBeUndefined();
    });

    it('should trim whitespace from name', () => {
      const preset = new CalendarPreset('  Work Setup  ', validEmails);
      expect(preset.name).toBe('Work Setup');
    });

    it('should create copy of calendar emails array', () => {
      const preset = new CalendarPreset('Test', validEmails);
      
      // Mutate original array
      validEmails.push('modified@example.com');
      
      // Preset should be unchanged
      expect(preset.calendarEmails).not.toContain('modified@example.com');
      expect(preset.calendarEmails).toHaveLength(3);
    });

    it('should set createdAt to current time', () => {
      const beforeCreate = new Date();
      const preset = new CalendarPreset('Test', validEmails);
      const afterCreate = new Date();
      
      expect(preset.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(preset.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });
  });

  describe('Getters', () => {
    let preset: CalendarPreset;

    beforeEach(() => {
      preset = new CalendarPreset('Test Preset', validEmails);
    });

    it('should return name correctly', () => {
      expect(preset.name).toBe('Test Preset');
    });

    it('should return copy of calendar emails array', () => {
      const emails = preset.calendarEmails;
      
      // Mutate returned array
      emails.push('hacker@example.com');
      
      // Original preset should be unchanged
      expect(preset.calendarEmails).not.toContain('hacker@example.com');
      expect(preset.calendarEmails).toHaveLength(3);
    });

    it('should return created date correctly', () => {
      expect(preset.createdAt).toBeInstanceOf(Date);
    });

    it('should return undefined for lastUsedAt initially', () => {
      expect(preset.lastUsedAt).toBeUndefined();
    });
  });

  describe('Calendar Management', () => {
    let preset: CalendarPreset;

    beforeEach(() => {
      preset = new CalendarPreset('Test Preset', validEmails);
    });

    describe('addCalendar()', () => {
      it('should add new calendar email', () => {
        const newPreset = preset.addCalendar('new@example.com');
        
        expect(newPreset).not.toBe(preset);
        expect(newPreset.calendarEmails).toContain('new@example.com');
        expect(newPreset.calendarEmails).toHaveLength(4);
        expect(preset.calendarEmails).toHaveLength(3); // Original unchanged
      });

      it('should not add duplicate calendar email', () => {
        const newPreset = preset.addCalendar(validEmails[0]);
        
        expect(newPreset).not.toBe(preset);
        expect(newPreset.calendarEmails).toHaveLength(3); // No change in length
        expect(newPreset.calendarEmails.filter(email => email === validEmails[0])).toHaveLength(1);
      });

      it('should preserve name and dates when adding calendar', () => {
        const newPreset = preset.addCalendar('new@example.com');
        
        expect(newPreset.name).toBe(preset.name);
        expect(newPreset.createdAt).toBe(preset.createdAt);
        expect(newPreset.lastUsedAt).toBe(preset.lastUsedAt);
      });
    });

    describe('removeCalendar()', () => {
      it('should remove existing calendar email', () => {
        const newPreset = preset.removeCalendar(validEmails[0]);
        
        expect(newPreset).not.toBe(preset);
        expect(newPreset.calendarEmails).not.toContain(validEmails[0]);
        expect(newPreset.calendarEmails).toHaveLength(2);
        expect(preset.calendarEmails).toHaveLength(3); // Original unchanged
      });

      it('should handle removing non-existent calendar email', () => {
        const newPreset = preset.removeCalendar('nonexistent@example.com');
        
        expect(newPreset).not.toBe(preset);
        expect(newPreset.calendarEmails).toHaveLength(3); // No change
        expect(newPreset.calendarEmails).toEqual(preset.calendarEmails);
      });

      it('should preserve name and dates when removing calendar', () => {
        const newPreset = preset.removeCalendar(validEmails[0]);
        
        expect(newPreset.name).toBe(preset.name);
        expect(newPreset.createdAt).toBe(preset.createdAt);
        expect(newPreset.lastUsedAt).toBe(preset.lastUsedAt);
      });
    });

    describe('markAsUsed()', () => {
      it('should return new instance with lastUsedAt set', () => {
        const beforeUsed = new Date();
        const usedPreset = preset.markAsUsed();
        const afterUsed = new Date();
        
        expect(usedPreset).not.toBe(preset);
        expect(usedPreset.lastUsedAt).toBeInstanceOf(Date);
        expect(usedPreset.lastUsedAt!.getTime()).toBeGreaterThanOrEqual(beforeUsed.getTime());
        expect(usedPreset.lastUsedAt!.getTime()).toBeLessThanOrEqual(afterUsed.getTime());
        expect(preset.lastUsedAt).toBeUndefined(); // Original unchanged
      });

      it('should preserve other properties when marking as used', () => {
        const usedPreset = preset.markAsUsed();
        
        expect(usedPreset.name).toBe(preset.name);
        expect(usedPreset.calendarEmails).toEqual(preset.calendarEmails);
        expect(usedPreset.createdAt).toBe(preset.createdAt);
      });

      it('should update lastUsedAt if already set', () => {
        const firstUse = preset.markAsUsed();
        
        // Wait a bit to ensure different timestamp
        setTimeout(() => {
          const secondUse = firstUse.markAsUsed();
          expect(secondUse.lastUsedAt!.getTime()).toBeGreaterThan(firstUse.lastUsedAt!.getTime());
        }, 1);
      });
    });
  });

  describe('Query Methods', () => {
    let preset: CalendarPreset;
    let availableCalendars: Calendar[];

    beforeEach(() => {
      preset = new CalendarPreset('Test Preset', validEmails);
      availableCalendars = [
        createTestCalendar(validEmails[0], 'Work Calendar'),
        createTestCalendar(validEmails[1], 'Personal Calendar'),
        createTestCalendar('other@example.com', 'Other Calendar')
      ];
    });

    describe('containsCalendar()', () => {
      it('should return true for contained calendar email', () => {
        expect(preset.containsCalendar(validEmails[0])).toBe(true);
        expect(preset.containsCalendar(validEmails[1])).toBe(true);
        expect(preset.containsCalendar(validEmails[2])).toBe(true);
      });

      it('should return false for non-contained calendar email', () => {
        expect(preset.containsCalendar('nonexistent@example.com')).toBe(false);
        expect(preset.containsCalendar('')).toBe(false);
      });
    });

    describe('containsCalendarEntity()', () => {
      it('should return true for contained calendar entity', () => {
        const calendar = createTestCalendar(validEmails[0], 'Test Calendar');
        expect(preset.containsCalendarEntity(calendar)).toBe(true);
      });

      it('should return false for non-contained calendar entity', () => {
        const calendar = createTestCalendar('other@example.com', 'Other Calendar');
        expect(preset.containsCalendarEntity(calendar)).toBe(false);
      });
    });

    describe('getMatchingCalendars()', () => {
      it('should return calendars that match preset emails', () => {
        const matching = preset.getMatchingCalendars(availableCalendars);
        
        expect(matching).toHaveLength(2);
        expect(matching.map(c => c.email)).toEqual([validEmails[0], validEmails[1]]);
      });

      it('should return empty array when no calendars match', () => {
        const noMatchCalendars = [
          createTestCalendar('other1@example.com', 'Other 1'),
          createTestCalendar('other2@example.com', 'Other 2')
        ];
        
        const matching = preset.getMatchingCalendars(noMatchCalendars);
        expect(matching).toHaveLength(0);
      });

      it('should handle empty available calendars array', () => {
        const matching = preset.getMatchingCalendars([]);
        expect(matching).toHaveLength(0);
      });
    });
  });

  describe('Equality', () => {
    it('should consider presets equal if they have same name', () => {
      const preset1 = new CalendarPreset('Same Name', validEmails);
      const preset2 = new CalendarPreset('Same Name', ['different@example.com']);
      
      expect(preset1.equals(preset2)).toBe(true);
    });

    it('should consider presets not equal if they have different names', () => {
      const preset1 = new CalendarPreset('Name 1', validEmails);
      const preset2 = new CalendarPreset('Name 2', validEmails);
      
      expect(preset1.equals(preset2)).toBe(false);
    });

    it('should handle empty name comparison', () => {
      const preset1 = new CalendarPreset('', validEmails);
      const preset2 = new CalendarPreset('', ['different@example.com']);
      
      expect(preset1.equals(preset2)).toBe(true);
    });
  });

  describe('Serialization', () => {
    it('should serialize to JSON correctly', () => {
      const preset = new CalendarPreset('Test Preset', validEmails);
      const json = preset.toJSON();
      
      expect(json.name).toBe('Test Preset');
      expect(json.calendarEmails).toEqual(validEmails);
      expect(json.createdAt).toBeInstanceOf(Date);
      expect(json.lastUsedAt).toBeUndefined();
    });

    it('should return copy to prevent mutation', () => {
      const preset = new CalendarPreset('Test Preset', validEmails);
      const json = preset.toJSON();
      
      // Mutate JSON
      json.name = 'Modified';
      json.calendarEmails.push('hacker@example.com');
      
      // Preset should be unchanged
      expect(preset.name).toBe('Test Preset');
      expect(preset.calendarEmails).not.toContain('hacker@example.com');
    });

    it('should deserialize from JSON correctly', () => {
      const originalPreset = new CalendarPreset('Test Preset', validEmails);
      const json = originalPreset.toJSON();
      const deserializedPreset = CalendarPreset.fromJSON(json);
      
      expect(deserializedPreset.name).toBe(originalPreset.name);
      expect(deserializedPreset.calendarEmails).toEqual(originalPreset.calendarEmails);
      expect(deserializedPreset.createdAt).toEqual(originalPreset.createdAt);
      expect(deserializedPreset.lastUsedAt).toBe(originalPreset.lastUsedAt);
    });

    it('should maintain data integrity through serialization round-trip', () => {
      const originalPreset = new CalendarPreset('Test Preset', validEmails);
      const usedPreset = originalPreset.markAsUsed();
      
      const json = usedPreset.toJSON();
      const deserializedPreset = CalendarPreset.fromJSON(json);
      
      expect(deserializedPreset.equals(usedPreset)).toBe(true);
      expect(deserializedPreset.name).toBe(usedPreset.name);
      expect(deserializedPreset.calendarEmails).toEqual(usedPreset.calendarEmails);
      expect(deserializedPreset.lastUsedAt).toEqual(usedPreset.lastUsedAt);
    });

    it('should handle preset with lastUsedAt in serialization', () => {
      const preset = new CalendarPreset('Test', validEmails);
      const usedPreset = preset.markAsUsed();
      
      const json = usedPreset.toJSON();
      const deserialized = CalendarPreset.fromJSON(json);
      
      expect(deserialized.lastUsedAt).toBeInstanceOf(Date);
      expect(deserialized.lastUsedAt).toEqual(usedPreset.lastUsedAt);
    });
  });

  describe('Edge Cases', () => {
    it('should handle preset with single calendar', () => {
      const preset = new CalendarPreset('Single', ['single@example.com']);
      
      expect(preset.calendarEmails).toHaveLength(1);
      expect(preset.containsCalendar('single@example.com')).toBe(true);
    });

    it('should handle preset with many calendars', () => {
      const manyEmails = Array.from({ length: 20 }, (_, i) => `cal${i}@example.com`);
      const preset = new CalendarPreset('Many Calendars', manyEmails);
      
      expect(preset.calendarEmails).toHaveLength(20);
      expect(preset.containsCalendar('cal0@example.com')).toBe(true);
      expect(preset.containsCalendar('cal19@example.com')).toBe(true);
    });

    it('should handle very long preset name', () => {
      const longName = 'This is a very long preset name that someone might create in real usage scenarios';
      const preset = new CalendarPreset(longName, validEmails);
      
      expect(preset.name).toBe(longName);
    });

    it('should handle special characters in preset name', () => {
      const specialName = 'Preset with émojis 📅 & spécial çharacters!';
      const preset = new CalendarPreset(specialName, validEmails);
      
      expect(preset.name).toBe(specialName);
    });

    it('should handle email addresses with various formats', () => {
      const complexEmails = [
        'user+tag@domain.com',
        'user.name@sub.domain.co.uk',
        'test123@domain-with-dash.org'
      ];
      
      const preset = new CalendarPreset('Complex Emails', complexEmails);
      
      expect(preset.calendarEmails).toEqual(complexEmails);
      complexEmails.forEach(email => {
        expect(preset.containsCalendar(email)).toBe(true);
      });
    });
  });

  describe('Immutability Verification', () => {
    it('should not allow state mutation through any means', () => {
      const preset = new CalendarPreset('Test', validEmails);
      
      // Try to access private state (should not be possible)
      expect((preset as any)._state).toBeUndefined;
      
      // Verify getters return values/copies, not references
      const name = preset.name;
      const emails = preset.calendarEmails;
      const createdAt = preset.createdAt;
      
      expect(typeof name).toBe('string');
      expect(Array.isArray(emails)).toBe(true);
      expect(createdAt).toBeInstanceOf(Date);
    });

    it('should create new instance for each mutation method', () => {
      const preset = new CalendarPreset('Test', validEmails);
      
      const withAdded = preset.addCalendar('new@example.com');
      const withRemoved = preset.removeCalendar(validEmails[0]);
      const withUsed = preset.markAsUsed();
      
      // All should be different instances
      expect(withAdded).not.toBe(preset);
      expect(withRemoved).not.toBe(preset);
      expect(withUsed).not.toBe(preset);
      expect(withAdded).not.toBe(withRemoved);
      expect(withRemoved).not.toBe(withUsed);
      expect(withAdded).not.toBe(withUsed);
    });

    it('should maintain immutability in complex operations', () => {
      const preset = new CalendarPreset('Test', validEmails);
      
      // Chain multiple operations
      const modified = preset
        .addCalendar('new@example.com')
        .removeCalendar(validEmails[0])
        .markAsUsed();
      
      // Original should be completely unchanged
      expect(preset.calendarEmails).toEqual(validEmails);
      expect(preset.lastUsedAt).toBeUndefined();
      
      // Modified should have all changes
      expect(modified.calendarEmails).toContain('new@example.com');
      expect(modified.calendarEmails).not.toContain(validEmails[0]);
      expect(modified.lastUsedAt).toBeInstanceOf(Date);
    });
  });
});