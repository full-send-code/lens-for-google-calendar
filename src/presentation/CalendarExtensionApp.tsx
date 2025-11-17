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
      logger.info('🚀 App Initialization: Starting calendar extension data loading...');
      
      try {
        setLoading(true);
        logger.info('🚀 App Initialization: Loading state set to true');
        
        // Debug: Check current URL and available DOM elements
        logger.info('🔍 DOM Discovery: Current URL:', window.location.href);
        logger.info('🔍 DOM Discovery: Checking calendar list selectors...');
        
        // Check for calendar list elements
        const calendarListPrimary = document.querySelector('[data-testid="calendar-list"]');
        const calendarListAlt = document.querySelector('[role="grid"][aria-label*="calendar" i]');
        const allGrids = document.querySelectorAll('[role="grid"]');
        const allAriaLabels = Array.from(document.querySelectorAll('[aria-label]')).map(el => el.getAttribute('aria-label'));
        
        logger.info('🔍 DOM Discovery: Primary selector [data-testid="calendar-list"]:', !!calendarListPrimary);
        logger.info('🔍 DOM Discovery: Alt selector [role="grid"][aria-label*="calendar" i]:', !!calendarListAlt);
        logger.info('🔍 DOM Discovery: All grids found:', allGrids.length, Array.from(allGrids).map(g => g.getAttribute('aria-label')));
        logger.info('🔍 DOM Discovery: All aria-labels containing "calendar":', allAriaLabels.filter(label => label?.toLowerCase().includes('calendar')));
        
        // Check if we're on the right page
        if (!window.location.href.includes('calendar.google.com')) {
          logger.error('🚀 App Initialization: Not on Google Calendar page');
          throw new Error('Not on Google Calendar page');
        }
        logger.info('🚀 App Initialization: URL validation passed - on Google Calendar');
        
        // Load presets and current calendar state in parallel
        logger.info('🚀 App Initialization: Loading presets and calendar state in parallel...');
        const [loadedPresets, calendars] = await Promise.all([
          presetRepository.getAllPresets(),
          calendarRepository.getCurrentCalendarStates()
        ]);
        
        logger.info(`🚀 App Initialization: Data loaded - Presets: ${loadedPresets.length}, Calendars: ${calendars.length}`);
        
        setPresets(loadedPresets);
        setCurrentCalendars(calendars);
        
        logger.info('🚀 App Initialization: App state updated with loaded data');
      } catch (error) {
        logger.error('🚀 App Initialization: Failed to load data:', error);
        notification.error({
          message: 'Failed to load data',
          description: 'Unable to load calendar presets and current state.'
        });
      } finally {
        setLoading(false);
        logger.info('🚀 App Initialization: Data loading completed - loading state set to false');
      }
    };

    loadData();
  }, [presetRepository, calendarRepository]);

  /**
   * Refresh presets after import/save/delete operations
   */
  const refreshPresets = async () => {
    logger.info('🔄 Data Refresh: Starting presets refresh...');
    try {
      const updatedPresets = await presetRepository.getAllPresets();
      setPresets(updatedPresets);
      logger.info(`🔄 Data Refresh: Presets refreshed successfully - ${updatedPresets.length} presets loaded`);
    } catch (error) {
      logger.error('🔄 Data Refresh: Failed to refresh presets:', error);
    }
  };

  /**
   * Refresh calendar state after operations (with debouncing to avoid excessive calls)
   */
  const refreshCalendars = React.useCallback(async () => {
    logger.info('🔄 Data Refresh: Starting calendar state refresh...');
    try {
      // Log performance metrics if available
      if ('logPerformanceMetrics' in calendarRepository) {
        logger.info('🔄 Data Refresh: Logging repository performance metrics...');
        (calendarRepository as any).logPerformanceMetrics();
      }
      
      const updatedCalendars = await calendarRepository.getCurrentCalendarStates();
      setCurrentCalendars(updatedCalendars);
      
      const visibleCount = updatedCalendars.filter(cal => cal.isVisible).length;
      logger.info(`🔄 Data Refresh: Calendar state refreshed successfully - ${updatedCalendars.length} total calendars, ${visibleCount} visible`);
    } catch (error) {
      logger.error('🔄 Data Refresh: Failed to refresh calendars:', error);
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