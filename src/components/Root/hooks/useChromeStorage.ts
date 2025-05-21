import { useEffect } from 'react';
import CalendarManager from '../../../services/calendar_manager';
import { useCalendarContext } from '../context/CalendarContext';

export function useChromeStorage() {
  const { refreshGroupsState } = useCalendarContext();

  useEffect(() => {
    // Load from storage
    try {
      if (chrome && chrome.storage) {
        chrome.storage.sync.get(['gcSelector_groups'], (items) => {
          if (items.gcSelector_groups) {
            try {
              const loadedGroups = JSON.parse(items.gcSelector_groups);
              CalendarManager.setGroups(loadedGroups);
              refreshGroupsState();
            } catch (e) {
              console.error('Error parsing saved groups:', e);
            }
          }
        });
      }
    } catch (e) {
      console.warn('Not running in Chrome extension environment');
    }
    
    // Save to storage when groups change
    const saveGroups = () => {
      try {
        if (chrome && chrome.storage) {
          const exportedGroups = JSON.stringify(CalendarManager.exportGroups(true));
          chrome.storage.sync.set({ gcSelector_groups: exportedGroups });
        }
      } catch (e) {
        console.warn('Unable to save to Chrome storage:', e);
      }
    };
    
    // Setup the groups change handler
    const originalOnGroupsChange = CalendarManager.onGroupsChange;
    
    CalendarManager.onGroupsChange = () => {
      refreshGroupsState();
      saveGroups();
      if (originalOnGroupsChange) {
        originalOnGroupsChange();
      }
    };
    
    // Cleanup
    return () => {
      CalendarManager.onGroupsChange = originalOnGroupsChange;
    };
  }, [refreshGroupsState]);
}
