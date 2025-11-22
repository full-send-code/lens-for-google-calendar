/**
 * Current State Display Component
 * Shows current calendar visibility state
 */

import React from 'react';
import { Divider } from 'antd';
import type { Calendar } from '../../core';

export interface CurrentStateDisplayProps {
  visibleCalendars: Calendar[];
  totalCalendars: number;
}

/**
 * Current State Display Component
 * 
 * Displays the current calendar visibility state:
 * - Shows count of visible vs total calendars
 * - Only displays when there are visible calendars
 * - Simple, clean visual indicator
 */
export const CurrentStateDisplay: React.FC<CurrentStateDisplayProps> = ({
  visibleCalendars,
  totalCalendars
}) => {
  // Only show if there are visible calendars
  if (visibleCalendars.length === 0) {
    return null;
  }

  const stateIndicator = `${visibleCalendars.length}/${totalCalendars}`;

  return (
    <>
      <Divider style={{ margin: '8px 0' }} />
      <div style={{ fontSize: '11px', color: '#999' }}>
        Current: {stateIndicator} calendars visible
      </div>
    </>
  );
};