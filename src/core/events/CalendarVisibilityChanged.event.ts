/**
 * Calendar Visibility Changed Event
 * Fired when a calendar's visibility state changes
 */

import { DomainEvent } from './DomainEvent.interface';
import { Calendar } from '../entities/Calendar.entity';

export interface CalendarVisibilityChangedEvent extends DomainEvent {
  eventType: 'CalendarVisibilityChanged';
  calendar: Calendar;
  previousVisibility: boolean;
}