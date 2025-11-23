/**
 * Calendars Applied Event
 * Fired when multiple calendar visibility changes are applied
 */

import { DomainEvent } from './DomainEvent.interface';
import { Calendar } from '../entities/Calendar.entity';

export interface CalendarsAppliedEvent extends DomainEvent {
  eventType: 'CalendarsApplied';
  calendars: Calendar[];
  changeCount: number;
}