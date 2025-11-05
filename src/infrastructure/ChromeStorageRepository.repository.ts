/**
 * Chrome Storage Repository Implementation
 * Handles Chrome extension sync storage for calendar presets
 */

import { PresetRepository, CalendarPreset, PresetState } from '../core';

/**
 * Chrome storage configuration
 */
interface ChromeStorageConfig {
  storageArea: 'sync' | 'local';
  keyPrefix: string;
  maxPresets: number;
}

/**
 * Implementation of PresetRepository using Chrome extension storage
 * Handles preset persistence with Chrome's sync storage API
 */
export class ChromeStorageRepository implements PresetRepository {
  private readonly config: ChromeStorageConfig;

  constructor(config: Partial<ChromeStorageConfig> = {}) {
    this.config = {
      storageArea: 'sync',
      keyPrefix: 'lens_preset_',
      maxPresets: 100,
      ...config
    };
  }

  /**
   * Save a preset to Chrome storage
   */
  async savePreset(preset: CalendarPreset): Promise<void> {
    try {
      const key = this.getPresetKey(preset.name);
      const data = preset.toJSON();
      
      // Check storage quota before saving
      await this.checkStorageQuota(key, data);
      
      await this.setStorageData({ [key]: data });
      
    } catch (error) {
      throw new Error(`Failed to save preset '${preset.name}': ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Load a preset from Chrome storage
   */
  async loadPreset(name: string): Promise<CalendarPreset | undefined> {
    try {
      const key = this.getPresetKey(name);
      const result = await this.getStorageData([key]);
      const data = result[key] as PresetState | undefined;
      
      if (!data) {
        return undefined;
      }

      // Validate the data structure
      this.validatePresetData(data, name);
      
      return new CalendarPreset(data.name, data.calendarEmails);
      
    } catch (error) {
      throw new Error(`Failed to load preset '${name}': ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all presets from Chrome storage
   */
  async getAllPresets(): Promise<CalendarPreset[]> {
    try {
      const allData = await this.getStorageData(null);
      const presets: CalendarPreset[] = [];
      
      for (const [key, value] of Object.entries(allData)) {
        if (this.isPresetKey(key)) {
          try {
            const data = value as PresetState;
            this.validatePresetData(data, this.getPresetNameFromKey(key));
            presets.push(new CalendarPreset(data.name, data.calendarEmails));
          } catch (error) {
            console.warn(`Skipping invalid preset data for key ${key}:`, error);
          }
        }
      }
      
      // Sort by last used, then by creation date, then by name
      return presets.sort((a, b) => {
        // Last used takes priority
        if (a.lastUsedAt && b.lastUsedAt) {
          return b.lastUsedAt.getTime() - a.lastUsedAt.getTime();
        }
        if (a.lastUsedAt && !b.lastUsedAt) return -1;
        if (!a.lastUsedAt && b.lastUsedAt) return 1;
        
        // Then by creation date
        const dateCompare = b.createdAt.getTime() - a.createdAt.getTime();
        if (dateCompare !== 0) return dateCompare;
        
        // Finally by name
        return a.name.localeCompare(b.name);
      });
      
    } catch (error) {
      throw new Error(`Failed to get all presets: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a preset from Chrome storage
   */
  async deletePreset(name: string): Promise<void> {
    try {
      const key = this.getPresetKey(name);
      
      // Check if preset exists first
      const exists = await this.presetExists(name);
      if (!exists) {
        throw new Error(`Preset '${name}' does not exist`);
      }
      
      await this.removeStorageData([key]);
      
    } catch (error) {
      throw new Error(`Failed to delete preset '${name}': ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if a preset exists
   */
  async presetExists(name: string): Promise<boolean> {
    try {
      const key = this.getPresetKey(name);
      const result = await this.getStorageData([key]);
      return result[key] !== undefined;
      
    } catch (error) {
      throw new Error(`Failed to check if preset '${name}' exists: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(): Promise<{
    presetCount: number;
    bytesInUse: number;
    quota: number;
    percentUsed: number;
  }> {
    try {
      const allPresets = await this.getAllPresets();
      const bytesInUse = await this.getBytesInUse();
      const quota = this.getStorageQuota();
      
      return {
        presetCount: allPresets.length,
        bytesInUse,
        quota,
        percentUsed: (bytesInUse / quota) * 100
      };
      
    } catch (error) {
      throw new Error(`Failed to get storage stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clear all presets (for testing or reset functionality)
   */
  async clearAllPresets(): Promise<void> {
    try {
      const allData = await this.getStorageData(null);
      const presetKeys = Object.keys(allData).filter(key => this.isPresetKey(key));
      
      if (presetKeys.length > 0) {
        await this.removeStorageData(presetKeys);
      }
      
    } catch (error) {
      throw new Error(`Failed to clear all presets: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate storage key for preset
   */
  private getPresetKey(name: string): string {
    // Sanitize name to ensure valid storage key
    const sanitizedName = name.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    return `${this.config.keyPrefix}${sanitizedName}`;
  }

  /**
   * Extract preset name from storage key
   */
  private getPresetNameFromKey(key: string): string {
    return key.replace(this.config.keyPrefix, '');
  }

  /**
   * Check if key is a preset key
   */
  private isPresetKey(key: string): boolean {
    return key.startsWith(this.config.keyPrefix);
  }

  /**
   * Validate preset data structure
   */
  private validatePresetData(data: any, presetName: string): asserts data is PresetState {
    if (!data || typeof data !== 'object') {
      throw new Error(`Invalid preset data format for '${presetName}'`);
    }

    if (typeof data.name !== 'string') {
      throw new Error(`Invalid name field for preset '${presetName}'`);
    }

    if (!Array.isArray(data.calendarEmails)) {
      throw new Error(`Invalid calendarEmails field for preset '${presetName}'`);
    }

    if (!data.createdAt || !(data.createdAt instanceof Date || typeof data.createdAt === 'string')) {
      throw new Error(`Invalid createdAt field for preset '${presetName}'`);
    }

    // Convert date strings to Date objects if needed
    if (typeof data.createdAt === 'string') {
      data.createdAt = new Date(data.createdAt);
    }

    if (data.lastUsedAt && !(data.lastUsedAt instanceof Date || typeof data.lastUsedAt === 'string')) {
      throw new Error(`Invalid lastUsedAt field for preset '${presetName}'`);
    }

    if (data.lastUsedAt && typeof data.lastUsedAt === 'string') {
      data.lastUsedAt = new Date(data.lastUsedAt);
    }
  }

  /**
   * Check storage quota before saving
   */
  private async checkStorageQuota(key: string, data: PresetState): Promise<void> {
    const dataSize = JSON.stringify(data).length;
    const bytesInUse = await this.getBytesInUse();
    const quota = this.getStorageQuota();
    
    if (bytesInUse + dataSize > quota) {
      throw new Error(`Storage quota exceeded. Current: ${bytesInUse}, Adding: ${dataSize}, Quota: ${quota}`);
    }

    // Check preset count limit
    const presetCount = (await this.getAllPresets()).length;
    const isNewPreset = !(await this.presetExists(this.getPresetNameFromKey(key)));
    
    if (isNewPreset && presetCount >= this.config.maxPresets) {
      throw new Error(`Maximum number of presets (${this.config.maxPresets}) exceeded`);
    }
  }

  /**
   * Get Chrome storage API based on configuration
   */
  private getStorageApi(): chrome.storage.StorageArea {
    return this.config.storageArea === 'sync' ? chrome.storage.sync : chrome.storage.local;
  }

  /**
   * Get storage quota based on storage area
   */
  private getStorageQuota(): number {
    return this.config.storageArea === 'sync' 
      ? chrome.storage.sync.QUOTA_BYTES 
      : chrome.storage.local.QUOTA_BYTES;
  }

  /**
   * Get bytes in use from Chrome storage
   */
  private async getBytesInUse(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.getStorageApi().getBytesInUse(null, (bytes) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(bytes);
        }
      });
    });
  }

  /**
   * Get data from Chrome storage
   */
  private async getStorageData(keys: string[] | null): Promise<Record<string, any>> {
    return new Promise((resolve, reject) => {
      this.getStorageApi().get(keys, (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(result);
        }
      });
    });
  }

  /**
   * Set data in Chrome storage
   */
  private async setStorageData(data: Record<string, any>): Promise<void> {
    return new Promise((resolve, reject) => {
      this.getStorageApi().set(data, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Remove data from Chrome storage
   */
  private async removeStorageData(keys: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      this.getStorageApi().remove(keys, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }
}