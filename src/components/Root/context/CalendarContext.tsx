import React, { createContext, useState, useContext, useEffect, useRef, useCallback } from 'react';
import CalendarManager from '../../../services/calendar_manager';
import { CalendarGroup } from "../../../types/CalendarGroup";
import { DropdownItem } from "../../../types/DropdownItem";

interface CalendarContextType {
  groups: CalendarGroup;
  dropdownItems: DropdownItem[];
  refreshGroupsState: () => void;
}

export const CalendarContext = createContext<CalendarContextType | null>(null);

export function useCalendarContext() {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendarContext must be used within a CalendarProvider');
  }
  return context;
}

// Simple debounce function
const debounce = (fn: Function, ms = 300) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function(this: any, ...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
};

export function CalendarProvider({ children }: { children: React.ReactNode }) {
  const [groups, setGroups] = useState<CalendarGroup>(CalendarManager.groups || {});
  const [dropdownItems, setDropdownItems] = useState<DropdownItem[]>([]);
  const isUpdatingRef = useRef(false);
  const refreshFunctionRef = useRef<any>(null);
  
  // Group-related functions with debouncing to prevent excessive updates
  // Use useCallback to ensure function identity is preserved across renders
  const refreshGroupsState = useCallback(() => {
    // Skip if we're already in the process of updating
    if (isUpdatingRef.current) return;
    
    try {
      isUpdatingRef.current = true;
      console.log('Refreshing groups state...');
      
      // Get latest groups from CalendarManager
      const currentGroups = CalendarManager.groups || {};
      setGroups({ ...currentGroups });
      
      // Update dropdown items
      const items: DropdownItem[] = [];
      for (const key in currentGroups) {
        if (!key.startsWith('__') && !key.startsWith('saved_')) {
          items.push({
            text: key,
            value: key
          });
        }
      }
      
      setDropdownItems(items);
      console.log('Updated dropdown items:', items);
    } finally {
      // Reset the flag after a short delay to allow other updates to complete
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 100);
    }
  }, []);
  
  // Create a stable debounced version of refreshGroupsState that won't change on every render
  useEffect(() => {
    refreshFunctionRef.current = debounce(refreshGroupsState, 300);
  }, [refreshGroupsState]);
  
  // Listen for custom events from CalendarManager
  useEffect(() => {
    const debouncedRefresh = refreshFunctionRef.current;
    if (!debouncedRefresh) return;
    
    console.log('Setting up calendar change listeners');
    
    // Store the original callback
    const originalOnGroupsChange = CalendarManager.onGroupsChange;
    
    // Set up our callback
    CalendarManager.onGroupsChange = () => {
      debouncedRefresh();
      // Only call original if it's not our function and not undefined
      if (originalOnGroupsChange && 
          originalOnGroupsChange !== debouncedRefresh && 
          originalOnGroupsChange !== refreshGroupsState) {
        originalOnGroupsChange();
      }
    };
    
    // Also listen for the custom event, but avoid duplicate refreshes
    const handleGroupsChanged = (event: Event) => {
      console.log('Detected groups changed event');
      // Only refresh if we're not already updating and onGroupsChange isn't our function
      if (!isUpdatingRef.current && 
          CalendarManager.onGroupsChange !== debouncedRefresh && 
          CalendarManager.onGroupsChange !== refreshGroupsState) {
        debouncedRefresh();
      }
    };
    
    document.addEventListener('calendar-groups-changed', handleGroupsChanged);
    
    // Initialize state with a delay to ensure everything is loaded
    // Using a timeout to ensure we don't start a re-render cycle during mount
    const initTimeout = setTimeout(() => {
      debouncedRefresh();
    }, 200);
    
    return () => {
      // Clean up
      document.removeEventListener('calendar-groups-changed', handleGroupsChanged);
      
      // Restore original callback only if our callback was set
      if (CalendarManager.onGroupsChange === debouncedRefresh || 
          CalendarManager.onGroupsChange === refreshGroupsState) {
        CalendarManager.onGroupsChange = originalOnGroupsChange;
      }
      
      clearTimeout(initTimeout);
    };
  }, [refreshGroupsState]);
  
  // Set up the context value - using the original non-debounced function for the API
  const contextValue = React.useMemo(() => ({
    groups,
    dropdownItems,
    refreshGroupsState,
  }), [groups, dropdownItems, refreshGroupsState]);
  
  return (
    <CalendarContext.Provider value={contextValue}>
      {children}
    </CalendarContext.Provider>
  );
}
