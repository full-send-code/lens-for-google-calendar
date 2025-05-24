import React, { useCallback, useState, useRef } from 'react';
import CalendarManager from '../../../services/CalendarManager';
import { useCalendarContext } from '../context/CalendarContext';
import { trySelectors } from '../../../utils/common';
import * as Logger from '../../../utils/logger';

/**
 * Hook for calendar actions
 * Provides all calendar management functionality for the UI
 */
export function useCalendarActions(showMessage: (msg: string) => void) {
  const { refreshGroupsState, isLoading } = useCalendarContext();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  
  // Use a ref to track ongoing operations to prevent duplicate actions
  const pendingOperationRef = useRef<string | null>(null);
  
  // Actions with error handling and performance tracking
  const executeAction = useCallback(async (
    action: () => Promise<void> | void, 
    successMessage: string,
    operationName: string
  ) => {
    // Prevent duplicate operations
    if (pendingOperationRef.current === operationName || isLoading) {
      Logger.warn(`Operation ${operationName} already in progress, skipping`);
      return;
    }
    
    try {
      // Mark operation as pending
      pendingOperationRef.current = operationName;
      Logger.startPerformanceTracking(`action:${operationName}`);
      
      await action();
      
      // Show success message and log completion
      showMessage(successMessage);
      Logger.endPerformanceTracking(`action:${operationName}`);
    } catch (error) {
      // Handle errors
      Logger.error(`Action ${operationName} failed:`, error);
      showMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      // Clear pending operation
      pendingOperationRef.current = null;
    }
  }, [showMessage, isLoading]);

  // Calendar manipulation actions
  const enableCalendar = useCallback(async () => {
    const name = prompt('Calendar name to enable:');
    if (name) {
      await executeAction(
        () => CalendarManager.enableCalendar(name),
        `Enabled calendar: ${name}`,
        `enableCalendar:${name}`
      );
    }
  }, [executeAction]);
  
  const saveAs = useCallback(async () => {
    const name = prompt('Save calendar selection as:');
    if (name) {
      await executeAction(
        async () => {
          await CalendarManager.saveCalendarSelections(name);
          refreshGroupsState();
        },
        `Saved calendar selection as: ${name}`,
        `saveAs:${name}`
      );
    }
  }, [executeAction, refreshGroupsState]);
  
  const restore = useCallback(async () => {
    await executeAction(
      () => CalendarManager.restoreCalendarSelections(),
      'Restored last saved calendar selection',
      'restore'
    );
  }, [executeAction]);
  
  const clear = useCallback(async () => {
    await executeAction(
      () => CalendarManager.disableAll(),
      'Disabled all calendars',
      'disableAll'
    );
  }, [executeAction]);
  
  // Menu and item management
  const handleImport = useCallback((importedGroups: any) => {
    executeAction(
      () => {
        CalendarManager.setGroups(importedGroups);
        refreshGroupsState();
      },
      'Imported presets successfully',
      'importGroups'
    );
  }, [executeAction, refreshGroupsState]);
  
  const handleItemSelect = useCallback((item: { text: string; value: string }) => {
    executeAction(
      () => CalendarManager.showGroup(item.value),
      `Loaded preset: ${item.text}`,
      `showGroup:${item.value}`
    );
  }, [executeAction]);
  
  const handleItemDelete = useCallback((item: { text: string; value: string }) => {
    if (confirm(`Delete preset "${item.text}"?`)) {
      executeAction(
        () => {
          CalendarManager.deleteGroup(item.value);
          refreshGroupsState();
        },
        `Deleted preset: ${item.text}`,
        `deleteGroup:${item.value}`
      );
    }
  }, [executeAction, refreshGroupsState]);
  
  // Menu handling
  const openPresetsMenu = useCallback(async (event?: React.MouseEvent<HTMLElement>) => {
    if (event?.currentTarget) {
      setAnchorEl(event.currentTarget);
      return;
    }
    
    // Use the utility function to try multiple selectors
    const presetsButton = trySelectors<HTMLElement>([
      '[data-action-button="Presets"]',
      '#action-button-Presets',
      'button[aria-label="Manage preset groups"]'
    ]);
    
    // Last resort - use the active element
    setAnchorEl(presetsButton || document.activeElement as HTMLElement);
  }, []);
  
  const closePresetsMenu = useCallback(() => {
    setAnchorEl(null);
  }, []);
  
  return {
    anchorEl,
    enableCalendar,
    saveAs,
    restore,
    clear,
    handleImport,
    handleItemSelect,
    handleItemDelete,
    openPresetsMenu,
    closePresetsMenu,
    isLoading
  };
}
