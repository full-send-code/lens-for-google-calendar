import { PresetRepository, CalendarPreset, InvalidPresetDataError } from '../core';

/**
 * Interface for preset import data structure.
 */
export interface PresetImportData {
  [presetName: string]: string[];
}

/**
 * Use case for importing calendar presets from JSON data.
 * 
 * This use case takes JSON preset data and saves each preset to storage,
 * validating the data format and handling conflicts with existing presets.
 */
export class ImportPresetsUseCase {
  constructor(private readonly presetRepository: PresetRepository) {}

  /**
   * Executes the import presets operation.
   * 
   * @param jsonData - The JSON string containing preset data
   * @param overwriteExisting - Whether to overwrite existing presets with same names
   * @returns Promise that resolves to an array of imported preset names
   * @throws InvalidPresetDataError if the JSON data is invalid
   * @throws Error if the operation fails
   */
  async execute(jsonData: string, overwriteExisting: boolean = false): Promise<string[]> {
    if (!jsonData || typeof jsonData !== 'string') {
      throw new InvalidPresetDataError('JSON data is required and must be a string');
    }

    try {
      // Parse the JSON data
      let importData: PresetImportData;
      try {
        importData = JSON.parse(jsonData);
      } catch (parseError) {
        throw new InvalidPresetDataError('Invalid JSON format');
      }

      // Validate the data structure
      if (!importData || typeof importData !== 'object' || Array.isArray(importData)) {
        throw new InvalidPresetDataError('Expected an object with preset names as keys');
      }

      const importedPresets: string[] = [];

      // Process each preset in the import data
      for (const [presetName, calendarEmails] of Object.entries(importData)) {
        // Validate preset name
        if (!presetName || typeof presetName !== 'string') {
          throw new InvalidPresetDataError(`Invalid preset name: ${presetName}`);
        }

        // Validate calendar emails array
        if (!Array.isArray(calendarEmails)) {
          throw new InvalidPresetDataError(`Preset '${presetName}' must have an array of calendar emails`);
        }

        // Validate each calendar email
        for (const email of calendarEmails) {
          if (!email || typeof email !== 'string') {
            throw new InvalidPresetDataError(`Invalid email in preset '${presetName}': ${email}`);
          }
        }

        // Check if preset already exists
        if (!overwriteExisting) {
          const existingPreset = await this.presetRepository.loadPreset(presetName);
          if (existingPreset) {
            continue; // Skip existing preset if not overwriting
          }
        }

        // Create and save the preset
        const preset = new CalendarPreset(presetName, calendarEmails);
        await this.presetRepository.savePreset(preset);
        importedPresets.push(presetName);
      }

      return importedPresets;

    } catch (error) {
      if (error instanceof InvalidPresetDataError) {
        throw error;
      }
      throw new Error(`Failed to import presets: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}