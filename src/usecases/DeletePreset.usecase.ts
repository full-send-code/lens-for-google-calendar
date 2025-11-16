/**
 * Delete Preset Use Case
 * 
 * Business logic for deleting a calendar preset from storage.
 */

import type { PresetRepository } from '../core/repositories';
import { PresetNotFoundError } from '../core/errors';
import logger from '../infrastructure/logger';

/**
 * Use case for deleting calendar presets
 * 
 * This use case:
 * 1. Validates that the preset exists
 * 2. Deletes the preset from storage
 * 3. Throws error if preset doesn't exist
 */
export class DeletePresetUseCase {
  constructor(
    private presetRepository: PresetRepository
  ) {}

  /**
   * Execute the delete preset operation
   * 
   * @param presetName - Name of the preset to delete
   * @returns Promise that resolves when preset is deleted
   * @throws PresetNotFoundError if preset doesn't exist
   */
  async execute(presetName: string): Promise<void> {
    logger.info(`🗑️ Delete Preset: Starting delete operation for preset: "${presetName}"`);
    
    // Validate preset name
    if (!presetName.trim()) {
      logger.error('🗑️ Delete Preset: Validation failed - preset name is empty');
      throw new Error('Preset name cannot be empty');
    }
    
    logger.debug(`🗑️ Delete Preset: Preset name validation passed: "${presetName}"`);

    // Check if preset exists
    logger.debug(`🗑️ Delete Preset: Checking if preset "${presetName}" exists...`);
    const exists = await this.presetRepository.presetExists(presetName);
    
    if (!exists) {
      logger.error(`🗑️ Delete Preset: Preset "${presetName}" not found`);
      throw new PresetNotFoundError(presetName);
    }
    
    logger.info(`🗑️ Delete Preset: Preset "${presetName}" found, proceeding with deletion`);

    // Delete the preset
    logger.debug(`🗑️ Delete Preset: Calling repository to delete preset: "${presetName}"`);
    await this.presetRepository.deletePreset(presetName);
    
    logger.info(`🗑️ Delete Preset: Successfully deleted preset: "${presetName}"`);
  }
}