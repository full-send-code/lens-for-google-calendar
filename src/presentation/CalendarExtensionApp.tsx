/**
 * Calendar Extension App
 * Main React application component that coordinates all calendar functionality
 */

import React, { useState, useEffect } from 'react';
import { ConfigProvider, theme, notification } from 'antd';
import { LensHeaderButton } from './components/CalendarToolbar.component';
import logger from '../infrastructure/logger';
import type { 
  ClearCalendarsUseCase,
  EnableCalendarUseCase,
  ApplyPresetUseCase,
  SavePresetUseCase,
  DeletePresetUseCase,
  ImportPresetsUseCase,
  ExportPresetsUseCase
} from '../usecases';
import type { CalendarPreset, Calendar, PresetRepository, CalendarRepository } from '../core';

/**
 * Props for the main calendar extension app
 * Dependencies are injected from the composition root
 */
export interface CalendarExtensionAppProps {
  // Use Cases
  clearCalendarsUseCase: ClearCalendarsUseCase;
  enableCalendarUseCase: EnableCalendarUseCase;
  applyPresetUseCase: ApplyPresetUseCase;
  savePresetUseCase: SavePresetUseCase;
  deletePresetUseCase: DeletePresetUseCase;
  importPresetsUseCase: ImportPresetsUseCase;
  exportPresetsUseCase: ExportPresetsUseCase;
  
  // Repositories
  presetRepository: PresetRepository;
  calendarRepository: CalendarRepository;
}

/**
 * Main Calendar Extension App Component
 * 
 * This component serves as the root of the React application and:
 * - Provides Ant Design theme configuration
 * - Manages global application state (presets and calendars)
 * - Coordinates between use cases and UI components
 * - Handles notifications and error states
 */
export const CalendarExtensionApp: React.FC<CalendarExtensionAppProps> = ({
  clearCalendarsUseCase,
  enableCalendarUseCase,
  applyPresetUseCase,
  savePresetUseCase,
  deletePresetUseCase,
  importPresetsUseCase,
  exportPresetsUseCase,
  presetRepository,
  calendarRepository
}) => {
  const [presets, setPresets] = useState<CalendarPreset[]>([]);
  const [currentCalendars, setCurrentCalendars] = useState<Calendar[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * Load presets and current calendar state on component mount
   */
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Debug: Check current URL and available DOM elements
        logger.info('🔍 Current URL:', window.location.href);
        logger.info('🔍 Checking calendar list selectors...');
        
        // Check for calendar list elements
        const calendarListPrimary = document.querySelector('[data-testid="calendar-list"]');
        const calendarListAlt = document.querySelector('[role="grid"][aria-label*="calendar" i]');
        const allGrids = document.querySelectorAll('[role="grid"]');
        const allAriaLabels = Array.from(document.querySelectorAll('[aria-label]')).map(el => el.getAttribute('aria-label'));
        
        logger.info('🔍 Primary selector [data-testid="calendar-list"]:', calendarListPrimary);
        logger.info('🔍 Alt selector [role="grid"][aria-label*="calendar" i]:', calendarListAlt);
        logger.info('🔍 All grids found:', allGrids.length, Array.from(allGrids).map(g => g.getAttribute('aria-label')));
        logger.info('🔍 All aria-labels containing "calendar":', allAriaLabels.filter(label => label?.toLowerCase().includes('calendar')));
        
        // Check if we're on the right page
        if (!window.location.href.includes('calendar.google.com')) {
          throw new Error('Not on Google Calendar page');
        }
        
        // Load presets and current calendar state in parallel
        const [loadedPresets, calendars] = await Promise.all([
          presetRepository.getAllPresets(),
          calendarRepository.getCurrentCalendarStates()
        ]);
        
        setPresets(loadedPresets);
        setCurrentCalendars(calendars);
      } catch (error) {
        logger.error('Failed to load data:', error);
        notification.error({
          message: 'Failed to load data',
          description: 'Unable to load calendar presets and current state.'
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [presetRepository, calendarRepository]);

  /**
   * Refresh presets after import/save/delete operations
   */
  const refreshPresets = async () => {
    try {
      const updatedPresets = await presetRepository.getAllPresets();
      setPresets(updatedPresets);
    } catch (error) {
      logger.error('Failed to refresh presets:', error);
    }
  };

  /**
   * Refresh calendar state after operations (with debouncing to avoid excessive calls)
   */
  const refreshCalendars = React.useCallback(async () => {
    try {
      logger.info('🔄 Refreshing calendar state...');
      
      // Log performance metrics if available
      if ('logPerformanceMetrics' in calendarRepository) {
        (calendarRepository as any).logPerformanceMetrics();
      }
      
      const updatedCalendars = await calendarRepository.getCurrentCalendarStates();
      setCurrentCalendars(updatedCalendars);
      
      logger.info(`✅ Calendar state refreshed: ${updatedCalendars.length} calendars found`);
    } catch (error) {
      logger.error('Failed to refresh calendars:', error);
    }
  }, [calendarRepository]);

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 6,
          fontSize: 14,
        },
      }}
    >
      {/* Remove the wrapper div since we're using a floating panel */}
      <LensHeaderButton
        clearCalendarsUseCase={clearCalendarsUseCase}
        enableCalendarUseCase={enableCalendarUseCase}
        applyPresetUseCase={applyPresetUseCase}
        savePresetUseCase={savePresetUseCase}
        deletePresetUseCase={deletePresetUseCase}
        importPresetsUseCase={importPresetsUseCase}
        exportPresetsUseCase={exportPresetsUseCase}
        presets={presets}
        currentCalendars={currentCalendars}
        loading={loading}
        onPresetsChange={refreshPresets}
        onCalendarsChange={refreshCalendars}
      />
    </ConfigProvider>
  );
};