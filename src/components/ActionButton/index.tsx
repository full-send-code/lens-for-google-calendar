// ActionButton.tsx
import React, { useMemo } from 'react';
import { Button, Tooltip } from '@mui/material';
import KeyboardShortcut from '../KeyboardShortcut';
import useKeyboardShortcut from './hooks/useKeyboardShortcut';

// Styles defined with objects for inline styling
const styles = {
  button: {
    margin: '4px',
    minWidth: '80px'
  }
};

interface ActionButtonProps {
  text: string;
  tooltip: string;
  onClick: () => void;
}

const ActionButton: React.FC<ActionButtonProps> = ({ text, tooltip, onClick }) => {
  const { keyboardShortcut, setKeyboardShortcut, handleKeyAction } = useKeyboardShortcut(onClick);
  
  // Memoize the tooltip text to prevent unnecessary re-renders
  const tooltipText = useMemo(() => {
    return `${tooltip}${keyboardShortcut ? ` [${keyboardShortcut}]` : ''}`;
  }, [tooltip, keyboardShortcut]);

  return (
    <Tooltip title={tooltipText} enterDelay={500}>
      <Button 
        variant="contained" 
        size="small" 
        onClick={onClick} 
        className="gcs"
        sx={styles.button}
      >
        <KeyboardShortcut 
          text={text} 
          onKbd={handleKeyAction} 
          onShortcutKeys={(key) => setKeyboardShortcut(key)} 
        />
      </Button>
    </Tooltip>
  );
};

export default ActionButton;
