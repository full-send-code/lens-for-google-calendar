import React, { memo, useMemo } from 'react';
import ActionButton from '../ActionButton';
import { ButtonItem } from "../../types/ButtonItem";
import * as Logger from '../../utils/logger';

interface CalendarControlsProps {
  buttons: ButtonItem[];
  isLoading?: boolean;
}

// Styles for the controls container
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: '4px',
    padding: '4px 0'
  }
};

/**
 * CalendarControls component renders a row of action buttons
 */
export const CalendarControls: React.FC<CalendarControlsProps> = ({ 
  buttons,
  isLoading = false
}) => {
  // Track rendering for performance monitoring
  Logger.startPerformanceTracking('render:CalendarControls');
  
  // Memoize the button elements to prevent unnecessary re-renders
  const buttonElements = useMemo(() => {
    return buttons.map((button) => (
      <ActionButton
        key={button.text}
        text={button.text}
        tooltip={button.tooltip}
        onClick={(e) => button.click(e)}
        icon={button.icon}
        disabled={isLoading}
      />
    ));
  }, [buttons, isLoading]);
  
  // Log rendering performance
  Logger.endPerformanceTracking('render:CalendarControls');
  
  return (
    <div style={styles.container}>
      {buttonElements}
    </div>
  );
};

// Use memo to prevent unnecessary re-renders
export default memo(CalendarControls);
