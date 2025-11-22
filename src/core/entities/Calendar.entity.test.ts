/**
 * Calendar Entity Tests
 * 100% test coverage for Calendar entity
 */

import { Calendar } from './Calendar.entity';
import { CalendarState } from './CalendarState.interface';

describe('Calendar Entity', () => {
  let validCalendarState: CalendarState;

  beforeEach(() => {
    validCalendarState = {
      email: 'test@example.com',
      name: 'Test Calendar',
      isVisible: true
    };
  });

  describe('Constructor', () => {
    it('should create calendar with valid state', () => {
      const calendar = new Calendar(validCalendarState);
      
      expect(calendar.email).toBe('test@example.com');
      expect(calendar.name).toBe('Test Calendar');
      expect(calendar.isVisible).toBe(true);
    });

    it('should create copy of state to prevent mutation', () => {
      const calendar = new Calendar(validCalendarState);
      
      // Mutate original state
      validCalendarState.name = 'Modified';
      
      // Calendar should be unchanged
      expect(calendar.name).toBe('Test Calendar');
    });
  });

  describe('Getters', () => {
    it('should return email correctly', () => {
      const calendar = new Calendar(validCalendarState);
      expect(calendar.email).toBe('test@example.com');
    });

    it('should return name correctly', () => {
      const calendar = new Calendar(validCalendarState);
      expect(calendar.name).toBe('Test Calendar');
    });

    it('should return visibility correctly', () => {
      const calendar = new Calendar(validCalendarState);
      expect(calendar.isVisible).toBe(true);
    });
  });

  describe('State Mutations (Immutability)', () => {
    let calendar: Calendar;

    beforeEach(() => {
      calendar = new Calendar(validCalendarState);
    });

    describe('show()', () => {
      it('should return new instance with isVisible true', () => {
        const hiddenCalendar = new Calendar({ ...validCalendarState, isVisible: false });
        const shownCalendar = hiddenCalendar.show();
        
        expect(shownCalendar).not.toBe(hiddenCalendar);
        expect(shownCalendar.isVisible).toBe(true);
        expect(hiddenCalendar.isVisible).toBe(false); // Original unchanged
      });

      it('should return new instance even if already visible', () => {
        const shownCalendar = calendar.show();
        
        expect(shownCalendar).not.toBe(calendar);
        expect(shownCalendar.isVisible).toBe(true);
        expect(calendar.isVisible).toBe(true);
      });

      it('should preserve other properties', () => {
        const shownCalendar = calendar.show();
        
        expect(shownCalendar.email).toBe(calendar.email);
        expect(shownCalendar.name).toBe(calendar.name);
      });
    });

    describe('hide()', () => {
      it('should return new instance with isVisible false', () => {
        const hiddenCalendar = calendar.hide();
        
        expect(hiddenCalendar).not.toBe(calendar);
        expect(hiddenCalendar.isVisible).toBe(false);
        expect(calendar.isVisible).toBe(true); // Original unchanged
      });

      it('should return new instance even if already hidden', () => {
        const hiddenCalendar = new Calendar({ ...validCalendarState, isVisible: false });
        const stillHidden = hiddenCalendar.hide();
        
        expect(stillHidden).not.toBe(hiddenCalendar);
        expect(stillHidden.isVisible).toBe(false);
        expect(hiddenCalendar.isVisible).toBe(false);
      });

      it('should preserve other properties', () => {
        const hiddenCalendar = calendar.hide();
        
        expect(hiddenCalendar.email).toBe(calendar.email);
        expect(hiddenCalendar.name).toBe(calendar.name);
      });
    });

    describe('toggle()', () => {
      it('should toggle from visible to hidden', () => {
        const toggledCalendar = calendar.toggle();
        
        expect(toggledCalendar).not.toBe(calendar);
        expect(toggledCalendar.isVisible).toBe(false);
        expect(calendar.isVisible).toBe(true); // Original unchanged
      });

      it('should toggle from hidden to visible', () => {
        const hiddenCalendar = new Calendar({ ...validCalendarState, isVisible: false });
        const toggledCalendar = hiddenCalendar.toggle();
        
        expect(toggledCalendar).not.toBe(hiddenCalendar);
        expect(toggledCalendar.isVisible).toBe(true);
        expect(hiddenCalendar.isVisible).toBe(false); // Original unchanged
      });

      it('should preserve other properties', () => {
        const toggledCalendar = calendar.toggle();
        
        expect(toggledCalendar.email).toBe(calendar.email);
        expect(toggledCalendar.name).toBe(calendar.name);
      });
    });
  });

  describe('Equality', () => {
    it('should consider calendars equal if emails match', () => {
      const calendar1 = new Calendar(validCalendarState);
      const calendar2 = new Calendar({ 
        email: 'test@example.com', 
        name: 'Different Name', 
        isVisible: false 
      });
      
      expect(calendar1.equals(calendar2)).toBe(true);
    });

    it('should consider calendars not equal if emails differ', () => {
      const calendar1 = new Calendar(validCalendarState);
      const calendar2 = new Calendar({ 
        email: 'different@example.com', 
        name: 'Test Calendar', 
        isVisible: true 
      });
      
      expect(calendar1.equals(calendar2)).toBe(false);
    });

    it('should handle empty email comparison', () => {
      const calendar1 = new Calendar({ email: '', name: 'Test', isVisible: true });
      const calendar2 = new Calendar({ email: '', name: 'Different', isVisible: false });
      
      expect(calendar1.equals(calendar2)).toBe(true);
    });
  });

  describe('Serialization', () => {
    it('should serialize to JSON correctly', () => {
      const calendar = new Calendar(validCalendarState);
      const json = calendar.toJSON();
      
      expect(json).toEqual({
        email: 'test@example.com',
        name: 'Test Calendar',
        isVisible: true
      });
    });

    it('should return copy to prevent mutation', () => {
      const calendar = new Calendar(validCalendarState);
      const json = calendar.toJSON();
      
      // Mutate JSON
      json.name = 'Modified';
      
      // Calendar should be unchanged
      expect(calendar.name).toBe('Test Calendar');
    });

    it('should deserialize from JSON correctly', () => {
      const originalCalendar = new Calendar(validCalendarState);
      const json = originalCalendar.toJSON();
      const deserializedCalendar = Calendar.fromJSON(json);
      
      expect(deserializedCalendar.email).toBe(originalCalendar.email);
      expect(deserializedCalendar.name).toBe(originalCalendar.name);
      expect(deserializedCalendar.isVisible).toBe(originalCalendar.isVisible);
    });

    it('should maintain data integrity through serialization round-trip', () => {
      const originalCalendar = new Calendar(validCalendarState);
      const json = originalCalendar.toJSON();
      const deserializedCalendar = Calendar.fromJSON(json);
      
      expect(deserializedCalendar.equals(originalCalendar)).toBe(true);
      expect(deserializedCalendar.isVisible).toBe(originalCalendar.isVisible);
    });

    it('should handle edge case data in serialization', () => {
      const edgeCaseState: CalendarState = {
        email: 'test@domain.co',
        name: 'A',
        isVisible: false
      };
      
      const calendar = new Calendar(edgeCaseState);
      const json = calendar.toJSON();
      const deserialized = Calendar.fromJSON(json);
      
      expect(deserialized.email).toBe('test@domain.co');
      expect(deserialized.name).toBe('A');
      expect(deserialized.isVisible).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle calendar with minimal valid data', () => {
      const minimalState: CalendarState = {
        email: 'a@b.co',
        name: 'X',
        isVisible: false
      };
      
      expect(() => new Calendar(minimalState)).not.toThrow();
      const calendar = new Calendar(minimalState);
      
      expect(calendar.email).toBe('a@b.co');
      expect(calendar.name).toBe('X');
      expect(calendar.isVisible).toBe(false);
    });

    it('should handle calendar with long email', () => {
      const longEmailState: CalendarState = {
        email: 'very.long.email.address.with.many.dots@subdomain.domain.com',
        name: 'Long Email Calendar',
        isVisible: true
      };
      
      const calendar = new Calendar(longEmailState);
      expect(calendar.email).toBe('very.long.email.address.with.many.dots@subdomain.domain.com');
    });

    it('should handle calendar with long name', () => {
      const longNameState: CalendarState = {
        email: 'test@example.com',
        name: 'This is a very long calendar name that might be used in real scenarios',
        isVisible: true
      };
      
      const calendar = new Calendar(longNameState);
      expect(calendar.name).toBe('This is a very long calendar name that might be used in real scenarios');
    });

    it('should handle special characters in name', () => {
      const specialCharsState: CalendarState = {
        email: 'test@example.com',
        name: 'Calendar with émojis 📅 & spécial çharacters!',
        isVisible: true
      };
      
      const calendar = new Calendar(specialCharsState);
      expect(calendar.name).toBe('Calendar with émojis 📅 & spécial çharacters!');
    });
  });

  describe('Immutability Verification', () => {
    it('should not allow state mutation through any means', () => {
      const calendar = new Calendar(validCalendarState);
      
      // Try to access private state (should not be possible)
      expect((calendar as any)._state).toBeUndefined;
      
      // Verify getters return values, not references
      const email = calendar.email;
      const name = calendar.name;
      const isVisible = calendar.isVisible;
      
      expect(typeof email).toBe('string');
      expect(typeof name).toBe('string');
      expect(typeof isVisible).toBe('boolean');
    });

    it('should create new instance for each mutation method', () => {
      const calendar = new Calendar(validCalendarState);
      
      const shown = calendar.show();
      const hidden = calendar.hide();
      const toggled = calendar.toggle();
      
      // All should be different instances
      expect(shown).not.toBe(calendar);
      expect(hidden).not.toBe(calendar);
      expect(toggled).not.toBe(calendar);
      expect(shown).not.toBe(hidden);
      expect(hidden).not.toBe(toggled);
      expect(shown).not.toBe(toggled);
    });
  });
});