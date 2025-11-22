/**
 * Notification Helpers Utility
 * Helper functions for consistent notification formatting
 */

import { showCustomNotification } from './customNotification';

export const showSuccessNotification = (title: string, description: string, duration?: string) => {
  const message = duration ? `${description} (${duration})` : description;
  showCustomNotification(title, message, 'success');
};

export const showErrorNotification = (title: string, description: string) => {
  showCustomNotification(title, description, 'error');
};

export const showWarningNotification = (title: string, description: string) => {
  showCustomNotification(title, description, 'warning');
};

export const showValidationError = (field: string, message: string) => {
  showErrorNotification(`Invalid ${field}`, message);
};

export const showOperationSuccess = (operation: string, item: string, duration?: number) => {
  const durationText = duration ? ` (${duration.toFixed(0)}ms)` : '';
  showSuccessNotification(`${operation} Successful`, `${item} ${operation.toLowerCase()}ed successfully${durationText}`, durationText);
};

export const showOperationError = (operation: string, item: string, error?: string) => {
  const message = error || `Failed to ${operation.toLowerCase()} ${item}. Please try again.`;
  showErrorNotification(`${operation} Failed`, message);
};