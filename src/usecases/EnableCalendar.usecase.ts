import { CalendarRepository, Calendar, CalendarNotFoundError } from '../core';
import logger from '../infrastructure/logger';

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
    logger.info(`✅ Enable Calendar: Starting enable operation for: "${calendarEmail}"`);
    
    if (!calendarEmail || typeof calendarEmail !== 'string') {
      logger.error('✅ Enable Calendar: Validation failed - calendar email is missing or not a string');
      throw new Error('Calendar email is required and must be a string');
    }
    
    logger.debug(`✅ Enable Calendar: Email validation passed: "${calendarEmail}"`);

    try {
      // Get current state of all calendars
      logger.debug('✅ Enable Calendar: Getting current calendar states...');
      const currentCalendars = await this.calendarRepository.getCurrentCalendarStates();
      logger.info(`✅ Enable Calendar: Retrieved ${currentCalendars.length} available calendars`);
      
      // Log available calendar emails for debugging
      const availableEmails = currentCalendars.map(cal => cal.email);
      logger.debug(`✅ Enable Calendar: Available calendar emails: ${availableEmails.join(', ')}`);
      
      // Find the target calendar by email
      logger.debug(`✅ Enable Calendar: Searching for calendar with email: "${calendarEmail}"`);
      const targetCalendar = currentCalendars.find(calendar => calendar.email === calendarEmail);
      
      if (!targetCalendar) {
        logger.error(`✅ Enable Calendar: Calendar not found with email: "${calendarEmail}"`);
        logger.debug(`✅ Enable Calendar: Available emails were: ${availableEmails.join(', ')}`);
        throw new CalendarNotFoundError(calendarEmail);
      }
      
      logger.info(`✅ Enable Calendar: Found target calendar - Name: "${targetCalendar.name}", Currently visible: ${targetCalendar.isVisible}`);
      
      if (targetCalendar.isVisible) {
        logger.info(`✅ Enable Calendar: Calendar "${calendarEmail}" is already visible, no change needed`);
      }
      
      // Show the target calendar using domain entity method
      logger.debug(`✅ Enable Calendar: Applying show() to calendar: "${calendarEmail}"`);
      const enabledCalendar = targetCalendar.show();
      
      // Create the complete desired state: all currently visible calendars + the newly enabled one
      logger.debug(`✅ Enable Calendar: Building complete desired state...`);
      const currentlyVisibleCalendars = currentCalendars.filter(cal => cal.isVisible && cal.email !== calendarEmail);
      const desiredCalendars = [...currentlyVisibleCalendars, enabledCalendar];
      
      logger.info(`✅ Enable Calendar: Desired state - ${desiredCalendars.length} calendars visible: ${desiredCalendars.map(c => c.email).join(', ')}`);
      
      // Apply the complete desired state to the repository
      logger.debug(`✅ Enable Calendar: Applying complete visibility change to repository...`);
      await this.calendarRepository.applyCalendarVisibility(desiredCalendars);
      
      logger.info(`✅ Enable Calendar: Successfully enabled calendar: "${calendarEmail}"`);
    } catch (error) {
      if (error instanceof CalendarNotFoundError) {
        logger.error(`✅ Enable Calendar: Calendar not found: "${calendarEmail}"`);
        throw error;
      }
      logger.error(`✅ Enable Calendar: Failed to enable calendar "${calendarEmail}":`, error);
      throw new Error(`Failed to enable calendar '${calendarEmail}': ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}