// ActionButton.tsx
import React from 'react';
import { Button, Tooltip } from '@mui/material';
import KeyboardShortcut from './KeyboardShortcut';

interface ActionButtonProps {
  text: string;
  tooltip: string;
  onClick: () => void;
}

const ActionButton: React.FC<ActionButtonProps> = ({ text, tooltip, onClick }) => {
  const [keyboardShortcut, setKeyboardShortcut] = React.useState<string>('');
  
  const handleKeyAction = () => {
    onClick();
  };

  return (
    <Tooltip title={`${tooltip} ${keyboardShortcut ? `[${keyboardShortcut}]` : ''}`} enterDelay={500}>
      <Button 
        variant="contained" 
        size="small" 
        onClick={onClick} 
        className="gcs"
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
