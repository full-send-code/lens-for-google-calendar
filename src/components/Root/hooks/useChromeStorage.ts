import { useEffect, useRef, useCallback } from 'react';
import CalendarManager from '../../../services/calendar_manager';
import { useCalendarContext } from '../context/CalendarContext';

// Simple debounce function to limit operations
const debounce = (fn: Function, ms = 300) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function(this: any, ...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
};

export function useChromeStorage() {
  // Get refreshGroupsState from context, but don't use it as a direct dependency
  const { refreshGroupsState } = useCalendarContext();
  const refreshRef = useRef(refreshGroupsState);
  const lastSavedRef = useRef<string>('');
  const isSavingRef = useRef<boolean>(false);
  
  // Keep the refreshGroupsState reference updated but don't cause effect reruns
  useEffect(() => {
    refreshRef.current = refreshGroupsState;
  }, [refreshGroupsState]);
  
  // Create stable callbacks that don't change on re-renders
  const safeRefreshGroups = useCallback(() => {
    if (refreshRef.current) {
      refreshRef.current();
    }
  }, []);
  
  const loadFromStorage = useCallback(() => {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        console.log('Loading groups from Chrome storage');
        chrome.storage.sync.get(['gcSelector_groups', 'gcSelector_last_updated'], (items) => {
          if (items.gcSelector_groups) {
            try {
              const loadedGroups = JSON.parse(items.gcSelector_groups);
              // Save this as our last saved state to avoid immediate re-saving
              lastSavedRef.current = items.gcSelector_groups;
              
              console.log('Loaded groups from storage:', Object.keys(loadedGroups).filter(k => !k.startsWith('__')));
              CalendarManager.setGroups(loadedGroups);
              safeRefreshGroups();
            } catch (e) {
              console.error('Error parsing saved groups:', e);
            }
          } else {
            console.log('No saved groups found in storage');
          }
        });
      } else {
        console.warn('Chrome storage API not available');
      }
    } catch (e) {
      console.warn('Not running in Chrome extension environment');
    }
  }, [safeRefreshGroups]);
  
  useEffect(() => {
    console.log('Setting up Chrome storage integration');
    
    // Save to storage when groups change - with debouncing and change detection
    const saveGroups = debounce(() => {
      try {
        // Prevent saving if we're already in the process
        if (isSavingRef.current) {
          return;
        }
        
        if (typeof chrome !== 'undefined' && chrome.storage) {
          const exportedGroups = CalendarManager.exportGroups(true);
          
          // Skip saving if there are no groups to save
          const groupKeys = Object.keys(exportedGroups).filter(k => !k.startsWith('__'));
          if (groupKeys.length === 0) {
            console.log('No groups to save, skipping storage update');
            return;
          }
          
          // Convert to string for comparison and storage
          const exportedGroupsString = JSON.stringify(exportedGroups);
          
          // Only save if the data has actually changed
          if (exportedGroupsString === lastSavedRef.current) {
            console.log('Groups unchanged, skipping storage update');
            return;
          }
          
          console.log(`Saving ${groupKeys.length} groups to Chrome storage:`, groupKeys);
          
          // Mark that we're saving to prevent concurrent saves
          isSavingRef.current = true;
          
          chrome.storage.sync.set({ 
            gcSelector_groups: exportedGroupsString,
            gcSelector_last_updated: new Date().toISOString()
          }, () => {
            // Update last saved state and reset saving flag
            lastSavedRef.current = exportedGroupsString;
            isSavingRef.current = false;
            console.log('Successfully saved groups to Chrome storage');
          });
        }
      } catch (e) {
        console.warn('Unable to save to Chrome storage:', e);
        isSavingRef.current = false;
      }
    }, 1000); // 1 second debounce
    
    // Handle storage changes from other instances
    const handleStorageChange = (changes: any, areaName: string) => {
      if (areaName === 'sync' && changes.gcSelector_groups) {
        try {
          // Skip if we're the ones who made the change
          const newValue = changes.gcSelector_groups.newValue;
          if (newValue === lastSavedRef.current) {
            console.log('Ignoring storage change triggered by this instance');
            return;
          }
          
          const newGroups = JSON.parse(newValue);
          console.log('Storage updated from another instance, loading new groups');
          
          // Update our saved state
          lastSavedRef.current = newValue;
          
          // Update CalendarManager
          CalendarManager.setGroups(newGroups);
          safeRefreshGroups();
        } catch (e) {
          console.error('Error handling storage change:', e);
        }
      }
    };
    
    // Listen for the custom event from CalendarManager, with debouncing
    const handleGroupsChanged = debounce(() => {
      console.log('Groups changed event detected, preparing to save');
      saveGroups();
    }, 500);
    
    // Set up event listeners
    document.addEventListener('calendar-groups-changed', handleGroupsChanged);
    
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.onChanged.addListener(handleStorageChange);
    }
    
    // Initial load
    loadFromStorage();
    
    // Cleanup
    return () => {
      document.removeEventListener('calendar-groups-changed', handleGroupsChanged);
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.onChanged.removeListener(handleStorageChange);
      }
    };
  }, [loadFromStorage, safeRefreshGroups]);
}
