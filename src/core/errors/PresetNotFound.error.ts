/**
 * Error thrown when a requested preset is not found.
 */
export class PresetNotFoundError extends Error {
  constructor(presetName: string) {
    super(`Preset '${presetName}' not found`);
    this.name = 'PresetNotFoundError';
  }
}