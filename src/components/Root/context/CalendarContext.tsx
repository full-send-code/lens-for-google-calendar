import React, { createContext, useState, useContext } from 'react';
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

export function CalendarProvider({ children }: { children: React.ReactNode }) {
  const [groups, setGroups] = useState<CalendarGroup>(CalendarManager.groups || {});
  const [dropdownItems, setDropdownItems] = useState<DropdownItem[]>([]);
  
  // Group-related functions
  const refreshGroupsState = () => {
    setGroups({ ...CalendarManager.groups });
    
    // Update dropdown items
    const items: DropdownItem[] = [];
    for (const key in CalendarManager.groups) {
      if (!key.startsWith('__') && !key.startsWith('saved_')) {
        items.push({
          text: key,
          value: key
        });
      }
    }
    
    setDropdownItems(items);
  };
  
  // Set up the context value
  const contextValue = {
    groups,
    dropdownItems,
    refreshGroupsState,
  };
  
  return (
    <CalendarContext.Provider value={contextValue}>
      {children}
    </CalendarContext.Provider>
  );
}
