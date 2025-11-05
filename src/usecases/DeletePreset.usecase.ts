/**
 * Delete Preset Use Case
 * 
 * Business logic for deleting a calendar preset from storage.
 */

import type { PresetRepository } from '../core/repositories';
import { PresetNotFoundError } from '../core/errors';

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
    // Validate preset name
    if (!presetName.trim()) {
      throw new Error('Preset name cannot be empty');
    }

    // Check if preset exists
    const exists = await this.presetRepository.presetExists(presetName);
    if (!exists) {
      throw new PresetNotFoundError(presetName);
    }

    // Delete the preset
    await this.presetRepository.deletePreset(presetName);
  }
}