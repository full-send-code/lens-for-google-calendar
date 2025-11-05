/**
 * Preset Saved Event
 * Fired when a calendar preset is saved
 */

import { DomainEvent } from './DomainEvent.interface';
import { CalendarPreset } from '../entities/CalendarPreset.entity';

export interface PresetSavedEvent extends DomainEvent {
  eventType: 'PresetSaved';
  preset: CalendarPreset;
  isNew: boolean;
}