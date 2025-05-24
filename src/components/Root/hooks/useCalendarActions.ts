import React from 'react';
import CalendarManager from '../../../services/calendar_manager';
import { useCalendarContext } from '../context/CalendarContext';

export function useCalendarActions(showMessage: (msg: string) => void) {
  const { refreshGroupsState } = useCalendarContext();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  
  return {
    anchorEl,
    enableCalendar: async () => {
      const name = prompt('Calendar name to enable:');
      if (name) {
        await CalendarManager.enableCalendar(name);
        showMessage(`Enabled calendar: ${name}`);
      }
    },
    
    toggleCalendar: async () => {
      const name = prompt('Calendar name to toggle:');
      if (name) {
        await CalendarManager.toggleCalendar(name);
        showMessage(`Toggled calendar: ${name}`);
      }
    },
    
    saveAs: async () => {
      const name = prompt('Save calendar selection as:');
      if (name) {
        await CalendarManager.saveCalendarSelections(name);
        refreshGroupsState();
        showMessage(`Saved calendar selection as: ${name}`);
      }
    },
    
    restore: async () => {
      CalendarManager.restoreCalendarSelections();
      showMessage('Restored last saved calendar selection');
    },
    
    clear: async () => {
      await CalendarManager.disableAll();
      showMessage('Disabled all calendars');
    },

    handleImport: (importedGroups: any) => {
      CalendarManager.setGroups(importedGroups);
      refreshGroupsState();
      showMessage('Imported presets successfully');
    },

    handleItemSelect: (item: { text: string; value: string }) => {
      CalendarManager.showGroup(item.value);
      showMessage(`Loaded preset: ${item.text}`);
    },

    handleItemDelete: (item: { text: string; value: string }) => {
      if (confirm(`Delete preset "${item.text}"?`)) {
        CalendarManager.deleteGroup(item.value);
        refreshGroupsState();
        showMessage(`Deleted preset: ${item.text}`);
      }
    },    openPresetsMenu: async (event?: React.MouseEvent<HTMLElement>) => {
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
    },

    closePresetsMenu: () => {
      setAnchorEl(null);
    }
  };
}
