import React from 'react';
import { Snackbar, Alert } from '@mui/material';

interface NotificationsProps {
  message: string;
  open: boolean;
  onClose: () => void;
}

export function Notifications({ message, open, onClose }: NotificationsProps) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={5000}
      onClose={onClose}
    >
      <Alert onClose={onClose} severity="info">
        {message}
      </Alert>
    </Snackbar>
  );
}
