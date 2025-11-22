/**
 * JSON Import/Export Service
 * Handles file import/export functionality for calendar presets
 */

import { PresetImportData, PresetExportData } from '../usecases';
import logger from './logger';

/**
 * Service for handling JSON import/export operations
 * Provides file download/upload functionality for preset data
 */
export class JsonImportExportService {
  
  /**
   * Export data as JSON file download
   */
  static exportToFile(data: PresetExportData, filename: string = 'calendar-presets.json'): void {
    const presetCount = Object.keys(data).length;
    logger.info(`📁 File Export: Starting file export for ${presetCount} presets to "${filename}"`);
    
    try {
      // Format JSON with proper indentation
      logger.debug('📁 File Export: Formatting JSON data with indentation...');
      const jsonString = JSON.stringify(data, null, 2);
      logger.debug(`📁 File Export: JSON string created, length: ${jsonString.length} characters`);
      
      // Create blob with JSON data
      const blob = new Blob([jsonString], { 
        type: 'application/json;charset=utf-8' 
      });
      logger.debug(`📁 File Export: Blob created, size: ${this.formatFileSize(blob.size)}`);
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const sanitizedFilename = this.sanitizeFilename(filename);
      logger.debug(`📁 File Export: Sanitized filename: "${sanitizedFilename}"`);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = sanitizedFilename;
      
      // Trigger download
      logger.debug('📁 File Export: Triggering file download...');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up object URL
      setTimeout(() => {
        URL.revokeObjectURL(url);
        logger.debug('📁 File Export: Object URL cleaned up');
      }, 100);
      
      logger.info(`📁 File Export: Successfully initiated download for "${sanitizedFilename}" (${this.formatFileSize(blob.size)})`);
      
    } catch (error) {
      logger.error('📁 File Export: Export to file failed:', error);
      throw new Error(`Failed to export data to file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Import data from JSON file
   */
  static importFromFile(): Promise<PresetImportData> {
    logger.info('📁 File Import: Starting file import operation');
    
    return new Promise((resolve, reject) => {
      try {
        // Create file input element
        logger.debug('📁 File Import: Creating file input element...');
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';
        input.style.display = 'none';
        
        // Handle file selection
        input.addEventListener('change', async (event) => {
          try {
            const file = (event.target as HTMLInputElement).files?.[0];
            if (!file) {
              logger.warn('📁 File Import: No file selected by user');
              reject(new Error('No file selected'));
              return;
            }

            logger.info(`📁 File Import: File selected - Name: "${file.name}", Size: ${this.formatFileSize(file.size)}, Type: "${file.type}"`);

            // Validate file type
            if (!this.isValidJsonFile(file)) {
              logger.error(`📁 File Import: Invalid file type - Name: "${file.name}", Type: "${file.type}"`);
              reject(new Error('Invalid file type. Please select a JSON file.'));
              return;
            }
            logger.debug('📁 File Import: File type validation passed');

            // Validate file size (max 1MB)
            if (file.size > 1024 * 1024) {
              logger.error(`📁 File Import: File too large - Size: ${this.formatFileSize(file.size)} (max: 1MB)`);
              reject(new Error('File size too large. Maximum size is 1MB.'));
              return;
            }
            logger.debug(`📁 File Import: File size validation passed - ${this.formatFileSize(file.size)}`);

            // Read file content
            logger.debug('📁 File Import: Reading file content as text...');
            const content = await this.readFileAsText(file);
            logger.debug(`📁 File Import: File content read successfully - ${content.length} characters`);
            
            // Parse and validate JSON
            logger.debug('📁 File Import: Parsing and validating JSON content...');
            const data = this.parseAndValidateJson(content);
            
            const presetCount = Object.keys(data).length;
            logger.info(`📁 File Import: Successfully imported ${presetCount} presets from "${file.name}"`);
            
            resolve(data);
            
          } catch (error) {
            logger.error('📁 File Import: File processing failed:', error);
            reject(error);
          } finally {
            // Clean up
            logger.debug('📁 File Import: Cleaning up file input element');
            document.body.removeChild(input);
          }
        });

        // Handle cancellation
        input.addEventListener('cancel', () => {
          logger.info('📁 File Import: File selection cancelled by user');
          document.body.removeChild(input);
          reject(new Error('File selection cancelled'));
        });

        // Add to DOM and trigger file picker
        logger.debug('📁 File Import: Opening file picker dialog...');
        document.body.appendChild(input);
        input.click();
        
      } catch (error) {
        logger.error('📁 File Import: Failed to initialize file import:', error);
        reject(new Error(`Failed to import data from file: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    });
  }

