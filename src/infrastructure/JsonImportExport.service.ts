/**
 * JSON Import/Export Service
 * Handles file import/export functionality for calendar presets
 */

import { PresetImportData, PresetExportData } from '../usecases';

/**
 * Service for handling JSON import/export operations
 * Provides file download/upload functionality for preset data
 */
export class JsonImportExportService {
  
  /**
   * Export data as JSON file download
   */
  static exportToFile(data: PresetExportData, filename: string = 'calendar-presets.json'): void {
    try {
      // Format JSON with proper indentation
      const jsonString = JSON.stringify(data, null, 2);
      
      // Create blob with JSON data
      const blob = new Blob([jsonString], { 
        type: 'application/json;charset=utf-8' 
      });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = this.sanitizeFilename(filename);
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up object URL
      setTimeout(() => URL.revokeObjectURL(url), 100);
      
    } catch (error) {
      throw new Error(`Failed to export data to file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Import data from JSON file
   */
  static importFromFile(): Promise<PresetImportData> {
    return new Promise((resolve, reject) => {
      try {
        // Create file input element
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';
        input.style.display = 'none';
        
        // Handle file selection
        input.addEventListener('change', async (event) => {
          try {
            const file = (event.target as HTMLInputElement).files?.[0];
            if (!file) {
              reject(new Error('No file selected'));
              return;
            }

            // Validate file type
            if (!this.isValidJsonFile(file)) {
              reject(new Error('Invalid file type. Please select a JSON file.'));
              return;
            }

            // Validate file size (max 1MB)
            if (file.size > 1024 * 1024) {
              reject(new Error('File size too large. Maximum size is 1MB.'));
              return;
            }

            // Read file content
            const content = await this.readFileAsText(file);
            
            // Parse and validate JSON
            const data = this.parseAndValidateJson(content);
            
            resolve(data);
            
          } catch (error) {
            reject(error);
          } finally {
            // Clean up
            document.body.removeChild(input);
          }
        });

        // Handle cancellation
        input.addEventListener('cancel', () => {
          document.body.removeChild(input);
          reject(new Error('File selection cancelled'));
        });

        // Add to DOM and trigger file picker
        document.body.appendChild(input);
        input.click();
        
      } catch (error) {
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
    try {
      const jsonString = this.exportToString(data, true);
      
      if (navigator.clipboard && window.isSecureContext) {
        // Use modern clipboard API
        await navigator.clipboard.writeText(jsonString);
      } else {
        // Fallback for older browsers
        this.fallbackCopyToClipboard(jsonString);
      }
      
    } catch (error) {
      throw new Error(`Failed to export to clipboard: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Import data from clipboard
   */
  static async importFromClipboard(): Promise<PresetImportData> {
    try {
      let clipboardText: string;
      
      if (navigator.clipboard && window.isSecureContext) {
        // Use modern clipboard API
        clipboardText = await navigator.clipboard.readText();
      } else {
        throw new Error('Clipboard access not available. Please use file import or paste manually.');
      }
      
      if (!clipboardText.trim()) {
        throw new Error('Clipboard is empty');
      }
      
      return this.importFromString(clipboardText);
      
    } catch (error) {
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