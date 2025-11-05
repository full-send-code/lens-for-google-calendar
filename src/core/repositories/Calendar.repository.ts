/**
 * Calendar Repository Interface
 * Contract for calendar discovery and visibility management
 */

import { Calendar } from '../entities/Calendar.entity';

export interface CalendarRepository {
  /**
   * Discover all calendars available in Google Calendar
   */
  discoverCalendars(): Promise<Calendar[]>;

  /**
   * Apply visibility changes to calendars in Google Calendar
   */
  applyCalendarVisibility(calendars: Calendar[]): Promise<void>;

  /**
   * Get current visibility state of all calendars
   */
  getCurrentCalendarStates(): Promise<Calendar[]>;
}