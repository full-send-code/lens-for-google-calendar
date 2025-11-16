import { PresetRepository, CalendarPreset } from '../core';
import logger from '../infrastructure/logger';

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
    logger.info('📤 Export Presets: Starting export operation to JSON string');
    
    try {
      // Get all presets from storage
      logger.debug('📤 Export Presets: Retrieving all presets from repository...');
      const presets = await this.presetRepository.getAllPresets();
      logger.info(`📤 Export Presets: Retrieved ${presets.length} presets from storage`);
      
      if (presets.length === 0) {
        logger.warn('📤 Export Presets: No presets found to export');
      } else {
        const presetNames = presets.map(p => p.name);
        logger.debug(`📤 Export Presets: Preset names: ${presetNames.join(', ')}`);
      }
      
      // Convert presets to export format
      logger.debug('📤 Export Presets: Converting presets to export format...');
      const exportData: PresetExportData = {};
      
      for (const preset of presets) {
        exportData[preset.name] = preset.calendarEmails;
        logger.debug(`📤 Export Presets: Added preset "${preset.name}" with ${preset.calendarEmails.length} calendars`);
      }
      
      // Convert to JSON string with formatting for readability
      logger.debug('📤 Export Presets: Converting to formatted JSON string...');
      const jsonString = JSON.stringify(exportData, null, 2);
      logger.info(`📤 Export Presets: Export complete - JSON string length: ${jsonString.length} characters`);
      logger.debug(`📤 Export Presets: Exported ${Object.keys(exportData).length} presets`);
      
      return jsonString;
      
    } catch (error) {
      logger.error('📤 Export Presets: Export operation failed:', error);
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
    logger.info('📤 Export Presets (Raw): Starting export operation to data object');
    
    try {
      // Get all presets from storage
      logger.debug('📤 Export Presets (Raw): Retrieving all presets from repository...');
      const presets = await this.presetRepository.getAllPresets();
      logger.info(`📤 Export Presets (Raw): Retrieved ${presets.length} presets from storage`);
      
      if (presets.length === 0) {
        logger.warn('📤 Export Presets (Raw): No presets found to export');
      }
      
      // Convert presets to export format
      logger.debug('📤 Export Presets (Raw): Converting presets to export format...');
      const exportData: PresetExportData = {};
      let totalCalendars = 0;
      
      for (const preset of presets) {
        exportData[preset.name] = preset.calendarEmails;
        totalCalendars += preset.calendarEmails.length;
        logger.debug(`📤 Export Presets (Raw): Added preset "${preset.name}" with ${preset.calendarEmails.length} calendars`);
      }
      
      logger.info(`📤 Export Presets (Raw): Export complete - ${Object.keys(exportData).length} presets with ${totalCalendars} total calendar references`);
      
      return exportData;
      
    } catch (error) {
      logger.error('📤 Export Presets (Raw): Export operation failed:', error);
      throw new Error(`Failed to export presets: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}