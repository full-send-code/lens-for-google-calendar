/**
 * Extension Initialized Event
 * Fired when the extension is fully initialized
 */

import { DomainEvent } from './DomainEvent.interface';

export interface ExtensionInitializedEvent extends DomainEvent {
  eventType: 'ExtensionInitialized';
  calendarCount: number;
  presetCount: number;
}