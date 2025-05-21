import { useState } from 'react';

export function useMessage() {
  const [message, setMessage] = useState<string>('');
  const [showSnackbar, setShowSnackbar] = useState(false);
  
  const showMessage = (msg: string) => {
    setMessage(msg);
    setShowSnackbar(true);
  };
  
  const handleCloseSnackbar = () => {
    setShowSnackbar(false);
  };
  
  return { 
    message, 
    showMessage, 
    handleCloseSnackbar, 
    showSnackbar 
  };
}
