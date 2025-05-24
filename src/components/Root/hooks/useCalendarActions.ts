import React, { useCallback, useRef } from 'react';
import CalendarManager from '../../../services/calendar_manager';
import { useCalendarContext } from '../context/CalendarContext';

export function useCalendarActions(showMessage: (msg: string) => void) {
  const { refreshGroupsState } = useCalendarContext();
  const refreshRef = useRef(refreshGroupsState);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  
  // Update the ref when refreshGroupsState changes
  React.useEffect(() => {
    refreshRef.current = refreshGroupsState;
  }, [refreshGroupsState]);
  
  // Safe way to refresh groups that doesn't change on re-renders
  const safeRefreshGroups = useCallback(() => {
    if (refreshRef.current) {
      refreshRef.current();
    }
  }, []);
  
  const enableCalendar = useCallback(async () => {
    const name = prompt('Calendar name to enable:');
    if (name) {
      await CalendarManager.enableCalendar(name);
      showMessage(`Enabled calendar: ${name}`);
    }
  }, [showMessage]);
  
  const toggleCalendar = useCallback(async () => {
    const name = prompt('Calendar name to toggle:');
    if (name) {
      await CalendarManager.toggleCalendar(name);
      showMessage(`Toggled calendar: ${name}`);
    }
  }, [showMessage]);
  
  const saveAs = useCallback(async () => {
    const name = prompt('Save calendar selection as:');
    if (name) {
      await CalendarManager.saveCalendarSelections(name);
      safeRefreshGroups();
      showMessage(`Saved calendar selection as: ${name}`);
    }
  }, [showMessage, safeRefreshGroups]);
  
  const restore = useCallback(async () => {
    CalendarManager.restoreCalendarSelections();
    showMessage('Restored last saved calendar selection');
  }, [showMessage]);
  
  const clear = useCallback(async () => {
    await CalendarManager.disableAll();
    showMessage('Disabled all calendars');
  }, [showMessage]);
  
  const handleImport = useCallback((importedGroups: any) => {
    CalendarManager.setGroups(importedGroups);
    safeRefreshGroups();
    showMessage('Imported presets successfully');
  }, [showMessage, safeRefreshGroups]);
  
  const handleItemSelect = useCallback((item: { text: string; value: string }) => {
    CalendarManager.showGroup(item.value);
    showMessage(`Loaded preset: ${item.text}`);
  }, [showMessage]);
  
  const handleItemDelete = useCallback((item: { text: string; value: string }) => {
    if (confirm(`Delete preset "${item.text}"?`)) {
      CalendarManager.deleteGroup(item.value);
      safeRefreshGroups();
      showMessage(`Deleted preset: ${item.text}`);
    }
  }, [showMessage, safeRefreshGroups]);
  
  const openPresetsMenu = useCallback(async (event?: React.MouseEvent<HTMLElement>) => {
    // If we have an event, use the target as anchor element
    if (event && event.currentTarget) {
      setAnchorEl(event.currentTarget);
    } else {
      // Fallback to finding the Presets button by data attribute
      const presetsButton = document.querySelector('[data-action-button="Presets"]') || 
                          document.getElementById('action-button-Presets');
      
      if (presetsButton) {
        setAnchorEl(presetsButton as HTMLElement);
      } else {
        // Secondary fallback - use any button with the settings icon
        const settingsButton = document.querySelector('button[aria-label="Manage preset groups"]');
        if (settingsButton) {
          setAnchorEl(settingsButton as HTMLElement);
        } else {
          // Last resort - use the active element
          const target = document.activeElement as HTMLElement | null;
          setAnchorEl(target);
        }
      }
    }
  }, []);
  
  const closePresetsMenu = useCallback(() => {
    setAnchorEl(null);
  }, []);
  
  return {
    anchorEl,
    enableCalendar,
    toggleCalendar,
    saveAs,
    restore,
    clear,
    handleImport,
    handleItemSelect,
    handleItemDelete,
    openPresetsMenu,
    closePresetsMenu
  };
}
