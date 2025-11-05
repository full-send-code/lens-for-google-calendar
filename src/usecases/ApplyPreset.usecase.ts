import { CalendarRepository, PresetRepository, CalendarPreset, Calendar, PresetNotFoundError } from '../core';

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
    if (!presetName || typeof presetName !== 'string') {
      throw new Error('Preset name is required and must be a string');
    }

    try {
      // Load the preset from storage
      const preset = await this.presetRepository.loadPreset(presetName);
      
      if (!preset) {
        throw new PresetNotFoundError(presetName);
      }
      
      // Get current state of all calendars
      const availableCalendars = await this.calendarRepository.getCurrentCalendarStates();
      
      // Apply preset logic: show calendars in preset, hide others
      const updatedCalendars = availableCalendars.map(calendar => {
        return preset.containsCalendar(calendar.email) 
          ? calendar.show() 
          : calendar.hide();
      });
      
      // Apply the visibility changes
      await this.calendarRepository.applyCalendarVisibility(updatedCalendars);
      
      // Mark preset as used and save the updated state
      const usedPreset = preset.markAsUsed();
      await this.presetRepository.savePreset(usedPreset);
      
    } catch (error) {
      if (error instanceof PresetNotFoundError) {
        throw error;
      }
      throw new Error(`Failed to apply preset '${presetName}': ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}