/**
 * Preset Repository Interface
 * Contract for preset storage and retrieval
 */

import { CalendarPreset } from '../entities/CalendarPreset.entity';

export interface PresetRepository {
  /**
   * Save a calendar preset
   */
  savePreset(preset: CalendarPreset): Promise<void>;

  /**
   * Load a calendar preset by name
   */
  loadPreset(name: string): Promise<CalendarPreset | undefined>;

  /**
   * Get all saved presets
   */
  getAllPresets(): Promise<CalendarPreset[]>;

  /**
   * Delete a preset
   */
  deletePreset(name: string): Promise<void>;

  /**
   * Check if a preset exists
   */
  presetExists(name: string): Promise<boolean>;
}