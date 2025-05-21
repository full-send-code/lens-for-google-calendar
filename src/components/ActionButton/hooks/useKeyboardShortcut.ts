import { useState, useCallback } from 'react';

/**
 * Custom hook for handling keyboard shortcuts in button components
 * @param onClick Function to trigger when the shortcut is activated
 * @returns Object containing shortcut state and handlers
 */
const useKeyboardShortcut = (onClick: () => void) => {
  const [keyboardShortcut, setKeyboardShortcut] = useState<string>('');
  
  const handleKeyAction = useCallback(() => {
    onClick();
  }, [onClick]);
  
  return {
    keyboardShortcut,
    setKeyboardShortcut,
    handleKeyAction
  };
};

export default useKeyboardShortcut;
