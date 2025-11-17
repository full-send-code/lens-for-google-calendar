import { PresetRepository, CalendarPreset, InvalidPresetDataError } from '../core';
import logger from '../infrastructure/logger';

/**
 * Interface for preset import data structure.
 */
export interface PresetImportData {
  [presetName: string]: string[];
}

/**
 * Result of an import operation showing what was processed.
 */
export interface ImportResult {
  imported: string[];
  overwritten: string[];
  errors: string[];
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
   * @returns Promise that resolves to detailed import results
   * @throws InvalidPresetDataError if the JSON data is invalid
   * @throws Error if the operation fails
   */
  async execute(jsonData: string, overwriteExisting: boolean = false): Promise<ImportResult> {
    logger.info(`📥 Import Presets: Starting import operation (overwrite: ${overwriteExisting})`);
    logger.debug(`📥 Import Presets: JSON data length: ${jsonData?.length || 0} characters`);
    
    if (!jsonData || typeof jsonData !== 'string') {
      logger.error('📥 Import Presets: Validation failed - JSON data is missing or not a string');
      throw new InvalidPresetDataError('JSON data is required and must be a string');
    }

    try {
      // Parse the JSON data
      let importData: PresetImportData;
      logger.debug('📥 Import Presets: Parsing JSON data...');
      try {
        importData = JSON.parse(jsonData);
        logger.debug('📥 Import Presets: JSON parsing successful');
      } catch (parseError) {
        logger.error('📥 Import Presets: JSON parsing failed:', parseError);
        throw new InvalidPresetDataError('Invalid JSON format');
      }

      // Validate the data structure
      logger.debug('📥 Import Presets: Validating data structure...');
      if (!importData || typeof importData !== 'object' || Array.isArray(importData)) {
        logger.error('📥 Import Presets: Invalid data structure - expected object with preset names as keys');
        throw new InvalidPresetDataError('Expected an object with preset names as keys');
      }
      
      const presetNames = Object.keys(importData);
      logger.info(`📥 Import Presets: Found ${presetNames.length} presets to process: ${presetNames.join(', ')}`);

      const importedPresets: string[] = [];
      const overwrittenPresets: string[] = [];
      const errorPresets: string[] = [];

      // Process each preset in the import data
      for (const [presetName, calendarEmails] of Object.entries(importData)) {
        logger.debug(`📥 Import Presets: Processing preset: "${presetName}"`);
        
        try {
          // Validate preset name
          if (!presetName || typeof presetName !== 'string') {
            logger.error(`📥 Import Presets: Invalid preset name: ${presetName}`);
            throw new InvalidPresetDataError(`Invalid preset name: ${presetName}`);
          }

          // Validate calendar emails array
          if (!Array.isArray(calendarEmails)) {
            logger.error(`📥 Import Presets: Preset "${presetName}" does not have array of emails`);
            throw new InvalidPresetDataError(`Preset '${presetName}' must have an array of calendar emails`);
          }
          
          logger.debug(`📥 Import Presets: Preset "${presetName}" has ${calendarEmails.length} calendars`);

          // Validate each calendar email
          for (const email of calendarEmails) {
            if (!email || typeof email !== 'string') {
              logger.error(`📥 Import Presets: Invalid email in preset "${presetName}": ${email}`);
              throw new InvalidPresetDataError(`Invalid email in preset '${presetName}': ${email}`);
            }
          }
          
          logger.debug(`📥 Import Presets: Email validation passed for preset "${presetName}"`);

          // Check if preset already exists to track new vs overwritten
          logger.debug(`📥 Import Presets: Checking if preset "${presetName}" already exists...`);
          const existingPreset = await this.presetRepository.loadPreset(presetName);
          const isOverwrite = !!existingPreset;
          
          if (isOverwrite) {
            logger.debug(`📥 Import Presets: Will overwrite existing preset "${presetName}"`);
          } else {
            logger.debug(`📥 Import Presets: Will create new preset "${presetName}"`);
          }

          // Create and save the preset
          logger.debug(`📥 Import Presets: Creating preset object for "${presetName}" with emails: ${calendarEmails.join(', ')}`);
          const preset = new CalendarPreset(presetName, calendarEmails);
          
          logger.debug(`📥 Import Presets: Saving preset "${presetName}" to repository...`);
          await this.presetRepository.savePreset(preset);
          
          if (isOverwrite) {
            overwrittenPresets.push(presetName);
            logger.info(`📥 Import Presets: Successfully overwritten preset "${presetName}" with ${calendarEmails.length} calendars`);
          } else {
            importedPresets.push(presetName);
            logger.info(`📥 Import Presets: Successfully imported preset "${presetName}" with ${calendarEmails.length} calendars`);
          }
          
        } catch (presetError) {
          errorPresets.push(presetName);
          logger.error(`📥 Import Presets: Failed to import preset "${presetName}":`, presetError);
          
          // Re-throw validation errors, but continue processing others for non-validation errors
          if (presetError instanceof InvalidPresetDataError) {
            throw presetError;
          }
        }
      }
      
      // Log summary
      logger.info(`📥 Import Presets: Import complete - New: ${importedPresets.length}, Overwritten: ${overwrittenPresets.length}, Errors: ${errorPresets.length}`);
      if (importedPresets.length > 0) {
        logger.info(`📥 Import Presets: Successfully imported new: ${importedPresets.join(', ')}`);
      }
      if (overwrittenPresets.length > 0) {
        logger.info(`📥 Import Presets: Successfully overwritten: ${overwrittenPresets.join(', ')}`);
      }
      if (errorPresets.length > 0) {
        logger.warn(`📥 Import Presets: Failed to import: ${errorPresets.join(', ')}`);
      }

      return {
        imported: importedPresets,
        overwritten: overwrittenPresets,
        errors: errorPresets
      };

    } catch (error) {
      if (error instanceof InvalidPresetDataError) {
        logger.error('📥 Import Presets: Validation error:', error.message);
        throw error;
      }
      logger.error('📥 Import Presets: Unexpected error during import:', error);
      throw new Error(`Failed to import presets: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}