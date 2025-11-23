/**
 * Calendar Extension App
 * Main React application component that coordinates all calendar functionality
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ConfigProvider, theme } from 'antd';
import * as Mousetrap from 'mousetrap';
import { LensHeaderButton } from './components/CalendarToolbar.component';
import logger from '../infrastructure/logger';
import { showCustomNotification } from './utils/customNotification';
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
        logger.info('🚀 App Initialization: Loading presets and fresh calendar state in parallel...');
        const [loadedPresets, calendars] = await Promise.all([
          presetRepository.getAllPresets(),
          // Use fresh state on app initialization to ensure we have current DOM state
          (calendarRepository as any).getCurrentCalendarStatesFresh ? 
            (calendarRepository as any).getCurrentCalendarStatesFresh() : 
            calendarRepository.getCurrentCalendarStates()
        ]);
        
        logger.info(`🚀 App Initialization: Data loaded - Presets: ${loadedPresets.length}, Calendars: ${calendars.length}`);
        
        setPresets(loadedPresets);
        setCurrentCalendars(calendars);
        
        logger.info('🚀 App Initialization: App state updated with loaded data');
      } catch (error) {
        logger.error('🚀 App Initialization: Failed to load data:', error);
        showCustomNotification('Failed to load data', 'Unable to load calendar presets and current state.', 'error');
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

  /**
   * Handle keyboard shortcuts for various calendar operations
   */
  const handleKeyboardShortcuts = useCallback(() => {
    logger.info('⌨️  Hotkeys: Setting up keyboard shortcuts');

    // Ctrl+Alt: Open Lens menu
    Mousetrap.bind('ctrl+alt', (e) => {
      e.preventDefault();
      logger.info('⌨️  Hotkey: Ctrl+Alt pressed - Open Lens Menu');
      
      // Find and click the Lens floating action button to open the menu
      const lensButton = document.querySelector('[data-testid="lens-floating-button"]') as HTMLElement;
      if (lensButton) {
        lensButton.click();
        logger.info('⌨️  Hotkey: Lens menu opened successfully');
      } else {
        logger.warn('⌨️  Hotkey: Lens floating button not found in DOM');
        showCustomNotification('Menu Access', 'Lens menu button not found. Please try again.', 'warning');
      }
      return false;
    });

    // Ctrl+Alt+E: Enable calendar by name
    Mousetrap.bind('ctrl+alt+e', (e) => {
      e.preventDefault();
      logger.info('⌨️  Hotkey: Ctrl+Alt+E pressed - Enable Calendar');
      const searchTerm = prompt('Enter calendar name or email to enable:');
      if (searchTerm) {
        // Find matching calendars
        const matchingCalendars = currentCalendars.filter(cal => 
          cal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cal.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        if (matchingCalendars.length > 0) {
          const calendar = matchingCalendars[0];
          enableCalendarUseCase.execute(calendar.email)
            .then(() => {
              showCustomNotification('Calendar Enabled', `Calendar "${calendar.name}" has been enabled.`, 'success');
              refreshCalendars();
            })
            .catch((error) => {
              logger.error('⌨️  Hotkey: Failed to enable calendar:', error);
              showCustomNotification('Enable Failed', `Failed to enable calendar: ${error.message}`, 'error');
            });
        } else {
          showCustomNotification('Calendar Not Found', `No calendar found matching "${searchTerm}".`, 'warning');
        }
      }
      return false;
    });

    // Ctrl+Alt+S: Save current state as preset
    Mousetrap.bind('ctrl+alt+s', (e) => {
      e.preventDefault();
      logger.info('⌨️  Hotkey: Ctrl+Alt+S pressed - Save Preset');
      const presetName = prompt('Enter name for the new preset:');
      if (presetName) {
        savePresetUseCase.execute({ name: presetName.trim(), overwrite: false })
          .then(() => {
            showCustomNotification('Preset Saved', `Preset "${presetName}" has been saved.`, 'success');
            refreshPresets();
          })
          .catch((error) => {
            logger.error('⌨️  Hotkey: Failed to save preset:', error);
            showCustomNotification('Save Failed', `Failed to save preset: ${error.message}`, 'error');
          });
      }
      return false;
    });

    // Ctrl+Alt+C: Clear all calendars
    Mousetrap.bind('ctrl+alt+c', (e) => {
      e.preventDefault();
      logger.info('⌨️  Hotkey: Ctrl+Alt+C pressed - Clear All Calendars');
      clearCalendarsUseCase.execute()
        .then(() => {
          showCustomNotification('Calendars Cleared', 'All calendars have been hidden. Use Restore to bring them back.', 'success');
          refreshCalendars();
        })
        .catch((error) => {
          logger.error('⌨️  Hotkey: Failed to clear calendars:', error);
          showCustomNotification('Clear Failed', `Failed to clear calendars: ${error.message}`, 'error');
        });
      return false;
    });

    // Ctrl+Alt+P: Focus preset dropdown
    Mousetrap.bind('ctrl+alt+p', (e) => {
      e.preventDefault();
      logger.info('⌨️  Hotkey: Ctrl+Alt+P pressed - Focus Preset Dropdown');
      
      // First ensure the Lens menu is open
      const lensButton = document.querySelector('[data-testid="lens-floating-button"]') as HTMLElement;
      if (lensButton) {
        lensButton.click();
        
        // Wait a brief moment for the dropdown to render, then focus on preset selector
        setTimeout(() => {
          const presetDropdown = document.querySelector('.ant-select-selector') as HTMLElement;
          if (presetDropdown) {
            presetDropdown.click();
            logger.info('⌨️  Hotkey: Preset dropdown focused successfully');
          } else {
            logger.warn('⌨️  Hotkey: Preset dropdown not found in DOM');
            showCustomNotification('Dropdown Access', 'Preset dropdown not found. Please ensure Lens menu is open.', 'warning');
          }
        }, 100);
      } else {
        logger.warn('⌨️  Hotkey: Lens floating button not found in DOM');
        showCustomNotification('Menu Access', 'Lens menu button not found. Please try again.', 'warning');
      }
      return false;
    });

    logger.info('⌨️  Hotkeys: All keyboard shortcuts registered successfully');
  }, [currentCalendars, enableCalendarUseCase, savePresetUseCase, clearCalendarsUseCase, refreshPresets, refreshCalendars]);

  /**
   * Setup keyboard shortcuts when component mounts
   */
  useEffect(() => {
    handleKeyboardShortcuts();
    
    // Cleanup function to unbind shortcuts on unmount
    return () => {
      logger.info('⌨️  Hotkeys: Cleaning up keyboard shortcuts');
      Mousetrap.unbind(['ctrl+alt', 'ctrl+alt+e', 'ctrl+alt+s', 'ctrl+alt+c', 'ctrl+alt+p']);
    };
  }, [handleKeyboardShortcuts]);

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