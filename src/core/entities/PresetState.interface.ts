/**
 * Preset State Interface  
 * Simple data structure for calendar presets
 */

export interface PresetState {
  /** Unique name of the preset */
  name: string;
  
  /** Array of calendar email addresses in this preset */
  calendarEmails: string[];
  
  /** When this preset was created */
  createdAt: Date;
  
  /** When this preset was last used (optional) */
  lastUsedAt?: Date;
}