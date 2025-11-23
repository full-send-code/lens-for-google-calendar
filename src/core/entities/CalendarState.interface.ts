/**
 * Calendar State Interface
 * Simple data structure representing a Google Calendar's essential properties
 */

export interface CalendarState {
  /** Calendar email address (unique identifier) */
  email: string;
  
  /** Display name of the calendar */
  name: string;
  
  /** Whether the calendar is currently visible/checked */
  isVisible: boolean;
}
