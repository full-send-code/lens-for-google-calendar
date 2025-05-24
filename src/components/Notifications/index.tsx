import React, { useCallback, useMemo } from 'react';
import { Snackbar, Alert } from '@mui/material';
import { startPerformanceTracking, endPerformanceTracking } from '../../utils/logger';

interface NotificationsProps {
  message: string;
  open: boolean;
  onClose: () => void;
  severity?: 'success' | 'info' | 'warning' | 'error';
  autoHideDuration?: number;
}

/**
 * Notifications component for displaying snackbar messages
 * Optimized with memoization and performance tracking
 */
export const Notifications: React.FC<NotificationsProps> = ({ 
  message, 
  open, 
  onClose,
  severity = 'info',
  autoHideDuration = 5000
}) => {
  // Memoize the close handler with performance tracking
  const handleClose = useCallback((event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    
    startPerformanceTracking('notifications.close');
    onClose();
    endPerformanceTracking('notifications.close');
  }, [onClose]);

  // Memoize snackbar props
  const snackbarProps = useMemo(() => ({
    open,
    autoHideDuration,
    onClose: handleClose,
  }), [open, autoHideDuration, handleClose]);

  // Track when notifications are shown
  React.useEffect(() => {
    if (open) {
      startPerformanceTracking('notifications.show');
      return () => {
        endPerformanceTracking('notifications.show');
      };
    }
  }, [open]);

  return (
    <Snackbar {...snackbarProps}>
      <Alert onClose={handleClose} severity={severity}>
        {message}
      </Alert>
    </Snackbar>
  );
};

export default React.memo(Notifications);
