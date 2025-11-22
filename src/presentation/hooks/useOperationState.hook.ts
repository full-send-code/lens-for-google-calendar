/**
 * Operation State Management Hook
 * Centralizes loading, debouncing, and operation tracking state
 */

import { useState, useCallback } from 'react';
import logger from '../../infrastructure/logger';

export interface UseOperationStateReturn {
  isOperating: boolean;
  lastOperationTime: number;
  setIsOperating: (operating: boolean) => void;
  canPerformOperation: (debounceMs?: number) => boolean;
  markOperationStart: () => void;
  markOperationEnd: () => void;
}

/**
 * Custom hook for managing operation state with debouncing
 * 
 * Provides centralized state management for:
 * - Loading states during operations
 * - Debouncing rapid operations
 * - Operation timing and performance tracking
 * 
 * @param defaultDebounceMs - Default debounce time in milliseconds
 * @returns Object with operation state and control functions
 */
export const useOperationState = (defaultDebounceMs = 500): UseOperationStateReturn => {
  const [isOperating, setIsOperating] = useState(false);
  const [lastOperationTime, setLastOperationTime] = useState(0);

  /**
   * Check if an operation can be performed based on debounce timing
   */
  const canPerformOperation = useCallback((debounceMs = defaultDebounceMs): boolean => {
    const now = Date.now();
    const canPerform = now - lastOperationTime >= debounceMs;
    
    if (!canPerform) {
      logger.debug(`🚫 Operation debounced - ${now - lastOperationTime}ms since last operation (need ${debounceMs}ms)`);
    }
    
    return canPerform;
  }, [lastOperationTime, defaultDebounceMs]);

  /**
   * Mark the start of an operation
   */
  const markOperationStart = useCallback(() => {
    const now = Date.now();
    setLastOperationTime(now);
    setIsOperating(true);
    logger.debug(`⏱️ Operation started at ${now}`);
  }, []);

  /**
   * Mark the end of an operation
   */
  const markOperationEnd = useCallback(() => {
    setIsOperating(false);
    logger.debug('✅ Operation completed');
  }, []);

  return {
    isOperating,
    lastOperationTime,
    setIsOperating,
    canPerformOperation,
    markOperationStart,
    markOperationEnd
  };
};