import CalendarManager from '../../../services/calendar_manager';
import { useCalendarContext } from '../context/CalendarContext';

export function useCalendarActions(showMessage: (msg: string) => void) {
  const { refreshGroupsState } = useCalendarContext();
  
  return {
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
    }
  };
}
