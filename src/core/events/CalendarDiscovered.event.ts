/**
 * Calendar Discovered Event
 * Fired when a new calendar is discovered in Google Calendar
 */

import { DomainEvent } from './DomainEvent.interface';
import { Calendar } from '../entities/Calendar.entity';

export interface CalendarDiscoveredEvent extends DomainEvent {
  eventType: 'CalendarDiscovered';
  calendar: Calendar;
}