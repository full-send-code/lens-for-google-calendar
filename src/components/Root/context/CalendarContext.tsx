import React, { createContext, useContext, useEffect, useReducer, useCallback, useMemo, useRef } from 'react';
import CalendarManager from '../../../services/CalendarManager';
import { CalendarGroup } from "../../../types/CalendarGroup";
import { DropdownItem } from "../../../types/DropdownItem";
import { throttle } from '../../../utils/common';
import * as Logger from '../../../utils/logger';
import { memoize } from '../../../utils/memoize';

// Define the context type
interface CalendarContextType {
  groups: CalendarGroup;
  dropdownItems: DropdownItem[];
  refreshGroupsState: () => void;
  isLoading: boolean;
}

// Action types for the reducer
type CalendarAction = 
  | { type: 'REFRESH_GROUPS'; groups: CalendarGroup }
  | { type: 'SET_DROPDOWN_ITEMS'; items: DropdownItem[] }
  | { type: 'SET_LOADING'; isLoading: boolean };

// State interface for the reducer
interface CalendarState {
  groups: CalendarGroup;
  dropdownItems: DropdownItem[];
  isLoading: boolean;
}

// Create the context with a default value
export const CalendarContext = createContext<CalendarContextType | null>(null);

// Custom hook to use the calendar context
export function useCalendarContext() {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendarContext must be used within a CalendarProvider');
  }
  return context;
}

// Memoized function to generate dropdown items from groups
const generateDropdownItems = memoize((groups: CalendarGroup): DropdownItem[] => {
  const items: DropdownItem[] = [];
  
  Object.keys(groups)
    .filter(key => !key.startsWith('__') && !key.startsWith('saved_'))
    .forEach(key => {
      items.push({
        text: key,
        value: key
      });
    });
  
  return items;
});

// Reducer function for predictable state updates
function calendarReducer(state: CalendarState, action: CalendarAction): CalendarState {
  switch (action.type) {
    case 'REFRESH_GROUPS':
      return {
        ...state,
        groups: action.groups,
      };
    case 'SET_DROPDOWN_ITEMS':
      return {
        ...state,
        dropdownItems: action.items,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.isLoading
      };
    default:
      return state;
  }
}

// Provider component
export function CalendarProvider({ children }: { children: React.ReactNode }) {
  // Initialize state with reducer
  const [state, dispatch] = useReducer(calendarReducer, {
    groups: CalendarManager.groups || {},
    dropdownItems: [],
    isLoading: false
  });
  
  // Reference to track previous groups
  const previousGroupsRef = useRef<string>('{}');

  // Create a stable refresh function that processes groups and updates dropdown items
  const refreshGroupsState = useCallback(() => {
    // Get latest groups from CalendarManager
    const currentGroups = CalendarManager.groups || {};
    const currentGroupsJSON = JSON.stringify(currentGroups);
    
    // Only update if there's an actual change
    if (currentGroupsJSON !== previousGroupsRef.current) {
      // Set loading state
      dispatch({ type: 'SET_LOADING', isLoading: true });
      
      // Update our reference
      previousGroupsRef.current = currentGroupsJSON;
      
      // Update groups state
      dispatch({ type: 'REFRESH_GROUPS', groups: { ...currentGroups } });
      
      // Generate and update dropdown items
      const items = generateDropdownItems(currentGroups);
      dispatch({ type: 'SET_DROPDOWN_ITEMS', items });
      
      Logger.debug('Updated dropdown items', { count: items.length });
      
      // Clear loading state
      dispatch({ type: 'SET_LOADING', isLoading: false });
    }
  }, []);
  
  // Create a throttled version of refreshGroupsState to avoid rapid updates
  // Using throttle instead of debounce to ensure updates happen promptly
  const throttledRefresh = useMemo(() => 
    throttle(refreshGroupsState, 300)
  , [refreshGroupsState]);
  
  // Set up listeners for calendar changes
  useEffect(() => {
    // Store the original callback to preserve it
    const originalOnGroupsChange = CalendarManager.onGroupsChange;
    
    // Define a cleanup function to track active listeners
    const cleanup = CalendarManager.addChangeListener(throttledRefresh);
    
    // Set our callback for backward compatibility
    CalendarManager.onGroupsChange = throttledRefresh;
    
    // Handle custom event
    const handleGroupsChanged = () => throttledRefresh();
    document.addEventListener('calendar-groups-changed', handleGroupsChanged);
    
    // Initial refresh with a delay to ensure everything is loaded
    const initTimeout = setTimeout(() => {
      throttledRefresh();
    }, 200);
    
    // Clean up
    return () => {
      document.removeEventListener('calendar-groups-changed', handleGroupsChanged);
      cleanup(); // Clean up our change listener
      
      // Restore original callback only if our callback was set
      if (CalendarManager.onGroupsChange === throttledRefresh || 
          CalendarManager.onGroupsChange === refreshGroupsState) {
        CalendarManager.onGroupsChange = originalOnGroupsChange;
      }
      
      clearTimeout(initTimeout);
    };
  }, [refreshGroupsState, throttledRefresh]);
  
  // Create memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo<CalendarContextType>(() => ({
    groups: state.groups,
    dropdownItems: state.dropdownItems,
    refreshGroupsState,
    isLoading: state.isLoading
  }), [state.groups, state.dropdownItems, state.isLoading, refreshGroupsState]);
  
  // Render the provider
  return (
    <CalendarContext.Provider value={contextValue}>
      {children}
    </CalendarContext.Provider>
  );
}
