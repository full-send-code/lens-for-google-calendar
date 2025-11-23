/**
 * Calendar Operations Hook
 * Handles calendar actions with debouncing and performance logging
 */

import { useCallback } from 'react';
import type { ClearCalendarsUseCase } from '../../usecases';
import logger from '../../infrastructure/logger';
import { showCustomNotification } from '../utils/customNotification';
import type { UseOperationStateReturn } from './useOperationState.hook';

export interface UseCalendarOperationsProps {
  clearCalendarsUseCase: ClearCalendarsUseCase;
  operationState: UseOperationStateReturn;
  onSelectedPresetChange: (preset: string | undefined) => void;
}

export interface UseCalendarOperationsReturn {
  handleClear: () => Promise<void>;
}

/**
 * Custom hook for managing calendar operations
 * 
 * Provides centralized calendar management including:
 * - Clear all calendars with debouncing
 * - Performance logging for operations
 * - Proper error handling and notifications
 * - State management integration
 */
export const useCalendarOperations = ({
  clearCalendarsUseCase,
  operationState,
  onSelectedPresetChange
}: UseCalendarOperationsProps): UseCalendarOperationsReturn => {
  
  const { canPerformOperation, markOperationStart, markOperationEnd } = operationState;

  /**
   * Handle clear all calendars operation (with debouncing and performance logging)
   */
  const handleClear = useCallback(async () => {
    logger.info('🧹 UI Event: Clear all calendars button clicked');
    
    // Debounce rapid clear operations
    if (!canPerformOperation()) {
      logger.debug('🚫 UI Event: Debouncing rapid clear operation');
      return;
    }
    
    logger.info('🧹 UI Event: Processing clear all calendars operation');

    try {
      markOperationStart();
      onSelectedPresetChange(undefined);
      logger.debug('🧹 UI Event: State updated - isOperating: true, selectedPreset: undefined');
      
      logger.info('🧹 UI Event: Starting clear calendars operation...');
      const startTime = performance.now();
      
      logger.debug('🧹 UI Event: Calling clearCalendarsUseCase.execute()');
      await clearCalendarsUseCase.execute();
      
      const clearTime = performance.now() - startTime;
      logger.info(`⚡ UI Performance: Calendars cleared in ${clearTime.toFixed(2)}ms`);
      
      showCustomNotification('All Calendars Cleared', `All calendars have been hidden successfully (${clearTime.toFixed(0)}ms)`, 'success');
      logger.info('🧹 UI Event: Success notification shown for clear operation');
    } catch (error: any) {
      logger.error('🧹 UI Event: Failed to clear calendars:', error);
      showCustomNotification('Clear Failed', 'Failed to clear calendars. Please try again.', 'error');
      logger.info('🧹 UI Event: Error notification shown for clear operation');
    } finally {
      markOperationEnd();
      logger.debug('🧹 UI Event: Clear all calendars operation completed');
    }
  }, [clearCalendarsUseCase, canPerformOperation, markOperationStart, markOperationEnd, onSelectedPresetChange]);

  return {
    handleClear
  };
};