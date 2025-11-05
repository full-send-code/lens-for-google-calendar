/**
 * Error thrown when preset import fails due to invalid data.
 */
export class InvalidPresetDataError extends Error {
  constructor(reason: string) {
    super(`Invalid preset data: ${reason}`);
    this.name = 'InvalidPresetDataError';
  }
}