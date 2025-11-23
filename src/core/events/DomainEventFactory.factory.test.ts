/**
 * DomainEventFactory Tests
 * 100% test coverage for domain event factory
 */

import { DomainEventFactory } from './DomainEventFactory.factory';
import { Calendar } from '../entities/Calendar.entity';
import { CalendarPreset } from '../entities/CalendarPreset.entity';

describe('DomainEventFactory', () => {
  const testCalendar = new Calendar({
    email: 'test@example.com',
    name: 'Test Calendar',
    isVisible: true
  });

  const testPreset = new CalendarPreset('Test Preset', ['test@example.com', 'work@example.com']);

  describe('Calendar Events', () => {
    describe('calendarDiscovered()', () => {
      it('should create CalendarDiscoveredEvent with correct properties', () => {
        const event = DomainEventFactory.calendarDiscovered(testCalendar);
        
        expect(event.eventType).toBe('CalendarDiscovered');
        expect(event.calendar).toBe(testCalendar);
        expect(event.aggregateId).toBe(testCalendar.email);
        expect(event.occurredAt).toBeInstanceOf(Date);
      });

      it('should create event with current timestamp', () => {
        const before = new Date();
        const event = DomainEventFactory.calendarDiscovered(testCalendar);
        const after = new Date();
        
        expect(event.occurredAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
        expect(event.occurredAt.getTime()).toBeLessThanOrEqual(after.getTime());
      });
    });

    describe('calendarVisibilityChanged()', () => {
      it('should create CalendarVisibilityChangedEvent with correct properties', () => {
        const previousVisibility = false;
        const event = DomainEventFactory.calendarVisibilityChanged(testCalendar, previousVisibility);
        
        expect(event.eventType).toBe('CalendarVisibilityChanged');
        expect(event.calendar).toBe(testCalendar);
        expect(event.previousVisibility).toBe(false);
        expect(event.aggregateId).toBe(testCalendar.email);
        expect(event.occurredAt).toBeInstanceOf(Date);
      });

      it('should handle visibility change from true to false', () => {
        const event = DomainEventFactory.calendarVisibilityChanged(testCalendar, true);
        expect(event.previousVisibility).toBe(true);
      });

      it('should handle visibility change from false to true', () => {
        const event = DomainEventFactory.calendarVisibilityChanged(testCalendar, false);
        expect(event.previousVisibility).toBe(false);
      });
    });

    describe('calendarsApplied()', () => {
      it('should create CalendarsAppliedEvent with correct properties', () => {
        const calendars = [testCalendar];
        const event = DomainEventFactory.calendarsApplied(calendars);
        
        expect(event.eventType).toBe('CalendarsApplied');
        expect(event.calendars).toBe(calendars);
        expect(event.changeCount).toBe(1);
        expect(event.aggregateId).toBe('calendar-manager');
        expect(event.occurredAt).toBeInstanceOf(Date);
      });

      it('should handle multiple calendars', () => {
        const calendar2 = new Calendar({ email: 'test2@example.com', name: 'Test 2', isVisible: false });
        const calendars = [testCalendar, calendar2];
        const event = DomainEventFactory.calendarsApplied(calendars);
        
        expect(event.calendars).toHaveLength(2);
        expect(event.changeCount).toBe(2);
      });

      it('should handle empty calendars array', () => {
        const event = DomainEventFactory.calendarsApplied([]);
        
        expect(event.calendars).toHaveLength(0);
        expect(event.changeCount).toBe(0);
      });
    });
  });

  describe('Preset Events', () => {
    describe('presetSaved()', () => {
      it('should create PresetSavedEvent for new preset', () => {
        const event = DomainEventFactory.presetSaved(testPreset, true);
        
        expect(event.eventType).toBe('PresetSaved');
        expect(event.preset).toBe(testPreset);
        expect(event.isNew).toBe(true);
        expect(event.aggregateId).toBe(testPreset.name);
        expect(event.occurredAt).toBeInstanceOf(Date);
      });

      it('should create PresetSavedEvent for existing preset update', () => {
        const event = DomainEventFactory.presetSaved(testPreset, false);
        
        expect(event.eventType).toBe('PresetSaved');
        expect(event.preset).toBe(testPreset);
        expect(event.isNew).toBe(false);
        expect(event.aggregateId).toBe(testPreset.name);
      });
    });

    describe('presetLoaded()', () => {
      it('should create PresetLoadedEvent with correct properties', () => {
        const matchPercentage = 85.5;
        const event = DomainEventFactory.presetLoaded(testPreset, matchPercentage);
        
        expect(event.eventType).toBe('PresetLoaded');
        expect(event.preset).toBe(testPreset);
        expect(event.matchPercentage).toBe(85.5);
        expect(event.aggregateId).toBe(testPreset.name);
        expect(event.occurredAt).toBeInstanceOf(Date);
      });

      it('should handle 100% match percentage', () => {
        const event = DomainEventFactory.presetLoaded(testPreset, 100);
        expect(event.matchPercentage).toBe(100);
      });

      it('should handle 0% match percentage', () => {
        const event = DomainEventFactory.presetLoaded(testPreset, 0);
        expect(event.matchPercentage).toBe(0);
      });

      it('should handle decimal match percentages', () => {
        const event = DomainEventFactory.presetLoaded(testPreset, 33.33);
        expect(event.matchPercentage).toBe(33.33);
      });
    });

    describe('presetDeleted()', () => {
      it('should create PresetDeletedEvent with correct properties', () => {
        const presetName = 'Deleted Preset';
        const event = DomainEventFactory.presetDeleted(presetName);
        
        expect(event.eventType).toBe('PresetDeleted');
        expect(event.presetName).toBe(presetName);
        expect(event.aggregateId).toBe(presetName);
        expect(event.occurredAt).toBeInstanceOf(Date);
      });

      it('should handle empty preset name', () => {
        const event = DomainEventFactory.presetDeleted('');
        expect(event.presetName).toBe('');
        expect(event.aggregateId).toBe('');
      });

      it('should handle preset name with special characters', () => {
        const specialName = 'Preset with émojis 📅!';
        const event = DomainEventFactory.presetDeleted(specialName);
        expect(event.presetName).toBe(specialName);
        expect(event.aggregateId).toBe(specialName);
      });
    });

    describe('presetApplied()', () => {
      it('should create PresetAppliedEvent with correct properties', () => {
        const affectedCalendars = [testCalendar];
        const event = DomainEventFactory.presetApplied(testPreset, affectedCalendars);
        
        expect(event.eventType).toBe('PresetApplied');
        expect(event.preset).toBe(testPreset);
        expect(event.affectedCalendars).toBe(affectedCalendars);
        expect(event.aggregateId).toBe(testPreset.name);
        expect(event.occurredAt).toBeInstanceOf(Date);
      });

      it('should handle multiple affected calendars', () => {
        const calendar2 = new Calendar({ email: 'test2@example.com', name: 'Test 2', isVisible: false });
        const affectedCalendars = [testCalendar, calendar2];
        const event = DomainEventFactory.presetApplied(testPreset, affectedCalendars);
        
        expect(event.affectedCalendars).toHaveLength(2);
        expect(event.affectedCalendars).toContain(testCalendar);
        expect(event.affectedCalendars).toContain(calendar2);
      });

      it('should handle no affected calendars', () => {
        const event = DomainEventFactory.presetApplied(testPreset, []);
        
        expect(event.affectedCalendars).toHaveLength(0);
      });
    });
  });

  describe('System Events', () => {
    describe('extensionInitialized()', () => {
      it('should create ExtensionInitializedEvent with correct properties', () => {
        const calendarCount = 5;
        const presetCount = 3;
        const event = DomainEventFactory.extensionInitialized(calendarCount, presetCount);
        
        expect(event.eventType).toBe('ExtensionInitialized');
        expect(event.calendarCount).toBe(5);
        expect(event.presetCount).toBe(3);
        expect(event.aggregateId).toBe('extension');
        expect(event.occurredAt).toBeInstanceOf(Date);
      });

      it('should handle zero counts', () => {
        const event = DomainEventFactory.extensionInitialized(0, 0);
        
        expect(event.calendarCount).toBe(0);
        expect(event.presetCount).toBe(0);
      });

      it('should handle large counts', () => {
        const event = DomainEventFactory.extensionInitialized(100, 50);
        
        expect(event.calendarCount).toBe(100);
        expect(event.presetCount).toBe(50);
      });
    });

    describe('errorOccurred()', () => {
      it('should create ErrorOccurredEvent with correct properties', () => {
        const error = new Error('Test error');
        const context = 'Test context';
        const event = DomainEventFactory.errorOccurred(error, context);
        
        expect(event.eventType).toBe('ErrorOccurred');
        expect(event.error).toBe(error);
        expect(event.context).toBe(context);
        expect(event.aggregateId).toMatch(/^error-\d+$/);
        expect(event.occurredAt).toBeInstanceOf(Date);
      });

    it('should generate unique aggregate IDs for different errors', () => {
      const error1 = new Error('Error 1');
      const error2 = new Error('Error 2');
      
      // Mock Date.now to return different values
      const originalNow = Date.now;
      let callCount = 0;
      Date.now = jest.fn(() => originalNow() + callCount++);
      
      const event1 = DomainEventFactory.errorOccurred(error1, 'Context 1');
      const event2 = DomainEventFactory.errorOccurred(error2, 'Context 2');
      
      // Restore Date.now
      Date.now = originalNow;
      
      expect(event1.aggregateId).not.toBe(event2.aggregateId);
      expect(event1.aggregateId).toMatch(/^error-\d+$/);
      expect(event2.aggregateId).toMatch(/^error-\d+$/);
    });      it('should handle different error types', () => {
        const typeError = new TypeError('Type error');
        const rangeError = new RangeError('Range error');
        
        const event1 = DomainEventFactory.errorOccurred(typeError, 'Type context');
        const event2 = DomainEventFactory.errorOccurred(rangeError, 'Range context');
        
        expect(event1.error).toBe(typeError);
        expect(event2.error).toBe(rangeError);
        expect(event1.context).toBe('Type context');
        expect(event2.context).toBe('Range context');
      });

      it('should handle empty context', () => {
        const error = new Error('Test error');
        const event = DomainEventFactory.errorOccurred(error, '');
        
        expect(event.context).toBe('');
      });

      it('should handle long context strings', () => {
        const error = new Error('Test error');
        const longContext = 'This is a very long context string that might contain detailed information about where and when the error occurred in the system';
        const event = DomainEventFactory.errorOccurred(error, longContext);
        
        expect(event.context).toBe(longContext);
      });
    });
  });

  describe('Event Timestamps', () => {
    it('should create events with timestamps close to current time', () => {
      const before = new Date();
      
      const events = [
        DomainEventFactory.calendarDiscovered(testCalendar),
        DomainEventFactory.calendarVisibilityChanged(testCalendar, false),
        DomainEventFactory.calendarsApplied([testCalendar]),
        DomainEventFactory.presetSaved(testPreset, true),
        DomainEventFactory.presetLoaded(testPreset, 100),
        DomainEventFactory.presetDeleted('Test'),
        DomainEventFactory.presetApplied(testPreset, [testCalendar]),
        DomainEventFactory.extensionInitialized(1, 1),
        DomainEventFactory.errorOccurred(new Error('Test'), 'Test context')
      ];
      
      const after = new Date();
      
      events.forEach((event, index) => {
        expect(event.occurredAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
        expect(event.occurredAt.getTime()).toBeLessThanOrEqual(after.getTime());
      });
    });

    it('should create events with slightly different timestamps when called rapidly', () => {
      const events = [
        DomainEventFactory.calendarDiscovered(testCalendar),
        DomainEventFactory.calendarDiscovered(testCalendar),
        DomainEventFactory.calendarDiscovered(testCalendar)
      ];
      
      // Times should be very close but may differ by milliseconds
      expect(events[0].occurredAt.getTime()).toBeLessThanOrEqual(events[1].occurredAt.getTime());
      expect(events[1].occurredAt.getTime()).toBeLessThanOrEqual(events[2].occurredAt.getTime());
    });
  });

  describe('Event Type Constants', () => {
    it('should use correct event type strings', () => {
      expect(DomainEventFactory.calendarDiscovered(testCalendar).eventType).toBe('CalendarDiscovered');
      expect(DomainEventFactory.calendarVisibilityChanged(testCalendar, false).eventType).toBe('CalendarVisibilityChanged');
      expect(DomainEventFactory.calendarsApplied([testCalendar]).eventType).toBe('CalendarsApplied');
      expect(DomainEventFactory.presetSaved(testPreset, true).eventType).toBe('PresetSaved');
      expect(DomainEventFactory.presetLoaded(testPreset, 100).eventType).toBe('PresetLoaded');
      expect(DomainEventFactory.presetDeleted('Test').eventType).toBe('PresetDeleted');
      expect(DomainEventFactory.presetApplied(testPreset, [testCalendar]).eventType).toBe('PresetApplied');
      expect(DomainEventFactory.extensionInitialized(1, 1).eventType).toBe('ExtensionInitialized');
      expect(DomainEventFactory.errorOccurred(new Error('Test'), 'Test').eventType).toBe('ErrorOccurred');
    });
  });

  describe('Aggregate ID Generation', () => {
    it('should use appropriate aggregate IDs for each event type', () => {
      const calendar = new Calendar({ email: 'test@example.com', name: 'Test', isVisible: true });
      const preset = new CalendarPreset('TestPreset', ['test@example.com']);
      
      expect(DomainEventFactory.calendarDiscovered(calendar).aggregateId).toBe('test@example.com');
      expect(DomainEventFactory.calendarVisibilityChanged(calendar, false).aggregateId).toBe('test@example.com');
      expect(DomainEventFactory.calendarsApplied([calendar]).aggregateId).toBe('calendar-manager');
      expect(DomainEventFactory.presetSaved(preset, true).aggregateId).toBe('TestPreset');
      expect(DomainEventFactory.presetLoaded(preset, 100).aggregateId).toBe('TestPreset');
      expect(DomainEventFactory.presetDeleted('DeletedPreset').aggregateId).toBe('DeletedPreset');
      expect(DomainEventFactory.presetApplied(preset, [calendar]).aggregateId).toBe('TestPreset');
      expect(DomainEventFactory.extensionInitialized(1, 1).aggregateId).toBe('extension');
      expect(DomainEventFactory.errorOccurred(new Error('Test'), 'Test').aggregateId).toMatch(/^error-\d+$/);
    });
  });
});