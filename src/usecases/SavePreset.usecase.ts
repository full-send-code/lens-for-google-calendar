/**
 * Save Preset Use Case
 * 
 * Business logic for saving a calendar preset with current calendar states.
 * Can create new presets or update existing ones.
 */

import type { CalendarRepository, PresetRepository } from '../core/repositories';
import { CalendarPreset } from '../core/entities';
import logger from '../infrastructure/logger';

/**
 * Parameters for saving a preset
 */
export interface SavePresetParams {
  name: string;
  overwrite?: boolean;
}

/**
 * Use case for saving calendar presets
 * 
 * This use case:
 * 1. Gets the current calendar visibility states
 * 2. Creates or updates a preset with the visible calendar emails
 * 3. Saves the preset to storage
 * 4. Handles preset name conflicts based on overwrite flag
 */
export class SavePresetUseCase {
  constructor(
    private calendarRepository: CalendarRepository,
    private presetRepository: PresetRepository
  ) {}

  /**
   * Execute the save preset operation
   * 
   * @param params - Save preset parameters including name and overwrite flag
   * @returns Promise that resolves when preset is saved
   * @throws Error if preset name exists and overwrite is false
   * @throws Error if no calendars are currently visible
   */
  async execute(params: SavePresetParams): Promise<CalendarPreset> {
    const { name, overwrite = false } = params;
    
    logger.info(`💾 Save Preset: Starting save operation for preset: "${name}" (overwrite: ${overwrite})`);

    // Validate preset name
    if (!name.trim()) {
      logger.error('💾 Save Preset: Preset name validation failed - empty name');
      throw new Error('Preset name cannot be empty');
    }
    
    logger.debug(`💾 Save Preset: Preset name validation passed: "${name}"`);

    // Check if preset already exists
    logger.debug('💾 Save Preset: Checking for existing preset with same name...');
    const existingPreset = await this.presetRepository.loadPreset(name);
    
    if (existingPreset) {
      logger.info(`💾 Save Preset: Found existing preset "${name}" with ${existingPreset.calendarEmails.length} calendars`);
      if (!overwrite) {
        logger.error(`💾 Save Preset: Cannot save - preset "${name}" exists and overwrite=false`);
        throw new Error(`Preset "${name}" already exists. Use overwrite option to update it.`);
      }
      logger.info(`💾 Save Preset: Will overwrite existing preset "${name}"`);
    } else {
      logger.info(`💾 Save Preset: No existing preset found - will create new preset "${name}"`);
    }

    // Get current calendar states
    logger.debug('💾 Save Preset: Getting current calendar states...');
    const currentCalendars = await this.calendarRepository.getCurrentCalendarStates();
    logger.info(`💾 Save Preset: Retrieved ${currentCalendars.length} total calendars`);
    
    const visibleCalendars = currentCalendars.filter(calendar => calendar.isVisible);
    logger.info(`💾 Save Preset: Found ${visibleCalendars.length} visible calendars out of ${currentCalendars.length} total`);
    
    // Log visible calendar details
    if (visibleCalendars.length > 0) {
      const visibleEmails = visibleCalendars.map(cal => cal.email);
      logger.debug(`💾 Save Preset: Visible calendars: ${visibleEmails.join(', ')}`);
    }

    // Validate that at least one calendar is visible
    if (visibleCalendars.length === 0) {
      logger.error('💾 Save Preset: Cannot save - no calendars are currently visible');
      throw new Error('Cannot save preset: no calendars are currently visible');
    }

    // Extract emails from visible calendars
    const calendarEmails = visibleCalendars.map(calendar => calendar.email);
    logger.info(`💾 Save Preset: Preparing to save preset with ${calendarEmails.length} calendars`);

    // Create the preset
    const preset = new CalendarPreset(name, calendarEmails);
    logger.debug(`💾 Save Preset: Created preset object: "${name}" with calendars: ${calendarEmails.join(', ')}`);

    // Save the preset
    logger.debug('💾 Save Preset: Saving preset to repository...');
    await this.presetRepository.savePreset(preset);
    
    const action = existingPreset ? 'updated' : 'created';
    logger.info(`💾 Save Preset: Successfully ${action} preset "${name}" with ${calendarEmails.length} calendars`);
    logger.debug(`💾 Save Preset: Final preset calendars: ${calendarEmails.join(', ')}`);

    return preset;
  }
}