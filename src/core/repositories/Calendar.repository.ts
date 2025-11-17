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
   * Uses cache when available for better performance
   */
  getCurrentCalendarStates(): Promise<Calendar[]>;

  /**
   * Get fresh current state of all calendars (bypasses cache)
   * Use this only when you need guaranteed fresh state
   */
  getCurrentCalendarStatesFresh(): Promise<Calendar[]>;
}