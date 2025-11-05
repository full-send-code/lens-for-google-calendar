/**
 * Calendar Extension App
 * Main React application component that coordinates all calendar functionality
 */

import React, { useState, useEffect } from 'react';
import { ConfigProvider, theme, notification } from 'antd';
import { LensHeaderButton } from './components/CalendarToolbar.component';
import type { 
  ClearCalendarsUseCase,
  EnableCalendarUseCase,
  ApplyPresetUseCase,
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
        
        // Load presets and current calendar state in parallel
        const [loadedPresets, calendars] = await Promise.all([
          presetRepository.getAllPresets(),
          calendarRepository.getCurrentCalendarStates()
        ]);
        
        setPresets(loadedPresets);
        setCurrentCalendars(calendars);
      } catch (error) {
        console.error('Failed to load data:', error);
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
   * Refresh presets after import operations
   */
  const refreshPresets = async () => {
    try {
      const updatedPresets = await presetRepository.getAllPresets();
      setPresets(updatedPresets);
    } catch (error) {
      console.error('Failed to refresh presets:', error);
    }
  };

  /**
   * Refresh calendar state after operations
   */
  const refreshCalendars = async () => {
    try {
      const updatedCalendars = await calendarRepository.getCurrentCalendarStates();
      setCurrentCalendars(updatedCalendars);
    } catch (error) {
      console.error('Failed to refresh calendars:', error);
    }
  };

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
        importPresetsUseCase={importPresetsUseCase}
        exportPresetsUseCase={exportPresetsUseCase}
        presets={presets}
        currentCalendars={currentCalendars}
        loading={loading}
        onPresetsChange={refreshPresets}
      />
    </ConfigProvider>
  );
};