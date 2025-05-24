import { useState, useCallback } from 'react';

/**
 * Custom hook for handling keyboard shortcuts in button components
 * @param onClick Function to trigger when the shortcut is activated
 * @returns Object containing shortcut state and handlers
 */
const useKeyboardShortcut = (onClick: (event: React.MouseEvent<HTMLElement>) => void) => {
  const [keyboardShortcut, setKeyboardShortcut] = useState<string>('');
  
  const handleKeyAction = useCallback(() => {
    // Create a synthetic MouseEvent when triggered by keyboard
    const syntheticEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window
    }) as unknown as React.MouseEvent<HTMLElement>;
    
    onClick(syntheticEvent);
  }, [onClick]);
  
  return {
    keyboardShortcut,
    setKeyboardShortcut,
    handleKeyAction
  };
};

export default useKeyboardShortcut;
