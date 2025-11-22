/**
 * Domain Event Factory
 * Factory for creating domain events with proper structure
 */

import { Calendar } from '../entities/Calendar.entity';
import { CalendarPreset } from '../entities/CalendarPreset.entity';
import { CalendarDiscoveredEvent } from './CalendarDiscovered.event';
import { CalendarVisibilityChangedEvent } from './CalendarVisibilityChanged.event';
import { CalendarsAppliedEvent } from './CalendarsApplied.event';
import { PresetSavedEvent } from './PresetSaved.event';
import { PresetLoadedEvent } from './PresetLoaded.event';
import { PresetDeletedEvent } from './PresetDeleted.event';
import { PresetAppliedEvent } from './PresetApplied.event';
import { ExtensionInitializedEvent } from './ExtensionInitialized.event';
import { ErrorOccurredEvent } from './ErrorOccurred.event';

export class DomainEventFactory {
  static calendarDiscovered(calendar: Calendar): CalendarDiscoveredEvent {
    return {
      eventType: 'CalendarDiscovered',
      occurredAt: new Date(),
      aggregateId: calendar.email,
      calendar
    };
  }

  static calendarVisibilityChanged(
    calendar: Calendar,
    previousVisibility: boolean
  ): CalendarVisibilityChangedEvent {
    return {
      eventType: 'CalendarVisibilityChanged',
      occurredAt: new Date(),
      aggregateId: calendar.email,
      calendar,
      previousVisibility
    };
  }

  static calendarsApplied(calendars: Calendar[]): CalendarsAppliedEvent {
    return {
      eventType: 'CalendarsApplied',
      occurredAt: new Date(),
      aggregateId: 'calendar-manager',
      calendars,
      changeCount: calendars.length
    };
  }

  static presetSaved(preset: CalendarPreset, isNew: boolean): PresetSavedEvent {
    return {
      eventType: 'PresetSaved',
      occurredAt: new Date(),
      aggregateId: preset.name,
      preset,
      isNew
    };
  }

  static presetLoaded(
    preset: CalendarPreset,
    matchPercentage: number
  ): PresetLoadedEvent {
    return {
      eventType: 'PresetLoaded',
      occurredAt: new Date(),
      aggregateId: preset.name,
      preset,
      matchPercentage
    };
  }

  static presetDeleted(presetName: string): PresetDeletedEvent {
    return {
      eventType: 'PresetDeleted',
      occurredAt: new Date(),
      aggregateId: presetName,
      presetName
    };
  }

  static presetApplied(
    preset: CalendarPreset,
    affectedCalendars: Calendar[]
  ): PresetAppliedEvent {
    return {
      eventType: 'PresetApplied',
      occurredAt: new Date(),
      aggregateId: preset.name,
      preset,
      affectedCalendars
    };
  }

  static extensionInitialized(
    calendarCount: number,
    presetCount: number
  ): ExtensionInitializedEvent {
    return {
      eventType: 'ExtensionInitialized',
      occurredAt: new Date(),
      aggregateId: 'extension',
      calendarCount,
      presetCount
    };
  }

  static errorOccurred(error: Error, context: string): ErrorOccurredEvent {
    return {
      eventType: 'ErrorOccurred',
      occurredAt: new Date(),
      aggregateId: 'error-' + Date.now(),
      error,
      context
    };
  }
}