import { CalendarRepository, Calendar } from '../core';
import logger from '../infrastructure/logger';

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
    logger.info('🧹 Clear Calendars: Starting clear all calendars operation');
    
    try {
      // Get current state of all calendars
      logger.debug('🧹 Clear Calendars: Getting current calendar states...');
      const currentCalendars = await this.calendarRepository.getCurrentCalendarStates();
      logger.info(`🧹 Clear Calendars: Retrieved ${currentCalendars.length} calendars`);
      
      const visibleCalendars = currentCalendars.filter(cal => cal.isVisible);
      logger.info(`🧹 Clear Calendars: Found ${visibleCalendars.length} visible calendars to hide`);
      
      if (visibleCalendars.length > 0) {
        const visibleNames = visibleCalendars.map(cal => cal.name || cal.email).join(', ');
        logger.debug(`🧹 Clear Calendars: Visible calendars to hide: ${visibleNames}`);
      }
      
      // Hide all calendars using domain entity methods
      logger.debug('🧹 Clear Calendars: Applying hide() to all calendars...');
      const hiddenCalendars = currentCalendars.map(calendar => calendar.hide());
      
      // Apply the changes to the repository
      logger.debug('🧹 Clear Calendars: Applying calendar visibility changes...');
      await this.calendarRepository.applyCalendarVisibility(hiddenCalendars);
      
      logger.info(`🧹 Clear Calendars: Successfully cleared all calendars (${hiddenCalendars.length} calendars processed)`);
    } catch (error) {
      logger.error('🧹 Clear Calendars: Failed to clear calendars:', error);
      throw new Error(`Failed to clear calendars: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}