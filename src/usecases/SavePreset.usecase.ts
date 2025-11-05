/**
 * Save Preset Use Case
 * 
 * Business logic for saving a calendar preset with current calendar states.
 * Can create new presets or update existing ones.
 */

import type { CalendarRepository, PresetRepository } from '../core/repositories';
import { CalendarPreset } from '../core/entities';

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

    // Validate preset name
    if (!name.trim()) {
      throw new Error('Preset name cannot be empty');
    }

    // Check if preset already exists
    const existingPreset = await this.presetRepository.loadPreset(name);
    if (existingPreset && !overwrite) {
      throw new Error(`Preset "${name}" already exists. Use overwrite option to update it.`);
    }

    // Get current calendar states
    const currentCalendars = await this.calendarRepository.getCurrentCalendarStates();
    const visibleCalendars = currentCalendars.filter(calendar => calendar.isVisible);

    // Validate that at least one calendar is visible
    if (visibleCalendars.length === 0) {
      throw new Error('Cannot save preset: no calendars are currently visible');
    }

    // Extract emails from visible calendars
    const calendarEmails = visibleCalendars.map(calendar => calendar.email);

    // Create the preset
    const preset = new CalendarPreset(name, calendarEmails);

    // Save the preset
    await this.presetRepository.savePreset(preset);

    return preset;
  }
}