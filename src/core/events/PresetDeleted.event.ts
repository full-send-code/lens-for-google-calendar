/**
 * Preset Deleted Event
 * Fired when a calendar preset is deleted
 */

import { DomainEvent } from './DomainEvent.interface';

export interface PresetDeletedEvent extends DomainEvent {
  eventType: 'PresetDeleted';
  presetName: string;
}