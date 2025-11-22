/**
 * Preset Loaded Event
 * Fired when a calendar preset is loaded
 */

import { DomainEvent } from './DomainEvent.interface';
import { CalendarPreset } from '../entities/CalendarPreset.entity';

export interface PresetLoadedEvent extends DomainEvent {
  eventType: 'PresetLoaded';
  preset: CalendarPreset;
  matchPercentage: number;
}