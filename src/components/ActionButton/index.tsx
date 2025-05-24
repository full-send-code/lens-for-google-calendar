// ActionButton.tsx
import React, { ReactElement, useMemo } from 'react';
import { Fab, Tooltip } from '@mui/material';
import KeyboardShortcut from '../KeyboardShortcut';
import useKeyboardShortcut from './hooks/useKeyboardShortcut';

// Styles defined with objects for inline styling
const styles = {
  button: {
    margin: '4px',
  }
};

interface ActionButtonProps {
  text: string;
  tooltip: string;
  onClick: (event: React.MouseEvent<HTMLElement>) => void;
  icon: ReactElement
}

const ActionButton: React.FC<ActionButtonProps> = ({ text, tooltip, onClick, icon }) => {
  const { keyboardShortcut, setKeyboardShortcut, handleKeyAction } = useKeyboardShortcut(onClick);
  
  // Memoize the tooltip text to prevent unnecessary re-renders
  const tooltipText = useMemo(() => {
    return `${tooltip}${keyboardShortcut ? ` [${keyboardShortcut}]` : ''}`;
  }, [tooltip, keyboardShortcut]);

  return (
    <Tooltip title={tooltipText} enterDelay={500}>
      <Fab
        size="small"
        onClick={(e) => onClick(e)}
        aria-label={tooltip}
        id={`action-button-${text.replace('&', '')}`}
        data-action-button={text.replace('&', '')}
      >
        {icon}
        <KeyboardShortcut
          text={text}
          onKbd={handleKeyAction}
          onShortcutKeys={(key) => setKeyboardShortcut(key)}
        />
      </Fab>
    </Tooltip>
  );
};

export default ActionButton;
