import { CalendarRepository, PresetRepository, CalendarPreset, Calendar, PresetNotFoundError } from '../core';
import logger from '../infrastructure/logger';

/**
 * Use case for applying a calendar preset to the current calendar view.
 * 
 * This use case loads a preset by name, applies the calendar visibility settings
 * from the preset, and marks the preset as recently used.
 */
export class ApplyPresetUseCase {
  constructor(
    private readonly calendarRepository: CalendarRepository,
    private readonly presetRepository: PresetRepository
  ) {}

  /**
   * Executes the apply preset operation.
   * 
   * @param presetName - The name of the preset to apply
   * @returns Promise that resolves when the preset has been applied
   * @throws PresetNotFoundError if the preset name is not found
   * @throws Error if the operation fails
   */
  async execute(presetName: string): Promise<void> {
    logger.info(`🎯 Apply Preset: Starting apply operation for preset: "${presetName}"`);
    
    if (!presetName || typeof presetName !== 'string') {
      logger.error('🎯 Apply Preset: Validation failed - preset name is missing or not a string');
      throw new Error('Preset name is required and must be a string');
    }
    
    logger.debug(`🎯 Apply Preset: Preset name validation passed: "${presetName}"`);

    try {
      // Load the preset from storage
      logger.debug(`🎯 Apply Preset: Loading preset "${presetName}" from repository...`);
      const preset = await this.presetRepository.loadPreset(presetName);
      
      if (!preset) {
        logger.error(`🎯 Apply Preset: Preset "${presetName}" not found in storage`);
        throw new PresetNotFoundError(presetName);
      }
      
      logger.info(`🎯 Apply Preset: Successfully loaded preset "${presetName}" with ${preset.calendarEmails.length} calendars`);
      logger.debug(`🎯 Apply Preset: Preset calendars: ${preset.calendarEmails.join(', ')}`);
      
      // Get current state of all calendars
      logger.debug('🎯 Apply Preset: Getting current calendar states...');
      const availableCalendars = await this.calendarRepository.getCurrentCalendarStates();
      logger.info(`🎯 Apply Preset: Retrieved ${availableCalendars.length} available calendars`);
      
      const currentlyVisible = availableCalendars.filter(cal => cal.isVisible);
      logger.debug(`🎯 Apply Preset: Currently ${currentlyVisible.length} calendars are visible`);
      
      // Apply preset logic: show calendars in preset, hide others
      logger.debug('🎯 Apply Preset: Applying preset visibility logic...');
      const updatedCalendars = availableCalendars.map(calendar => {
        const shouldBeVisible = preset.containsCalendar(calendar.email);
        const wasVisible = calendar.isVisible;
        
        const updatedCalendar = shouldBeVisible ? calendar.show() : calendar.hide();
        
        if (shouldBeVisible !== wasVisible) {
          const action = shouldBeVisible ? 'show' : 'hide';
          logger.debug(`🎯 Apply Preset: Will ${action} calendar: ${calendar.email}`);
        }
        
        return updatedCalendar;
      });
      
      const toShow = updatedCalendars.filter(cal => cal.isVisible && preset.containsCalendar(cal.email));
      const toHide = updatedCalendars.filter(cal => !cal.isVisible && !preset.containsCalendar(cal.email));
      
      logger.info(`🎯 Apply Preset: Will show ${toShow.length} calendars, hide ${toHide.length} calendars`);
      
      // Apply the visibility changes
      logger.debug('🎯 Apply Preset: Applying calendar visibility changes...');
      await this.calendarRepository.applyCalendarVisibility(updatedCalendars);
      logger.info('🎯 Apply Preset: Calendar visibility changes applied successfully');
      
      // Mark preset as used and save the updated state
      logger.debug('🎯 Apply Preset: Marking preset as recently used...');
      const usedPreset = preset.markAsUsed();
      await this.presetRepository.savePreset(usedPreset);
      logger.debug('🎯 Apply Preset: Updated preset usage timestamp');
      
      logger.info(`🎯 Apply Preset: Successfully applied preset "${presetName}"`);
      
    } catch (error) {
      if (error instanceof PresetNotFoundError) {
        logger.error(`🎯 Apply Preset: Preset not found: "${presetName}"`);
        throw error;
      }
      logger.error(`🎯 Apply Preset: Failed to apply preset "${presetName}":`, error);
      throw new Error(`Failed to apply preset '${presetName}': ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}