import { CalendarRepository, Calendar } from '../core';

/**
 * Use case for clearing (hiding) all calendars in Google Calendar.
 * 
 * This use case retrieves all current calendars and sets their visibility to false,
 * effectively clearing all calendar selections.
 */
export class ClearCalendarsUseCase {
  constructor(private readonly calendarRepository: CalendarRepository) {}

  /**
   * Executes the clear calendars operation.
   * 
   * @returns Promise that resolves when all calendars have been hidden
   * @throws Error if the operation fails
   */
  async execute(): Promise<void> {
    try {
      // Get current state of all calendars
      const currentCalendars = await this.calendarRepository.getCurrentCalendarStates();
      
      // Hide all calendars using domain entity methods
      const hiddenCalendars = currentCalendars.map(calendar => calendar.hide());
      
      // Apply the changes to the repository
      await this.calendarRepository.applyCalendarVisibility(hiddenCalendars);
    } catch (error) {
      throw new Error(`Failed to clear calendars: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}