/**
 * Preset Applied Event
 * Fired when a calendar preset is applied to change calendar visibility
 */

import { DomainEvent } from './DomainEvent.interface';
import { CalendarPreset } from '../entities/CalendarPreset.entity';
import { Calendar } from '../entities/Calendar.entity';

export interface PresetAppliedEvent extends DomainEvent {
  eventType: 'PresetApplied';
  preset: CalendarPreset;
  affectedCalendars: Calendar[];
}