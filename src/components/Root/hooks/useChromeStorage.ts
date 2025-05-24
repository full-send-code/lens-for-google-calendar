import { useEffect, useRef, useCallback } from 'react';
import CalendarManager from '../../../services/CalendarManager';
import { useCalendarContext } from '../context/CalendarContext';
import { throttle } from '../../../utils/common';
import * as Logger from '../../../utils/logger';

// Storage keys used by the application
const STORAGE_KEYS = {
  GROUPS: 'gcSelector_groups',
  LAST_UPDATED: 'gcSelector_last_updated',
  SETTINGS: 'gcSelector_settings'
};

/**
 * Chrome storage integration hook
 * Manages synchronization of calendar groups with Chrome's storage API
 */
export function useChromeStorage() {
  // Get refreshGroupsState from context
  const { refreshGroupsState } = useCalendarContext();
  
  // Refs to track state between renders
  const lastSavedRef = useRef<string>('');
  const isSavingRef = useRef<boolean>(false);
  const isLoadingRef = useRef<boolean>(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Check if Chrome storage is available
  const isChromeStorageAvailable = useCallback((): boolean => {
    return typeof chrome !== 'undefined' && !!chrome.storage && !!chrome.storage.sync;
  }, []);
  
  // Load groups from Chrome storage
  const loadFromStorage = useCallback(async () => {
    if (!isChromeStorageAvailable() || isLoadingRef.current) {
      return;
    }
    
    try {
      isLoadingRef.current = true;
      Logger.startPerformanceTracking('loadFromStorage');
      
      const items = await new Promise<{ [key: string]: any }>((resolve) => {
        chrome.storage.sync.get([STORAGE_KEYS.GROUPS], (result) => {
          resolve(result);
        });
      });
      
      if (!items[STORAGE_KEYS.GROUPS]) {
        Logger.debug('No calendar groups found in storage');
        return;
      }
      
      const loadedGroups = JSON.parse(items[STORAGE_KEYS.GROUPS]);
      
      // Save this as our last saved state to avoid immediate re-saving
      lastSavedRef.current = items[STORAGE_KEYS.GROUPS];
      
      // Update CalendarManager with the loaded groups
      CalendarManager.setGroups(loadedGroups);
      refreshGroupsState();
      
      Logger.info('Loaded calendar groups from storage', { 
        groupCount: Object.keys(loadedGroups).filter(k => !k.startsWith('__')).length 
      });
    } catch (error) {
      Logger.error('Error loading saved groups:', error);
    } finally {
      isLoadingRef.current = false;
      Logger.endPerformanceTracking('loadFromStorage');
    }
  }, [isChromeStorageAvailable, refreshGroupsState]);
  
  // Save groups to Chrome storage with throttling
  const saveGroups = useCallback(
    throttle(async () => {
      // Prevent saving if we're already in process or storage isn't available
      if (isSavingRef.current || !isChromeStorageAvailable()) {
        return;
      }
      
      try {
        Logger.startPerformanceTracking('saveGroups');
        
        // Get groups to export, including internal ones
        const exportedGroups = CalendarManager.exportGroups(true);
        
        // Skip saving if there are no groups to save
        const groupKeys = Object.keys(exportedGroups).filter(k => !k.startsWith('__'));
        if (groupKeys.length === 0) {
          Logger.debug('No groups to save');
          return;
        }
        
        // Convert to string for comparison and storage
        const exportedGroupsString = JSON.stringify(exportedGroups);
        
        // Only save if the data has actually changed
        if (exportedGroupsString === lastSavedRef.current) {
          Logger.debug('Groups unchanged, skipping save');
          return;
        }
        
        // Mark that we're saving to prevent concurrent saves
        isSavingRef.current = true;
        
        // Create data to save
        const dataToSave = { 
          [STORAGE_KEYS.GROUPS]: exportedGroupsString,
          [STORAGE_KEYS.LAST_UPDATED]: new Date().toISOString()
        };
        
        await new Promise<void>((resolve) => {
          chrome.storage.sync.set(dataToSave, () => {
            resolve();
          });
        });
        
        // Update last saved state
        lastSavedRef.current = exportedGroupsString;
        Logger.info('Saved calendar groups to storage', { groupCount: groupKeys.length });
      } catch (error) {
        Logger.error('Error saving groups to storage:', error);
      } finally {
        // Reset saving flag
        isSavingRef.current = false;
        Logger.endPerformanceTracking('saveGroups');
      }
    }, 1000), 
    [isChromeStorageAvailable]
  );
  
  // Effect for storage management
  useEffect(() => {
    // Handle storage changes from other instances
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
      if (areaName !== 'sync' || !changes[STORAGE_KEYS.GROUPS]) {
        return;
      }
      
      // Skip if we're the ones who made the change
      const newValue = changes[STORAGE_KEYS.GROUPS].newValue;
      if (newValue === lastSavedRef.current) {
        return;
      }
      
      try {
        Logger.startPerformanceTracking('handleStorageChange');
        
        const newGroups = JSON.parse(newValue);
        
        // Update our saved state
        lastSavedRef.current = newValue;
        
        // Update CalendarManager
        CalendarManager.setGroups(newGroups);
        refreshGroupsState();
        
        Logger.info('Updated calendar groups from external storage change', {
          groupCount: Object.keys(newGroups).filter(k => !k.startsWith('__')).length
        });
      } catch (error) {
        Logger.error('Error handling storage change:', error);
      } finally {
        Logger.endPerformanceTracking('handleStorageChange');
      }
    };
    
    // Listen for the custom event from CalendarManager
    const handleGroupsChanged = () => {
      // Clear any pending save timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      // Schedule a save with a short delay to batch multiple rapid changes
      saveTimeoutRef.current = setTimeout(() => {
        saveGroups();
        saveTimeoutRef.current = null;
      }, 300);
    };
    
    // Set up event listeners
    document.addEventListener('calendar-groups-changed', handleGroupsChanged);
    
    // Set up storage change listener if available
    if (isChromeStorageAvailable()) {
      chrome.storage.onChanged.addListener(handleStorageChange);
    }
    
    // Register with CalendarManager to get notifications
    const cleanup = CalendarManager.addChangeListener(handleGroupsChanged);
    
    // Initial load
    loadFromStorage();
    
    // Cleanup function
    return () => {
      document.removeEventListener('calendar-groups-changed', handleGroupsChanged);
      
      if (isChromeStorageAvailable()) {
        chrome.storage.onChanged.removeListener(handleStorageChange);
      }
      
      // Remove change listener
      cleanup();
      
      // Clear any pending timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [loadFromStorage, saveGroups, refreshGroupsState, isChromeStorageAvailable]);
  
  // Return nothing - this hook just handles side effects
}
