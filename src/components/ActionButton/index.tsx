// ActionButton.tsx
import React, { ReactElement, useMemo, memo, useCallback } from 'react';
import { Fab, Tooltip } from '@mui/material';
import KeyboardShortcut from '../KeyboardShortcut';
import useKeyboardShortcut from './hooks/useKeyboardShortcut';
import * as Logger from '../../utils/logger';

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
  icon: ReactElement;
  disabled?: boolean;
}

/**
 * ActionButton component renders a floating action button with tooltip and keyboard shortcut
 */
const ActionButton: React.FC<ActionButtonProps> = ({ 
  text, 
  tooltip, 
  onClick, 
  icon, 
  disabled = false 
}) => {
  // Use the keyboard shortcut hook
  const { keyboardShortcut, setKeyboardShortcut, handleKeyAction } = useKeyboardShortcut(onClick);
  
  // Memoize the tooltip text to prevent unnecessary re-renders
  const tooltipText = useMemo(() => {
    return `${tooltip}${keyboardShortcut ? ` [${keyboardShortcut}]` : ''}`;
  }, [tooltip, keyboardShortcut]);

  // Wrap onClick in useCallback to prevent unnecessary renders
  const handleClick = useCallback((e: React.MouseEvent<HTMLElement>) => {
    Logger.startPerformanceTracking(`button-click:${text}`);
    onClick(e);
    Logger.endPerformanceTracking(`button-click:${text}`);
  }, [onClick, text]);

  // Extract clean name without ampersand
  const cleanName = useMemo(() => text.replace('&', ''), [text]);

  return (
    <Tooltip title={tooltipText} enterDelay={500}>
      <span style={styles.button}>
        <Fab
          size="small"
          onClick={handleClick}
          aria-label={tooltip}
          id={`action-button-${cleanName}`}
          data-action-button={cleanName}
          disabled={disabled}
          color="primary"
        >
          {icon}
          <KeyboardShortcut
            text={text}
            onKbd={handleKeyAction}
            onShortcutKeys={(key) => setKeyboardShortcut(key)}
          />
        </Fab>
      </span>
    </Tooltip>
  );
};

// Use React.memo to prevent unnecessary re-renders
export default memo(ActionButton);
