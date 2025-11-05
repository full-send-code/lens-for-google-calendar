import { CalendarRepository, Calendar, CalendarNotFoundError } from '../core';

/**
 * Use case for enabling (showing) a specific calendar by email address.
 * 
 * This use case finds a calendar by its email address and sets its visibility to true,
 * while leaving all other calendars unchanged.
 */
export class EnableCalendarUseCase {
  constructor(private readonly calendarRepository: CalendarRepository) {}

  /**
   * Executes the enable calendar operation for a specific calendar.
   * 
   * @param calendarEmail - The email address of the calendar to enable
   * @returns Promise that resolves when the calendar has been enabled
   * @throws CalendarNotFoundError if the calendar email is not found
   * @throws Error if the operation fails
   */
  async execute(calendarEmail: string): Promise<void> {
    if (!calendarEmail || typeof calendarEmail !== 'string') {
      throw new Error('Calendar email is required and must be a string');
    }

    try {
      // Get current state of all calendars
      const currentCalendars = await this.calendarRepository.getCurrentCalendarStates();
      
      // Find the target calendar by email
      const targetCalendar = currentCalendars.find(calendar => calendar.email === calendarEmail);
      
      if (!targetCalendar) {
        throw new CalendarNotFoundError(calendarEmail);
      }
      
      // Show the target calendar using domain entity method
      const enabledCalendar = targetCalendar.show();
      
      // Apply the change to the repository (only the target calendar)
      await this.calendarRepository.applyCalendarVisibility([enabledCalendar]);
    } catch (error) {
      if (error instanceof CalendarNotFoundError) {
        throw error;
      }
      throw new Error(`Failed to enable calendar '${calendarEmail}': ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}