/**
 * Error thrown when a requested calendar is not found.
 */
export class CalendarNotFoundError extends Error {
  constructor(calendarEmail: string) {
    super(`Calendar with email '${calendarEmail}' not found`);
    this.name = 'CalendarNotFoundError';
  }
}