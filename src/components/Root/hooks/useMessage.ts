import { useState, useCallback, useMemo } from 'react';
import { startPerformanceTracking, endPerformanceTracking } from '../../../utils/logger';

interface MessageState {
  message: string;
  severity: 'success' | 'info' | 'warning' | 'error';
  showSnackbar: boolean;
}

/**
 * Enhanced hook for managing notification messages with severity levels
 * Optimized with performance tracking and memoization
 */
export function useMessage() {
  const [messageState, setMessageState] = useState<MessageState>({
    message: '',
    severity: 'info',
    showSnackbar: false
  });
  
  // Show a notification message with optional severity
  const showMessage = useCallback((msg: string, severity: MessageState['severity'] = 'info') => {
    startPerformanceTracking('useMessage.showMessage');
    
    setMessageState({
      message: msg,
      severity,
      showSnackbar: true
    });
    
    endPerformanceTracking('useMessage.showMessage');
  }, []);
  
  // Close the notification
  const handleCloseSnackbar = useCallback(() => {
    startPerformanceTracking('useMessage.closeSnackbar');
    
    setMessageState(prev => ({
      ...prev,
      showSnackbar: false
    }));
    
    endPerformanceTracking('useMessage.closeSnackbar');
  }, []);

  // Convenience methods for different message types
  const messageHelpers = useMemo(() => ({
    showSuccess: (msg: string) => showMessage(msg, 'success'),
    showInfo: (msg: string) => showMessage(msg, 'info'),
    showWarning: (msg: string) => showMessage(msg, 'warning'),
    showError: (msg: string) => showMessage(msg, 'error'),
  }), [showMessage]);
  
  return { 
    message: messageState.message,
    severity: messageState.severity,
    showMessage, 
    handleCloseSnackbar, 
    showSnackbar: messageState.showSnackbar,
    ...messageHelpers
  };
}