  /**
   * Export data as JSON string (for copy/paste functionality)
   */
  static exportToString(data: PresetExportData, formatted: boolean = true): string {
    try {
      return formatted 
        ? JSON.stringify(data, null, 2)
        : JSON.stringify(data);
    } catch (error) {
      throw new Error(`Failed to export data to string: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Import data from JSON string (for copy/paste functionality)
   */
  static importFromString(jsonString: string): PresetImportData {
    try {
      return this.parseAndValidateJson(jsonString);
    } catch (error) {
      throw new Error(`Failed to import data from string: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Export data to clipboard
   */
  static async exportToClipboard(data: PresetExportData): Promise<void> {
    const presetCount = Object.keys(data).length;
    logger.info(`📋 Clipboard Export: Starting clipboard export for ${presetCount} presets`);
    
    try {
      const jsonString = this.exportToString(data, true);
      logger.debug(`📋 Clipboard Export: JSON string created, length: ${jsonString.length} characters`);
      
      if (navigator.clipboard && window.isSecureContext) {
        // Use modern clipboard API
        logger.debug('📋 Clipboard Export: Using modern clipboard API...');
        await navigator.clipboard.writeText(jsonString);
        logger.info('📋 Clipboard Export: Successfully copied to clipboard using modern API');
      } else {
        // Fallback for older browsers
        logger.debug('📋 Clipboard Export: Using fallback clipboard method...');
        this.fallbackCopyToClipboard(jsonString);
        logger.info('📋 Clipboard Export: Successfully copied to clipboard using fallback method');
      }
      
    } catch (error) {
      logger.error('📋 Clipboard Export: Failed to export to clipboard:', error);
      throw new Error(`Failed to export to clipboard: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Import data from clipboard
   */
  static async importFromClipboard(): Promise<PresetImportData> {
    logger.info('📋 Clipboard Import: Starting clipboard import operation');
    
    try {
      let clipboardText: string;
      
      if (navigator.clipboard && window.isSecureContext) {
        // Use modern clipboard API
        logger.debug('📋 Clipboard Import: Using modern clipboard API to read text...');
        clipboardText = await navigator.clipboard.readText();
      } else {
        logger.error('📋 Clipboard Import: Clipboard access not available in this context');
        throw new Error('Clipboard access not available. Please use file import or paste manually.');
      }
      
      logger.debug(`📋 Clipboard Import: Read ${clipboardText.length} characters from clipboard`);
      
      if (!clipboardText.trim()) {
        logger.warn('📋 Clipboard Import: Clipboard is empty');
        throw new Error('Clipboard is empty');
      }
      
      logger.debug('📋 Clipboard Import: Parsing clipboard content as JSON...');
      const data = this.importFromString(clipboardText);
      
      const presetCount = Object.keys(data).length;
      logger.info(`📋 Clipboard Import: Successfully imported ${presetCount} presets from clipboard`);
      
      return data;
      
    } catch (error) {
      logger.error('📋 Clipboard Import: Failed to import from clipboard:', error);
      throw new Error(`Failed to import from clipboard: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate file type
   */
  private static isValidJsonFile(file: File): boolean {
    // Check file extension
    const validExtensions = ['.json'];
    const fileName = file.name.toLowerCase();
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
    
    // Check MIME type
    const validMimeTypes = ['application/json', 'text/json'];
    const hasValidMimeType = validMimeTypes.includes(file.type);
    
    return hasValidExtension || hasValidMimeType;
  }

  /**
   * Read file as text
   */
  private static readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result === 'string') {
          resolve(result);
        } else {
          reject(new Error('Failed to read file as text'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('File reading failed'));
      };
      
      reader.readAsText(file, 'utf-8');
    });
  }

  /**
   * Parse and validate JSON data
   */
  private static parseAndValidateJson(jsonString: string): PresetImportData {
    try {
      const data = JSON.parse(jsonString);
      
      // Validate data structure
      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw new Error('Invalid JSON structure. Expected an object with preset names as keys.');
      }

      // Validate each preset
      for (const [presetName, calendarEmails] of Object.entries(data)) {
        if (typeof presetName !== 'string' || !presetName.trim()) {
          throw new Error(`Invalid preset name: ${presetName}`);
        }

        if (!Array.isArray(calendarEmails)) {
          throw new Error(`Preset '${presetName}' must have an array of calendar emails`);
        }

        for (const email of calendarEmails) {
          if (typeof email !== 'string') {
            throw new Error(`Invalid email in preset '${presetName}': ${email}`);
          }
        }
      }

      return data as PresetImportData;
      
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('Invalid JSON format. Please check the file content.');
      }
      throw error;
    }
  }

  /**
   * Sanitize filename for download
   */
  private static sanitizeFilename(filename: string): string {
    // Remove or replace invalid characters
    let sanitized = filename.replace(/[<>:"/\\|?*]/g, '_');
    
    // Ensure .json extension
    if (!sanitized.toLowerCase().endsWith('.json')) {
      // Remove any existing extension and add .json
      sanitized = sanitized.replace(/\.[^.]*$/, '') + '.json';
    }
    
    // Limit length
    if (sanitized.length > 255) {
      const name = sanitized.substring(0, 251);
      sanitized = name + '.json';
    }
    
    return sanitized;
  }

  /**
   * Fallback clipboard copy for older browsers
   */
  private static fallbackCopyToClipboard(text: string): void {
    // Create temporary textarea
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '-9999px';
    
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      if (!successful) {
        throw new Error('Copy command failed');
      }
    } catch (error) {
      throw new Error('Clipboard copy not supported in this browser');
    } finally {
      document.body.removeChild(textArea);
    }
  }

  /**
   * Get file size in human readable format
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Validate import data size
   */
  static validateImportDataSize(data: PresetImportData, maxSizeKB: number = 100): void {
    const jsonString = JSON.stringify(data);
    const sizeKB = new Blob([jsonString]).size / 1024;
    
    if (sizeKB > maxSizeKB) {
      throw new Error(
        `Import data too large: ${this.formatFileSize(sizeKB * 1024)}. ` +
        `Maximum allowed: ${this.formatFileSize(maxSizeKB * 1024)}`
      );
    }
  }

  /**
   * Generate filename with timestamp
   */
  static generateTimestampedFilename(baseName: string = 'calendar-presets'): string {
    const now = new Date();
    const timestamp = now.toISOString()
      .replace(/:/g, '-')
      .replace(/\..+/, '')
      .replace('T', '_');
    
    return `${baseName}_${timestamp}.json`;
  }
}