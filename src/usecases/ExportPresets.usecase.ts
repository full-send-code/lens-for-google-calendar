import { PresetRepository, CalendarPreset } from '../core';

/**
 * Interface for preset export data structure.
 */
export interface PresetExportData {
  [presetName: string]: string[];
}

/**
 * Use case for exporting all calendar presets to JSON format.
 * 
 * This use case retrieves all presets from storage and formats them
 * as a JSON-serializable object for backup or sharing purposes.
 */
export class ExportPresetsUseCase {
  constructor(private readonly presetRepository: PresetRepository) {}

  /**
   * Executes the export presets operation.
   * 
   * @returns Promise that resolves to a JSON string containing all presets
   * @throws Error if the operation fails
   */
  async execute(): Promise<string> {
    try {
      // Get all presets from storage
      const presets = await this.presetRepository.getAllPresets();
      
      // Convert presets to export format
      const exportData: PresetExportData = {};
      
      for (const preset of presets) {
        exportData[preset.name] = preset.calendarEmails;
      }
      
      // Convert to JSON string with formatting for readability
      return JSON.stringify(exportData, null, 2);
      
    } catch (error) {
      throw new Error(`Failed to export presets: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Executes the export presets operation and returns the raw data object.
   * 
   * @returns Promise that resolves to the preset data object
   * @throws Error if the operation fails
   */
  async executeRaw(): Promise<PresetExportData> {
    try {
      // Get all presets from storage
      const presets = await this.presetRepository.getAllPresets();
      
      // Convert presets to export format
      const exportData: PresetExportData = {};
      
      for (const preset of presets) {
        exportData[preset.name] = preset.calendarEmails;
      }
      
      return exportData;
      
    } catch (error) {
      throw new Error(`Failed to export presets: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}