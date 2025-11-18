/**
 * Calendar Actions Section Component
 * Handles clear, enable, and save current state actions
 */

import React from 'react';
import { Space, Button } from 'antd';
import { ClearOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons';
import type { Calendar } from '../../core';
import logger from '../../infrastructure/logger';

export interface CalendarActionsSectionProps {
  visibleCalendars: Calendar[];
  isOperating: boolean;
  onClear: () => void;
  onEnableCalendar: () => void;
  onSaveCurrentState: () => void;
}

/**
 * Calendar Actions Section Component
 * 
 * Provides calendar management actions:
 * - Clear all calendars button
 * - Enable calendar button (opens modal)
 * - Save current state button (opens save modal)
 * - Proper disabled states based on calendar visibility
 */
export const CalendarActionsSection: React.FC<CalendarActionsSectionProps> = ({
  visibleCalendars,
  isOperating,
  onClear,
  onEnableCalendar,
  onSaveCurrentState
}) => {
  
  const handleEnableClick = () => {
    logger.info('✅ UI Event: Enable Calendar button clicked - opening modal');
    onEnableCalendar();
  };

  const handleSaveClick = () => {
    logger.info('💾 UI Event: Save Current State button clicked - opening modal');
    onSaveCurrentState();
  };

  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ fontSize: '12px', color: '#666', marginBottom: '6px', fontWeight: 500 }}>
        Calendar Actions
      </div>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Button
          size="small"
          icon={<ClearOutlined />}
          onClick={onClear}
          disabled={isOperating}
          style={{ width: '100%' }}
        >
          Clear All Calendars
        </Button>
        <Button
          size="small"
          icon={<PlusOutlined />}
          onClick={handleEnableClick}
          disabled={isOperating}
          style={{ width: '100%' }}
        >
          Enable Calendar
        </Button>
        <Button
          size="small"
          icon={<SaveOutlined />}
          onClick={handleSaveClick}
          disabled={isOperating || visibleCalendars.length === 0}
          style={{ width: '100%' }}
        >
          Save Current State
        </Button>
      </Space>
    </div>
  );
};