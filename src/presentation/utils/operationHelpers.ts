/**
 * Operation Helpers Utility
 * Common operation patterns and validation functions
 */

/**
 * Show a confirmation dialog with proper formatting
 * @param title - Dialog title
 * @param message - Confirmation message
 * @param warning - Optional warning text
 * @returns Boolean indicating user's choice
 */
export const showConfirmationDialog = (title: string, message: string, warning?: string): boolean => {
  const fullMessage = warning ? `${message}\n\n${warning}` : message;
  return confirm(`${title}\n\n${fullMessage}`);
};

/**
 * Validate preset name
 * @param name - Preset name to validate
 * @returns Object with isValid boolean and error message
 */
export const validatePresetName = (name: string): { isValid: boolean; error?: string } => {
  const trimmedName = name.trim();
  
  if (!trimmedName) {
    return { isValid: false, error: 'Please enter a preset name.' };
  }
  
  if (trimmedName.length > 50) {
    return { isValid: false, error: 'Preset name must be 50 characters or less.' };
  }
  
  // Check for invalid characters (optional - could add more validation)
  const invalidChars = /[<>:"/\\|?*]/;
  if (invalidChars.test(trimmedName)) {
    return { isValid: false, error: 'Preset name contains invalid characters.' };
  }
  
  return { isValid: true };
};

/**
 * Format performance duration for display
 * @param durationMs - Duration in milliseconds
 * @returns Formatted duration string
 */
export const formatDuration = (durationMs: number): string => {
  if (durationMs < 1000) {
    return `${durationMs.toFixed(0)}ms`;
  }
  return `${(durationMs / 1000).toFixed(1)}s`;
};

/**
 * Generate filename for export with timestamp
 * @param prefix - Filename prefix
 * @param extension - File extension (without dot)
 * @returns Formatted filename
 */
export const generateExportFilename = (prefix: string, extension: string): string => {
  const date = new Date().toISOString().split('T')[0];
  return `${prefix}-${date}.${extension}`;
};